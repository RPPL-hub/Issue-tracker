# Rwenzori Process Issue Tracker (RPL)

A simple, reliable web app for the Rwenzori Process team to **report, track, and
resolve** workplace issues in one shared place. Submit an issue, assign an owner,
and move it from **Open → In Progress → Resolved** with a single click — with a
live dashboard, a comment timeline, and automatic saving so no data is ever lost.

![Dashboard](https://img.shields.io/badge/status-MVP-2fbf71) ![Stack](https://img.shields.io/badge/Next.js-15-black)

## Features

- **Live dashboard** with KPI cards: Open, In Progress, Resolved, Critical Active
- **Issue ledger** — clean table with color-coded priority stripes and auto IDs (`RPL-101`, `RPL-102`, …)
- **Search & filter** by status, priority, or a global text search (ID, title, name)
- **Report form** (flyout) with validation: title, description, priority, department, reporter, assignee
- **Detail view** with a single-click workflow (`Open → In Progress → Resolved`)
- **Activity & comments thread** — every update permanently saved as an audit trail
- **Persistent storage** via a real database, so refreshing never loses data

## Tech stack

| Layer    | Choice                                            |
| -------- | ------------------------------------------------- |
| Frontend | Next.js 15 (App Router) + React 19 + Tailwind CSS |
| Backend  | Next.js Route Handlers (REST API)                 |
| Database | Prisma ORM + PostgreSQL (Neon)                     |

The frontend and backend live in **one app**, which keeps deployment simple.

## Run it locally

Requires Node.js 18+ (Node 22 recommended) and a free PostgreSQL database.
The easiest option is [Neon](https://neon.tech) — you can use the same free
database for both local development and production (see [DEPLOY.md](./DEPLOY.md)).

```bash
# 1. Install dependencies
npm install

# 2. Configure the database connection
cp .env.example .env
#    then edit .env and paste your Neon connection string into DATABASE_URL

# 3. Create the database tables and load sample data
npm run db:push
npm run db:seed

# 4. Start the dev server
npm run dev
```

Open <http://localhost:3000>.

## Useful scripts

| Script             | What it does                                          |
| ------------------ | ----------------------------------------------------- |
| `npm run dev`      | Start the development server                          |
| `npm run build`    | Production build (`prisma generate` + `next build`)   |
| `npm start`        | Run the production build                              |
| `npm run db:push`  | Apply the schema to the database                      |
| `npm run db:seed`  | Load sample issues (clears existing data first)       |
| `npm run db:reset` | Wipe + recreate + reseed the database                 |

## API

| Method  | Route                       | Purpose                              |
| ------- | --------------------------- | ------------------------------------ |
| `GET`   | `/api/issues`               | List all issues + KPI stats          |
| `POST`  | `/api/issues`               | Create a new issue                   |
| `GET`   | `/api/issues/:id`           | Get one issue with its comments      |
| `PATCH` | `/api/issues/:id`           | Advance status / reassign            |
| `POST`  | `/api/issues/:id/comments`  | Add a comment to the timeline        |

## Going live on your domain

See **[DEPLOY.md](./DEPLOY.md)** for step-by-step deployment and instructions to
connect your `rwenzori.in` domain.

## Roadmap (Phase 2)

Per the project blueprint, future work includes user accounts & roles (RBAC),
email/webhook notifications, and department-specific assignee rosters.
