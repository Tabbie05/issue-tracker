const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Issue = require('./models/Issue');

dotenv.config();

const sampleIssues = [
  {
    title: 'Login page crashes on invalid email format',
    description: 'When a user enters an email without the @ symbol and clicks submit, the entire login page crashes with a white screen. Console shows TypeError. Need to add proper email validation before form submission.',
    project: 'Project Alpha',
    priority: 'Critical',
    status: 'Open',
    assignee: 'Rahul Sharma',
    comments: [
      { text: 'Reproduced this on Chrome and Firefox. Definitely a validation issue.', author: 'Priya Patel', createdAt: new Date('2026-02-25') }
    ]
  },
  {
    title: 'Add export to PDF feature for reports',
    description: 'Clients have requested the ability to export monthly reports as PDF documents. Should include charts, tables, and company branding. This is a feature request from the Q1 review meeting.',
    project: 'Project Alpha',
    priority: 'Medium',
    status: 'In Progress',
    assignee: 'Priya Patel',
    comments: []
  },
  {
    title: 'Database query timeout on large datasets',
    description: 'When the analytics dashboard loads data for more than 10,000 records, the database query times out after 30 seconds. Need to implement pagination or optimize the aggregation pipeline.',
    project: 'Project Beta',
    priority: 'High',
    status: 'Open',
    assignee: 'Amit Kumar',
    comments: [
      { text: 'Adding an index on the timestamp field might help. Will investigate.', author: 'Amit Kumar', createdAt: new Date('2026-02-26') }
    ]
  },
  {
    title: 'Update user profile page UI',
    description: 'The current user profile page looks outdated compared to the rest of the application. Need to redesign with the new component library and add avatar upload functionality.',
    project: 'Project Gamma',
    priority: 'Low',
    status: 'Open',
    assignee: 'Sneha Gupta',
    comments: []
  },
  {
    title: 'API rate limiting not working correctly',
    description: 'The rate limiter is allowing more than 100 requests per minute from a single IP. Tested with artillery load testing tool. The middleware configuration seems to be resetting the counter incorrectly.',
    project: 'Project Beta',
    priority: 'Critical',
    status: 'In Progress',
    assignee: 'Vikram Singh',
    comments: [
      { text: 'Found the issue - the Redis store was not properly connected. Fixing now.', author: 'Vikram Singh', createdAt: new Date('2026-02-27') }
    ]
  },
  {
    title: 'Mobile navigation menu not closing on link click',
    description: 'On mobile devices, when a user clicks a navigation link in the hamburger menu, the page navigates but the menu stays open. User has to manually close it. Affects all mobile breakpoints.',
    project: 'Project Alpha',
    priority: 'Medium',
    status: 'Resolved',
    assignee: 'Sneha Gupta',
    comments: [
      { text: 'Fixed by adding onClick handler to close menu state on navigation.', author: 'Sneha Gupta', createdAt: new Date('2026-02-28') }
    ]
  },
  {
    title: 'Implement two-factor authentication',
    description: 'As part of our security compliance requirements, we need to add optional two-factor authentication for all user accounts. Should support both authenticator apps (TOTP) and SMS-based verification.',
    project: 'Project Delta',
    priority: 'High',
    status: 'Open',
    assignee: 'Rahul Sharma',
    comments: [
      { text: 'Will use speakeasy library for TOTP generation. Starting with authenticator app support.', author: 'Rahul Sharma', createdAt: new Date('2026-02-27') }
    ]
  },
  {
    title: 'Fix CSV import parsing errors with special characters',
    description: 'When importing CSV files that contain commas within quoted fields or special Unicode characters, the parser breaks and imports corrupted data. Need to switch to a more robust CSV parsing library.',
    project: 'Project Beta',
    priority: 'High',
    status: 'In Progress',
    assignee: 'Priya Patel',
    comments: []
  },
  {
    title: 'Dashboard loading time exceeds 5 seconds',
    description: 'The main dashboard takes over 5 seconds to load on first visit. Profiling shows multiple unnecessary API calls and unoptimized images. Target is under 2 seconds for initial load.',
    project: 'Project Gamma',
    priority: 'Medium',
    status: 'Open',
    assignee: 'Amit Kumar',
    comments: [
      { text: 'Will implement lazy loading for charts and compress images.', author: 'Amit Kumar', createdAt: new Date('2026-03-01') }
    ]
  },
  {
    title: 'Add automated email notifications for status changes',
    description: 'When an issue status changes, the assignee and reporter should receive an email notification. Should be configurable - users can opt out of specific notification types in their settings.',
    project: 'Project Delta',
    priority: 'Medium',
    status: 'Open',
    assignee: 'Vikram Singh',
    comments: []
  },
  {
    title: 'Fix date picker showing wrong timezone',
    description: 'The date picker component displays dates in UTC instead of the users local timezone. This causes confusion when scheduling tasks - a meeting set for March 3rd shows as March 2nd for IST users.',
    project: 'Project Gamma',
    priority: 'High',
    status: 'Resolved',
    assignee: 'Sneha Gupta',
    comments: [
      { text: 'Resolved by converting all dates to local timezone before display using dayjs.', author: 'Sneha Gupta', createdAt: new Date('2026-02-28') },
      { text: 'Verified fix works across all timezones. Closing this.', author: 'Rahul Sharma', createdAt: new Date('2026-03-01') }
    ]
  },
  {
    title: 'Refactor authentication middleware for better testability',
    description: 'Current auth middleware is tightly coupled to the database layer making unit testing difficult. Need to refactor to use dependency injection pattern so we can mock the user repository in tests.',
    project: 'Project Delta',
    priority: 'Low',
    status: 'Closed',
    assignee: 'Amit Kumar',
    comments: [
      { text: 'Refactored and all 47 auth tests passing. PR merged.', author: 'Amit Kumar', createdAt: new Date('2026-02-26') }
    ]
  },
  {
    title: 'Implement search autocomplete for project finder',
    description: 'Add autocomplete/typeahead functionality to the project search bar. Should show matching projects as the user types with debounced API calls. Include project icon and recent search history.',
    project: 'Project Alpha',
    priority: 'Low',
    status: 'Open',
    assignee: 'Vikram Singh',
    comments: []
  },
  {
    title: 'Memory leak in WebSocket connection handler',
    description: 'Server memory usage grows steadily over time. Heap dump analysis shows WebSocket event listeners are not being cleaned up when clients disconnect. After 24 hours the server uses 2GB+ RAM.',
    project: 'Project Delta',
    priority: 'Critical',
    status: 'In Progress',
    assignee: 'Rahul Sharma',
    comments: [
      { text: 'Identified the leak - event listeners in the notification module. Working on cleanup logic.', author: 'Rahul Sharma', createdAt: new Date('2026-03-01') }
    ]
  },
  {
    title: 'Add dark mode support to client portal',
    description: 'Multiple clients have requested dark mode for the portal. Need to implement theme toggle with system preference detection. Should persist user preference across sessions using localStorage.',
    project: 'Project Gamma',
    priority: 'Low',
    status: 'Open',
    assignee: 'Priya Patel',
    comments: [
      { text: 'Design team has provided dark mode color palette. Will start implementation next sprint.', author: 'Priya Patel', createdAt: new Date('2026-03-01') }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Issue.deleteMany({});
    console.log('Cleared existing issues');

    const created = await Issue.insertMany(sampleIssues);
    console.log(`Seeded ${created.length} issues successfully`);

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
