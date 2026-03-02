# Architecture — Issue Tracker

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend** | Node.js + Express | Fast to build, well-suited for REST APIs, huge ecosystem. Express is lightweight and gives full control over middleware and routing. |
| **Database** | MongoDB (Atlas) + Mongoose | NoSQL fits well for issues with variable comment arrays. Mongoose provides schema validation and clean query API. Cloud-hosted Atlas means zero DB setup. |
| **Frontend** | React 18 + Vite | Component-based architecture makes it easy to build reusable UI elements. Vite provides instant HMR and fast builds. |
| **Styling** | Tailwind CSS v4 | Utility-first approach means responsive design and dark mode come almost for free. No context-switching between CSS files. |
| **Real-time** | Socket.io | Enables live dashboard updates when issues are created/updated/deleted without polling. |
| **Charts** | Recharts | Lightweight React charting library. Easy to create bar and pie charts from the stats API data. |

## Database Schema

### Issues Collection

```
{
  _id: ObjectId,
  title: String (required, 3-200 chars),
  description: String (required, min 10 chars),
  project: String (enum: Project Alpha | Beta | Gamma | Delta),
  priority: String (enum: Low | Medium | High | Critical),
  status: String (enum: Open | In Progress | Resolved | Closed),
  assignee: String (enum: 5 team members),
  comments: [{
    text: String (required),
    author: String (default: "System"),
    createdAt: Date
  }],
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- Text index on `title` + `description` (for search)
- Compound index on `project`, `priority`, `status`, `assignee` (for filtering)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/issues` | List issues (supports `?project=`, `?priority=`, `?status=`, `?assignee=`, `?search=`) |
| `GET` | `/api/issues/stats` | Aggregated counts by status, priority, project |
| `GET` | `/api/issues/meta` | Get dropdown options (projects, priorities, statuses, assignees) |
| `GET` | `/api/issues/export/csv` | Export all issues as CSV download |
| `GET` | `/api/issues/:id` | Get single issue with comments |
| `POST` | `/api/issues` | Create new issue (validated) |
| `PUT` | `/api/issues/:id` | Full update of issue |
| `PATCH` | `/api/issues/:id/status` | Update status only |
| `POST` | `/api/issues/:id/comments` | Add comment to issue |
| `DELETE` | `/api/issues/:id` | Delete issue |
| `GET` | `/api/health` | Health check |

All endpoints return proper HTTP status codes (200, 201, 400, 404, 500) and JSON error messages.

## Component Structure

```
client/src/
├── api/
│   └── issueApi.js          # Axios API wrapper for all endpoints
├── components/
│   ├── Navbar.jsx            # Navigation with dark mode toggle
│   └── StatsCharts.jsx       # Bar + Pie charts for stats
├── context/
│   └── ThemeContext.jsx       # Dark/light mode state + localStorage
├── pages/
│   ├── Dashboard.jsx          # Main view: filters, search, issues table/cards
│   ├── CreateIssue.jsx        # Issue creation form with validation
│   └── IssueDetail.jsx        # Full issue view, status change, comments
├── App.jsx                    # Router setup
└── main.jsx                   # Entry point
```

## Key Design Decisions

1. **Server-side validation middleware** — Never trust the client. All inputs are validated in Express middleware before hitting the database.
2. **Embedded comments** — Comments are embedded in the Issue document (not a separate collection) because they're always accessed together and the count per issue is low.
3. **Regex search over text index** — Used `$regex` with `$options: 'i'` for search instead of MongoDB text search because it supports partial matching (better UX for real-time search).
4. **Separate mobile/desktop views** — Desktop gets a table, mobile gets cards. No CSS hacks, just Tailwind responsive classes.
5. **Socket.io for real-time** — Server emits events on CRUD operations, client auto-refreshes the dashboard. No manual refresh needed.

## What I'd Improve With More Time

- **Authentication** — Add JWT-based auth so each team member has their own login and can only modify their assigned issues
- **Pagination** — Current implementation loads all issues. With 1000+ issues, would need server-side pagination with cursor-based approach
- **File attachments** — Allow attaching screenshots to issues (S3 + presigned URLs)
- **Activity log** — Track all status changes and assignments as an audit trail
- **Drag-and-drop Kanban** — A board view where issues can be dragged between status columns
- **Email notifications** — Notify assignees when issues are assigned or status changes
- **Testing** — Add Jest for API tests and React Testing Library for component tests
- **CI/CD** — GitHub Actions pipeline for lint, test, build, deploy
- **Rate limiting** — Add express-rate-limit to prevent API abuse
- **Input sanitization** — Add DOMPurify or similar for XSS protection on user-generated content
