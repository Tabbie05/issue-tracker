# Issue Tracker

An internal issue tracking tool built for a consulting firm to log, manage, and track bugs, feature requests, and improvements across projects.

**Live Demo:** [https://issue-tracker-vert.vercel.app](https://issue-tracker-vert.vercel.app)

## Features

- **Issue Management** — Create, view, update, and delete issues with title, description, project, priority, status, and assignee
- **Dashboard** — View all issues with filter by project, priority, status, and assignee. Search by title or description. Status count cards
- **Issue Detail** — Full issue view with status change and threaded comments with timestamps
- **Charts** — Bar chart (issues by project) and pie chart (issues by priority)
- **CSV Export** — Download all issues as a CSV file
- **Dark Mode** — Toggle with system preference detection, persisted in localStorage
- **Real-time Updates** — Socket.io powered live dashboard refresh (localhost only)
- **Responsive** — Desktop table view and mobile card layout
- **REST API** — Full CRUD with server-side validation, proper HTTP status codes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Frontend | React 18, Vite |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Real-time | Socket.io |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Installation

```bash
git clone https://github.com/Tabbie05/issue-tracker.git
cd issue-tracker
npm install
cd client && npm install && cd ..
```

### Environment Variables

Create a `.env` file in the root:

```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

### Seed Database

```bash
npm run seed
```

This populates the database with 15 realistic sample issues across 4 projects.

### Run Development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/issues` | List issues (query: project, priority, status, assignee, search) |
| GET | `/api/issues/stats` | Aggregated counts by status, priority, project |
| GET | `/api/issues/meta` | Dropdown options for forms |
| GET | `/api/issues/export/csv` | Export all issues as CSV |
| GET | `/api/issues/:id` | Get single issue |
| POST | `/api/issues` | Create issue |
| PUT | `/api/issues/:id` | Update issue |
| PATCH | `/api/issues/:id/status` | Update status only |
| POST | `/api/issues/:id/comments` | Add comment |
| DELETE | `/api/issues/:id` | Delete issue |

## Project Structure

```
issue-tracker/
├── server/
│   ├── index.js              # Express server + Socket.io
│   ├── models/Issue.js       # Mongoose schema
│   ├── routes/issues.js      # API routes
│   ├── middleware/validation.js
│   └── seed.js               # Database seeder
├── client/src/
│   ├── api/issueApi.js       # Axios API wrapper
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── StatsCharts.jsx
│   ├── context/ThemeContext.jsx
│   └── pages/
│       ├── Dashboard.jsx
│       ├── CreateIssue.jsx
│       └── IssueDetail.jsx
├── api/index.js              # Vercel serverless handler
├── ARCHITECTURE.md
├── PROMPTS.md
└── vercel.json
```

## Author

Built by **Tabbie05** as part of a technical assessment.
