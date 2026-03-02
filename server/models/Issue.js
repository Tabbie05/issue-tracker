const mongoose = require('mongoose');

const PROJECTS = ['Project Alpha', 'Project Beta', 'Project Gamma', 'Project Delta'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const TEAM_MEMBERS = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Gupta', 'Vikram Singh'];

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  author: { type: String, default: 'System' },
  createdAt: { type: Date, default: Date.now }
});

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title must be under 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters']
  },
  project: {
    type: String,
    required: [true, 'Project is required'],
    enum: { values: PROJECTS, message: 'Invalid project' }
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: { values: PRIORITIES, message: 'Invalid priority' }
  },
  status: {
    type: String,
    required: true,
    enum: { values: STATUSES, message: 'Invalid status' },
    default: 'Open'
  },
  assignee: {
    type: String,
    required: [true, 'Assignee is required'],
    enum: { values: TEAM_MEMBERS, message: 'Invalid assignee' }
  },
  assigneeEmail: {
    type: String,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  comments: [commentSchema]
}, {
  timestamps: true
});

// Index for search and filtering
issueSchema.index({ title: 'text', description: 'text' });
issueSchema.index({ project: 1, priority: 1, status: 1, assignee: 1 });

module.exports = mongoose.model('Issue', issueSchema);
module.exports.PROJECTS = PROJECTS;
module.exports.PRIORITIES = PRIORITIES;
module.exports.STATUSES = STATUSES;
module.exports.TEAM_MEMBERS = TEAM_MEMBERS;
