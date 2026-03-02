# AI Prompt Log — Issue Tracker Build

Documenting my AI usage throughout this assessment. I used **Claude (Claude Code CLI)** as my primary AI tool.

---

## Prompt 1 — Stack Decision
**What I asked:**
> "I need to build an internal issue tracker with REST API, MongoDB, and a React frontend. What's the best folder structure for a monorepo with Express backend and React (Vite) frontend? Keep it simple, no over-engineering."

**What I got:**
Suggested a clean monorepo with `server/` and `client/` directories, with models, routes, and middleware separation on the backend. I followed this structure.

---

## Prompt 2 — MongoDB Schema Design
**What I asked:**
> "Design a Mongoose schema for an Issue model. Fields: title, description, project (enum of 4), priority (Low/Medium/High/Critical), status (Open/In Progress/Resolved/Closed), assignee (enum of 5 team members), comments array with text and timestamp. Add proper validation and indexes."

**What I got:**
A clean schema with embedded comments subdocument, enum validation, text index for search, and compound index for filtering. I added minlength/maxlength constraints myself after reviewing.

---

## Prompt 3 — REST API Routes
**What I asked:**
> "Write Express routes for CRUD on issues. Need: GET all with query filters (project, priority, status, assignee, search), GET by ID, POST with validation, PUT update, PATCH for status-only update, POST comment to issue, GET stats aggregation, DELETE. Use proper HTTP status codes."

**What I got:**
Full route file with all endpoints. I reviewed and added proper error handling for CastError (invalid MongoDB IDs), and moved validation to separate middleware instead of inline.

---

## Prompt 4 — Server-Side Validation Middleware
**What I asked:**
> "Create Express middleware to validate issue creation: check all required fields exist, validate against allowed enum values, return 400 with specific error messages. Separate validators for issue, comment, and status update."

**What I got:**
Three validation functions. Clean and straightforward. I kept it as-is since it matched what I needed.

---

## Prompt 5 — Seed Data
**What I asked:**
> "Generate 15 realistic sample issues for an issue tracker. Spread across 4 projects (Alpha, Beta, Gamma, Delta), all priorities and statuses represented, 5 different assignees. Make descriptions sound like real developer issues — bugs, features, performance problems. Include some with comments."

**What I got:**
15 well-written issues with realistic descriptions. I edited a few to add more specific technical details and made sure the distribution across projects/statuses was balanced.

---

## Prompt 6 — React App Setup with Tailwind
**What I asked:**
> "Set up a React app with Vite and Tailwind CSS v4. Configure react-router-dom with routes for dashboard (/), create issue (/create), and issue detail (/issues/:id). Add a dark mode toggle using Tailwind's dark class strategy."

**What I got:**
Basic app structure with routing and Tailwind config. I had to fix the Tailwind v4 import syntax (uses `@import "tailwindcss"` instead of directives).

---

## Prompt 7 — Dashboard Component
**What I asked:**
> "Build a React dashboard component that fetches issues from API, shows filter dropdowns (project, priority, status, assignee), search bar, status count cards, and a table of issues. Make it responsive with Tailwind. Include loading and error states."

**What I got:**
Full dashboard with filter logic and responsive design. I fixed the search debouncing (was missing cleanup on unmount) and improved the mobile layout for the filters section.

---

## Prompt 8 — Issue Detail Page with Comments
**What I asked:**
> "Create an issue detail page in React. Show all fields, allow status change via dropdown, and have a comment form. Comments should show text, author, and formatted timestamp. Include back navigation."

**What I got:**
Detail page with status update and comment form. I added optimistic UI update for status changes and validation on the comment form.

---

## Prompt 9 — Issue Creation Form with Validation
**What I asked:**
> "Build a React form for creating issues with client-side validation. Dropdowns for project, priority, assignee. All fields required. Show inline error messages. On success, redirect to dashboard with a success message."

**What I got:**
Form component with controlled inputs and validation. I improved the error display and added a loading state on the submit button.

---

## Prompt 10 — Charts with Recharts
**What I asked:**
> "Add a simple bar chart showing issues by project and a pie chart showing issues by priority using Recharts. Fetch data from the /api/issues/stats endpoint."

**What I got:**
Two chart components. Had to adjust colors and sizing for responsive display. Works well.

---

## Prompt 11 — CSV Export & Socket.io Real-time
**What I asked:**
> "Add a CSV export button that hits /api/issues/export/csv and triggers download. Also set up Socket.io on the server to emit events on issue create/update, and listen on the client to auto-refresh the dashboard."

**What I got:**
CSV export with proper headers and real-time socket integration. The socket reconnection logic needed a small fix for cleanup on component unmount.

---

## Prompt 12 — Dark Mode Toggle
**What I asked:**
> "Implement dark mode toggle in React using Tailwind's dark class. Persist preference in localStorage. Toggle button in the navbar."

**What I got:**
Theme context with localStorage persistence. Clean toggle with sun/moon icons.

---

## Prompt 13 — Deployment Strategy
**What I asked:**
> "How to deploy this issue tracker tell me fast"

**What I got:**
Got a step-by-step guide to deploy using Render.com (free tier) — set up MongoDB Atlas for the database, connect GitHub repo to Render, configure build/start commands and environment variables. Fastest option for Express + React + MongoDB stack.

---

## Prompt 14 — Render CLI Commands
**What I asked:**
> "Can you give commands for Render?"

**What I got:**
Render doesn't have a CLI — it's UI-based. Got the exact field values to fill in (build command: `npm install && cd client && npm install && npm run build`, start command: `node server/index.js`). Also got Railway CLI as an alternative if I wanted command-line deployment.

---

## Key Debugging Moments

1. **MongoDB connection string** — Initially had `<db_password>` placeholder in the URI. Had to replace with actual password.
2. **Tailwind v4 syntax** — `@tailwind base` directives don't work in v4, needed `@import "tailwindcss"`.
3. **CORS issues** — Forgot to set up CORS on the Express server initially. Added `cors()` middleware.
4. **Search regex** — Special characters in search input could break the regex. Added escaping.
5. **Socket.io cleanup** — Was getting duplicate events because useEffect wasn't cleaning up socket listeners on unmount.

---

*All prompts were to Claude via Claude Code CLI. I reviewed, tested, and debugged every output before committing.*
