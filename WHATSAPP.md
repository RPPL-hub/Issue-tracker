# WhatsApp → AI → Issue Pipeline

The team keeps chatting in your existing WhatsApp group — nothing changes for
them. A dedicated "RPL Bot" account sits in the group as a member; every message
flows to this app, where Claude decides whether it's a real problem report. Real
issues are logged automatically and the bot confirms in the group.

```
Your WhatsApp group
  └── RPL Bot device (its own number, added as a member)
        └── Worker (self-hosted) ──outbound HTTPS──▶ POST /api/whatsapp/webhook
              the app: saves the message (audit trail)
                     → Claude classifies: issue report or just chatter?
                     → issue → extracts title/priority/department → creates RPL-xxx
                     → returns "✅ Logged as RPL-110 — Conveyor Belt B Jammed"
        ◀── worker posts that confirmation back into the group
```

Messages that aren't issues (greetings, questions, "ok thanks", updates on
existing work) are stored but ignored. Every message is saved **before** AI
processing, so nothing is ever lost even if classification fails.

## Two ways to connect WhatsApp

| | Cost | Best for |
| --- | --- | --- |
| 💚 **Self-hosted worker** (recommended) | **~$5/mo** (or $0 on a PC you own) | Lowest running cost; included in this repo (`worker/`) |
| **Managed gateway (Whapi.Cloud)** | ~$30/mo | Zero maintenance, no server to run |

Both use the same dedicated number + the same app. Pick one. The self-hosted
path is below; the managed path is at the end.

## What you need (either path)

- **A dedicated number for the bot** (~$1–3/mo prepaid SIM) — **don't** use a
  personal WhatsApp. Register WhatsApp on it and add it to your team group.
- **An Anthropic API key** (~$2–5/mo) — [console.anthropic.com](https://console.anthropic.com).

> **Heads-up:** linking a WhatsApp account through any gateway (self-hosted or
> managed) is against WhatsApp's Terms of Service. A dedicated SIM (not a
> personal account) and read-mostly behavior keep the practical risk low —
> worst case is re-linking a new number, and the web form keeps working
> regardless.

---

## Path A — Self-hosted worker (~$5/month) ⭐

### 1. Set the app's environment variables

On Vercel → Project → Settings → Environment Variables, then redeploy:

| Variable | Value |
| --- | --- |
| `ANTHROPIC_API_KEY` | from console.anthropic.com |
| `WHATSAPP_WEBHOOK_SECRET` | a random secret — `openssl rand -hex 24` |
| `APP_BASE_URL` | e.g. `https://issues.rwenzori.in` (for links in replies) |
| `WHATSAPP_GROUP_ID` | _(add later, once you have the group id)_ |

Leave `WHAPI_TOKEN` **unset** — the worker sends confirmations itself.

### 2. Get a machine to run the worker 24/7

Pick whichever is cheapest for you:

- **Free cloud VM** — [Oracle Cloud "Always Free"](https://www.oracle.com/cloud/free/)
  gives a small Linux VM at **$0 forever**. (Google Cloud's free `e2-micro` works
  too.)
- **Cheap VPS** — Hetzner / similar, ~$4–6/mo, the most hassle-free.
- **A PC or Raspberry Pi you own** — $0, just keep it on with stable internet.

Install Node.js 18+ on it.

### 3. Run the worker

```bash
git clone <your repo>   # or copy the worker/ folder onto the machine
cd Issue-tracker/worker
cp .env.example .env
#   set WEBHOOK_URL = https://YOUR-APP-DOMAIN/api/whatsapp/webhook
#   set WEBHOOK_SECRET = the same value as WHATSAPP_WEBHOOK_SECRET on the app
npm install
npm start
```

A **QR code** prints. On the bot phone: **WhatsApp → Linked devices → Link a
device → scan**. Done once — the login is saved in `auth_info/`.

### 4. Lock it to your group

Post a message in the group; the worker logs the chat id (ends with `@g.us`).
Put that into `WHATSAPP_GROUP_ID` in the worker's `.env` **and** on the app, then
restart the worker.

### 5. Keep it running

```bash
npm install -g pm2
pm2 start index.js --name rpl-bot && pm2 save && pm2 startup
```

Now it restarts on crashes and reboots. (Full details:
[`worker/README.md`](./worker/README.md).)

### 6. Test it

Post "The packing machine on line 2 just stopped working" in the group. Within a
few seconds the bot replies with a ✅ and the issue appears on the dashboard with
a "via WhatsApp" tag.

---

## Path B — Managed gateway (Whapi.Cloud, ~$30/month)

No server to run; Whapi hosts the WhatsApp link for you.

1. Set the same app env vars as Path A, **plus** `WHAPI_TOKEN` (your Whapi
   channel token). With it set, the app posts confirmations via Whapi and the
   self-hosted worker is not needed.
2. Sign up at [whapi.cloud](https://whapi.cloud) → create a **Channel** → scan
   the QR from the bot phone → copy the channel **token** into `WHAPI_TOKEN`.
3. Set the channel's webhook (mode: messages / POST) to:
   ```
   https://YOUR-APP-DOMAIN/api/whatsapp/webhook?token=YOUR_WEBHOOK_SECRET
   ```
4. Find your group's id via Whapi's API tester and set `WHATSAPP_GROUP_ID`.
5. Test as in Path A, step 6.

---

## Tuning (both paths)

- `WHATSAPP_MIN_CONFIDENCE` (default `0.7`) — raise toward `0.9` if the bot logs
  things it shouldn't; lower if it misses real reports.
- `ANTHROPIC_MODEL` (default `claude-haiku-4-5`) — set to a bigger Claude model
  for sharper judgment at ~5× the (still small) AI cost.
- The detection rules live in the system prompt in `src/lib/ai.ts` — edit the
  "count as an issue / don't count" lists to fit how your team writes.

## Testing without WhatsApp

Exercise the whole pipeline with curl, no gateway needed:

```bash
curl -X POST "http://localhost:3000/api/whatsapp/webhook?token=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "id": "test-001",
      "from_me": false,
      "type": "text",
      "chat_id": "120363000000000000@g.us",
      "from": "256700000001",
      "from_name": "John Doe",
      "text": { "body": "Forklift 3 has a hydraulic leak near the dock, needs urgent attention" }
    }]
  }'
```

With `ANTHROPIC_API_KEY` set, that creates a real issue and the response
includes the `reply` text. Without it, the message is stored with verdict
`no_ai` and skipped — useful for plumbing tests.

## Behavior details

- **Loop-safe:** the bot ignores its own messages (`from_me`).
- **Deduped:** gateway/worker retries are detected via the message id.
- **Group-scoped:** only `WHATSAPP_GROUP_ID` is processed (or all group chats if
  unset). Direct messages to the bot are ignored.
- **Text only (v1):** images/voice notes are stored as `skipped`. Captions and
  voice transcription are a natural Phase 2 upgrade, as is detecting "RPL-110 is
  fixed" follow-ups and turning them into comments/status changes.
