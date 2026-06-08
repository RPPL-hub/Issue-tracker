# Deploying the Rwenzori Issue Tracker

This guide takes the app from your repository to a live site on **rwenzori.in**.

> **What needs you:** I can build the app and prepare everything, but the final
> "go live" steps happen in _your_ accounts — a hosting provider and your domain
> registrar (where rwenzori.in is managed). I can't log into those for you, but
> the steps below are short. Tell me which host you pick and I'll tailor the
> exact config.

---

## The big picture

A live web app needs three things:

1. **A host** that runs the app 24/7 (a server in the cloud).
2. **A database** that keeps your issues saved.
3. **A DNS record** at your domain registrar that points `rwenzori.in` at the host.

This app keeps the frontend, backend, and database setup together, so there's
only one thing to deploy.

---

## Recommended path

There are two beginner-friendly options. Pick **one**.

### Option A — Railway / Render (keeps SQLite, simplest mental model)

These hosts run the app on a small server with a **persistent disk**, so the
SQLite database file just lives on that disk. No separate database to manage.

1. Push this repo to GitHub (already done if you're reading this there).
2. Create an account at [railway.app](https://railway.app) or
   [render.com](https://render.com) and **"New Project → Deploy from GitHub"**,
   selecting this repository.
3. Add a **persistent disk/volume** mounted at `/data`.
4. Set environment variables:
   - `DATABASE_URL = file:/data/rpl.db`
5. Set the commands:
   - **Build:** `npm install && npm run build`
   - **Start:** `npm run db:push && npm start`
6. Deploy. The host gives you a temporary URL like `rpl-production.up.railway.app`
   — open it to confirm the app works.
7. (Optional, once) load sample data by running `npm run db:seed` from the host's
   shell. Skip this for a clean, empty tracker.

### Option B — Vercel + Neon Postgres (best free tier, serverless)

Vercel is purpose-built for Next.js but its servers don't keep a local file, so
the database lives in a free hosted Postgres (Neon).

1. Create a free Postgres database at [neon.tech](https://neon.tech) and copy its
   connection string.
2. In `prisma/schema.prisma`, change the datasource provider from `sqlite` to
   `postgresql`. _(One line — tell me and I'll do it and commit it.)_
3. Import the repo at [vercel.com](https://vercel.com) → **New Project**.
4. Set environment variable `DATABASE_URL` to your Neon connection string.
5. Deploy. Vercel runs the build and gives you a `*.vercel.app` URL to test.

---

## Connecting your domain (rwenzori.in)

Once the app is live on the host's temporary URL, point your domain at it. I
recommend a **subdomain** like `issues.rwenzori.in` — it's the easiest and you
can keep your main site separate.

1. In your host's dashboard, open the project's **Domains / Custom Domain**
   settings and add `issues.rwenzori.in` (or the bare `rwenzori.in`). The host
   will show you a DNS target — either:
   - a **CNAME** value (e.g. `cname.vercel-dns.com` or `xxx.up.railway.app`), or
   - an **A record** IP address.
2. Log in to **wherever rwenzori.in is registered** (e.g. GoDaddy, Namecheap,
   Cloudflare) and open its **DNS settings**.
3. Add the record the host asked for:
   - For a subdomain: a **CNAME** record, Host/Name `issues`, Value = the target
     from step 1.
   - For the bare domain: an **A** record, Host/Name `@`, Value = the IP.
4. Save. DNS changes can take from a few minutes up to a few hours to propagate.
5. The host automatically issues a free **HTTPS certificate** once it sees the
   record. Then `https://issues.rwenzori.in` is live for your whole team. 🎉

---

## After it's live

- **Backups:** the entire database is the file at `DATABASE_URL` (Option A) or
  your Neon dashboard (Option B). Download it periodically to be safe.
- **Phase 2:** logins/roles, email notifications, and department rosters are the
  planned next features — none are required for the app to run today.

---

### Not sure which to choose?

Tell me your priority — **lowest effort**, **completely free**, or **most
control** — and I'll recommend one and prepare the exact files/commands for it.
