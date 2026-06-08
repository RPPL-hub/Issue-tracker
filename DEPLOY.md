# Deploying to rwenzori.in (Neon + Vercel + GoDaddy)

This is the **free** hosting path, end to end. The app is already configured for
it — PostgreSQL via Prisma, and a `vercel-build` step that automatically creates
the database tables on first deploy. You just need to create two free accounts
and add one DNS record at GoDaddy.

> **What needs you:** creating the accounts and clicking through the steps below.
> I can't log into Neon, Vercel, or GoDaddy for you, but everything in the code
> is ready. Total time: ~15 minutes.

**Overview — three free pieces:**

1. **Neon** — a free PostgreSQL database that stores your issues.
2. **Vercel** — runs the app 24/7 and connects it to your domain.
3. **GoDaddy** — where you add one DNS record to point `rwenzori.in` at Vercel.

---

## Part 1 — Create the database (Neon)

1. Go to **[neon.tech](https://neon.tech)** and sign up (free, you can use GitHub).
2. Create a new project — name it e.g. `rwenzori-issue-tracker`. Pick the region
   closest to your team.
3. After it's created, open **Connection string** (a "Connect" button on the
   dashboard).
4. **Copy the connection string.** It looks like:
   ```
   postgresql://rpl_owner:AbC123xyz@ep-cool-name-12345.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   - If Neon offers a **"Connection pooling"** toggle, leave it **OFF** and copy
     the plain/direct string — it works for both creating the tables and running
     the app.
5. Keep this string handy for Part 2. Treat it like a password.

---

## Part 2 — Deploy the app (Vercel)

1. Make sure this repository is on GitHub (it is, in `RPPL-hub/Issue-tracker`).
2. Go to **[vercel.com](https://vercel.com)** and sign up with your GitHub account.
3. Click **Add New… → Project**, then **Import** the `Issue-tracker` repository.
4. Vercel auto-detects **Next.js** — leave the build settings as they are. (The
   app's `vercel-build` script handles creating the database tables for you.)
5. Expand **Environment Variables** and add:
   | Name           | Value                                      |
   | -------------- | ------------------------------------------ |
   | `DATABASE_URL` | _(paste your Neon connection string)_      |
6. Click **Deploy**. Vercel installs, creates your database tables, builds, and
   launches the app. When it finishes you'll get a URL like
   `https://issue-tracker-xxxx.vercel.app` — open it to confirm it works. ✅

### (Optional) Load sample data

Your live app starts **empty** (ready for real issues). If you'd like the demo
issues from the screenshots instead, run this once from your computer with the
same `DATABASE_URL` in your local `.env`:

```bash
npm install
npm run db:seed
```

---

## Part 3 — Connect your domain (GoDaddy)

I recommend a **subdomain**, `issues.rwenzori.in` — it's the simplest and leaves
your main `rwenzori.in` website untouched. (Steps for the bare domain are below too.)

### 3a. Tell Vercel about the domain

1. In Vercel, open your project → **Settings → Domains**.
2. Type `issues.rwenzori.in` and click **Add**.
3. Vercel will show you the exact DNS record to create — usually a **CNAME**
   pointing to `cname.vercel-dns.com`. Keep that tab open.

### 3b. Add the DNS record at GoDaddy

1. Sign in at **[godaddy.com](https://godaddy.com)** → **My Products** → find
   **rwenzori.in** → **DNS** (or "Manage DNS").
2. Click **Add New Record** and enter:
   | Field | Value                                       |
   | ----- | ------------------------------------------- |
   | Type  | `CNAME`                                     |
   | Name  | `issues`                                    |
   | Value | `cname.vercel-dns.com` _(use what Vercel shows)_ |
   | TTL   | leave default (1 hour)                      |
3. **Save.**
4. Back in Vercel, the domain will switch to **Valid / Active** once it detects
   the record (a few minutes, occasionally up to an hour). Vercel then issues a
   free **HTTPS certificate** automatically.
5. Visit **https://issues.rwenzori.in** — your team can now use it from anywhere. 🎉

### Using the bare domain `rwenzori.in` instead

If you want the app at the root (note: this replaces whatever is at rwenzori.in):

1. In Vercel add `rwenzori.in` (and optionally `www.rwenzori.in`).
2. At GoDaddy, add an **A** record: Name `@`, Value = the IP Vercel shows
   (currently `76.76.21.21`). If GoDaddy has a default `@` A record (often the
   "Parked" one), edit that one instead of adding a duplicate.
3. Optionally add a **CNAME**: Name `www`, Value `cname.vercel-dns.com`.

---

## After it's live

- **Updates:** every time changes are pushed to the repo's main branch, Vercel
  redeploys automatically.
- **Backups:** Neon keeps your data and supports point-in-time restore on its
  dashboard. You can also export the database any time.
- **Costs:** Neon and Vercel both have free tiers that comfortably cover an
  internal team tool. No payment needed to start.

## Phase 2 (later)

Per the project blueprint: user accounts & roles (login), email/webhook
notifications, and department-specific assignee dropdowns. None are required for
the app to run today.

---

**Stuck on any step?** Tell me where you are (and paste any error message) and
I'll get you unstuck.
