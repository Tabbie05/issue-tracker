const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const { validateIssue, validateComment, validateStatusUpdate } = require('../middleware/validation');

// GET /api/issues - List all issues with filters
router.get('/', async (req, res) => {
  try {
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

// GET /api/issues/stats - Get issue statistics
router.get('/stats', async (req, res) => {
  try {
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

// GET /api/issues/export/csv - Export issues as CSV
router.get('/export/csv', async (req, res) => {
  try {
    const issues = await Issue.find().lean();
    const { Parser } = require('json2csv');

    const fields = ['title', 'description', 'project', 'priority', 'status', 'assignee', 'createdAt', 'updatedAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(issues);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=issues.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV', details: err.message });
  }
});

// GET /api/issues/meta - Get dropdown options
router.get('/meta', async (req, res) => {
  res.json({
    projects: Issue.schema.path('project').enumValues,
    priorities: Issue.schema.path('priority').enumValues,
    statuses: Issue.schema.path('status').enumValues,
    assignees: Issue.schema.path('assignee').enumValues
  });
});

// GET /api/issues/:id - Get single issue
router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }
    res.status(500).json({ error: 'Failed to fetch issue', details: err.message });
  }
});

// POST /api/issues - Create new issue
router.post('/', validateIssue, async (req, res) => {
  try {
    const { title, description, project, priority, assignee, status } = req.body;
    const issue = new Issue({ title, description, project, priority, assignee, status: status || 'Open' });
    await issue.save();

    const io = req.app.get('io');
    if (io) io.emit('issueCreated', issue);

    res.status(201).json(issue);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    res.status(500).json({ error: 'Failed to create issue', details: err.message });
  }
});

// PUT /api/issues/:id - Update issue
router.put('/:id', validateIssue, async (req, res) => {
  try {
    const { title, description, project, priority, assignee, status } = req.body;
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { title, description, project, priority, assignee, status },
      { new: true, runValidators: true }
    );
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const io = req.app.get('io');
    if (io) io.emit('issueUpdated', issue);

    res.json(issue);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    res.status(500).json({ error: 'Failed to update issue', details: err.message });
  }
});

// PATCH /api/issues/:id/status - Update issue status only
router.patch('/:id/status', validateStatusUpdate, async (req, res) => {
  try {
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const io = req.app.get('io');
    if (io) io.emit('issueUpdated', issue);

    res.json(issue);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }
    res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
});

// POST /api/issues/:id/comments - Add comment to issue
router.post('/:id/comments', validateComment, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    issue.comments.push({ text: req.body.text, author: req.body.author || 'Anonymous' });
    await issue.save();

    const io = req.app.get('io');
    if (io) io.emit('issueUpdated', issue);

    res.status(201).json(issue);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }
    res.status(500).json({ error: 'Failed to add comment', details: err.message });
  }
});

// DELETE /api/issues/:id - Delete issue
router.delete('/:id', async (req, res) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const io = req.app.get('io');
    if (io) io.emit('issueDeleted', req.params.id);

    res.json({ message: 'Issue deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }
    res.status(500).json({ error: 'Failed to delete issue', details: err.message });
  }
});

module.exports = router;
