const { PROJECTS, PRIORITIES, STATUSES, TEAM_MEMBERS } = require('../models/Issue');

function validateIssue(req, res, next) {
  const { title, description, project, priority, assignee, status } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Title is required and must be at least 3 characters');
  }
  if (title && title.trim().length > 200) {
    errors.push('Title must be under 200 characters');
  }
  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Description is required and must be at least 10 characters');
  }
  if (!project || !PROJECTS.includes(project)) {
    errors.push(`Project must be one of: ${PROJECTS.join(', ')}`);
  }
  if (!priority || !PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${PRIORITIES.join(', ')}`);
  }
  if (!assignee || !TEAM_MEMBERS.includes(assignee)) {
    errors.push(`Assignee must be one of: ${TEAM_MEMBERS.join(', ')}`);
  }
  if (status && !STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

function validateComment(req, res, next) {
  const { text } = req.body;
  const errors = [];

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    errors.push('Comment text is required');
  }
  if (text && text.trim().length > 1000) {
    errors.push('Comment must be under 1000 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

function validateStatusUpdate(req, res, next) {
  const { status } = req.body;

  if (!status || !STATUSES.includes(status)) {
    return res.status(400).json({
      error: 'Validation failed',
      details: [`Status must be one of: ${STATUSES.join(', ')}`]
    });
  }

  next();
}

module.exports = { validateIssue, validateComment, validateStatusUpdate };
