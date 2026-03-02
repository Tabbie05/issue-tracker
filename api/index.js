const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection (reuse across serverless invocations)
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
}

// Import model and routes inline to avoid path issues
const Issue = require('../server/models/Issue');
const { validateIssue, validateComment, validateStatusUpdate } = require('../server/middleware/validation');
const { sendAssignmentEmail } = require('../server/utils/emailService');

// --- ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/issues/stats
app.get('/api/issues/stats', async (req, res) => {
  try {
    await connectDB();
    const [statusCounts, priorityCounts, projectCounts] = await Promise.all([
      Issue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Issue.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Issue.aggregate([{ $group: { _id: '$project', count: { $sum: 1 } } }])
    ]);
    const total = await Issue.countDocuments();
    res.json({
      total,
      byStatus: Object.fromEntries(statusCounts.map(s => [s._id, s.count])),
      byPriority: Object.fromEntries(priorityCounts.map(p => [p._id, p.count])),
      byProject: Object.fromEntries(projectCounts.map(p => [p._id, p.count]))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats', details: err.message });
  }
});

// GET /api/issues/export/csv
app.get('/api/issues/export/csv', async (req, res) => {
  try {
    await connectDB();
    const issues = await Issue.find().lean();
    const { Parser } = require('json2csv');
    const fields = ['title', 'description', 'project', 'priority', 'status', 'assignee', 'assigneeEmail', 'createdAt', 'updatedAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(issues);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=issues.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV', details: err.message });
  }
});

// GET /api/issues/meta
app.get('/api/issues/meta', (req, res) => {
  res.json({
    projects: Issue.schema.path('project').enumValues,
    priorities: Issue.schema.path('priority').enumValues,
    statuses: Issue.schema.path('status').enumValues,
    assignees: Issue.schema.path('assignee').enumValues
  });
});

// POST /api/issues/notify/:id
app.post('/api/issues/notify/:id', async (req, res) => {
  try {
    await connectDB();
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    if (!issue.assigneeEmail) {
      return res.status(400).json({ error: 'No email provided for this assignee. Edit the issue to add an email.' });
    }
    const result = await sendAssignmentEmail(issue, 'assigned');
    if (result.success) {
      res.json({ message: `Notification sent to ${issue.assignee} (${issue.assigneeEmail})` });
    } else {
      res.status(500).json({ error: `Failed to send: ${result.reason}` });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification', details: err.message });
  }
});

// GET /api/issues
app.get('/api/issues', async (req, res) => {
  try {
    await connectDB();
    const { project, priority, status, assignee, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    const filter = {};
    if (project) filter.project = project;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const sortOrder = order === 'asc' ? 1 : -1;
    const issues = await Issue.find(filter).sort({ [sortBy]: sortOrder });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch issues', details: err.message });
  }
});

// GET /api/issues/:id
app.get('/api/issues/:id', async (req, res) => {
  try {
    await connectDB();
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid issue ID' });
    res.status(500).json({ error: 'Failed to fetch issue', details: err.message });
  }
});

// POST /api/issues
app.post('/api/issues', validateIssue, async (req, res) => {
  try {
    await connectDB();
    const { title, description, project, priority, assignee, assigneeEmail, status } = req.body;
    const issue = new Issue({ title, description, project, priority, assignee, assigneeEmail, status: status || 'Open' });
    await issue.save();

    // Send email notification to assignee
    if (assigneeEmail) {
      sendAssignmentEmail(issue, 'assigned').catch(() => {});
    }

    res.status(201).json(issue);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: Object.values(err.errors).map(e => e.message) });
    }
    res.status(500).json({ error: 'Failed to create issue', details: err.message });
  }
});

// PUT /api/issues/:id
app.put('/api/issues/:id', validateIssue, async (req, res) => {
  try {
    await connectDB();
    const { title, description, project, priority, assignee, assigneeEmail, status } = req.body;

    // Check if assignee changed for email notification
    const oldIssue = await Issue.findById(req.params.id);
    const assigneeChanged = oldIssue && oldIssue.assignee !== assignee;

    const issue = await Issue.findByIdAndUpdate(req.params.id, { title, description, project, priority, assignee, assigneeEmail, status }, { new: true, runValidators: true });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Send email if assignee changed and email provided
    if (assigneeChanged && assigneeEmail) {
      sendAssignmentEmail(issue, 'reassigned').catch(() => {});
    }

    res.json(issue);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid issue ID' });
    res.status(500).json({ error: 'Failed to update issue', details: err.message });
  }
});

// PATCH /api/issues/:id/status
app.patch('/api/issues/:id/status', validateStatusUpdate, async (req, res) => {
  try {
    await connectDB();
    const issue = await Issue.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid issue ID' });
    res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
});

// POST /api/issues/:id/comments
app.post('/api/issues/:id/comments', validateComment, async (req, res) => {
  try {
    await connectDB();
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    issue.comments.push({ text: req.body.text, author: req.body.author || 'Anonymous' });
    await issue.save();
    res.status(201).json(issue);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid issue ID' });
    res.status(500).json({ error: 'Failed to add comment', details: err.message });
  }
});

// DELETE /api/issues/:id
app.delete('/api/issues/:id', async (req, res) => {
  try {
    await connectDB();
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json({ message: 'Issue deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid issue ID' });
    res.status(500).json({ error: 'Failed to delete issue', details: err.message });
  }
});

module.exports = app;
