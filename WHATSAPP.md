# WhatsApp → AI → Issue Pipeline

The team keeps chatting in your existing WhatsApp group — nothing changes for
them. A dedicated "RPL Bot" account sits in the group as a member; every
message flows to this app, where Claude decides whether it's a real problem
report. Real issues are logged automatically and the bot confirms in the group.

```
Your WhatsApp group
  └── RPL Bot (its own number, added as a member)
        └── Whapi.Cloud gateway → POST /api/whatsapp/webhook
              ├── 1. Raw message saved to the database (audit trail)
              ├── 2. Claude classifies: issue report or just chatter?
              ├── 3. Issue → extracts title/priority/department → creates RPL-xxx
              └── 4. Bot replies: "✅ Logged as RPL-110 — Conveyor Belt B Jammed"
```

Messages that aren't issues (greetings, questions, "ok thanks", updates on
existing work) are stored but ignored. Every message is saved **before** AI
processing, so nothing is ever lost even if classification fails.

## What you need

| Thing | Cost | Where |
| --- | --- | --- |
| A dedicated number for the bot | ~$1–3/mo prepaid SIM | any carrier — **don't** use a personal number |
| Whapi.Cloud account (gateway) | ~$35/mo (~$29 annual); free trial | [whapi.cloud](https://whapi.cloud) |
| Anthropic API key (the AI) | ~$2–5/mo at team volumes | [console.anthropic.com](https://console.anthropic.com) |

> **Heads-up:** connecting a regular WhatsApp account through a gateway is
> against WhatsApp's Terms of Service. Using a dedicated SIM (not anyone's
> personal account), a managed gateway, and read-mostly behavior keeps the
> practical risk low — worst case is re-linking a new number, and the web
> form keeps working regardless.

## Setup (one time, ~20 minutes)

1. **Create the bot's WhatsApp.** Put the new SIM in any phone and register
   WhatsApp normally. Add this number to your team group.
2. **Connect it to Whapi.Cloud.** Sign up → create a **Channel** → scan the QR
   code from the bot phone (WhatsApp → Linked devices). Copy the channel's
   **API token**.
3. **Set the webhook.** In the channel settings, set the webhook URL to:
   ```
   https://YOUR-APP-DOMAIN/api/whatsapp/webhook?token=YOUR_SECRET
   ```
   with mode **messages / POST**. Generate the secret with
   `openssl rand -hex 24`.
4. **Find your group's chat id.** In Whapi's dashboard (or `GET /chats` in
   their API tester), find your team group — the id looks like
   `120363041234567890@g.us`.
5. **Add the environment variables** (Vercel → Project → Settings →
   Environment Variables), then redeploy:

   | Variable | Value |
   | --- | --- |
   | `ANTHROPIC_API_KEY` | from console.anthropic.com |
   | `WHATSAPP_WEBHOOK_SECRET` | the secret from step 3 |
   | `WHAPI_TOKEN` | the channel token from step 2 |
   | `WHATSAPP_GROUP_ID` | the chat id from step 4 |
   | `APP_BASE_URL` | e.g. `https://issues.rwenzori.in` (for links in replies) |

6. **Test it.** Post "The packing machine on line 2 just stopped working" in
   the group. Within a few seconds the bot should reply with a ✅ and the
   issue appears on the dashboard with a "via WhatsApp" tag.

## Tuning

- `WHATSAPP_MIN_CONFIDENCE` (default `0.7`) — raise toward `0.9` if the bot
  logs things it shouldn't; lower if it misses real reports.
- `ANTHROPIC_MODEL` (default `claude-haiku-4-5`) — set to a bigger Claude
  model if you want sharper judgment and don't mind ~5× the (still small) AI
  cost.
- The detection rules live in the system prompt in `src/lib/ai.ts` — edit the
  "count as an issue / don't count" lists to fit how your team writes.

## Testing without WhatsApp

You can exercise the whole pipeline with curl, no gateway needed:

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

With `ANTHROPIC_API_KEY` set, that creates a real issue. Without it, the
message is stored with verdict `no_ai` and skipped — useful for plumbing tests.

## Behavior details

- **Loop-safe:** the bot ignores its own messages (`from_me`).
- **Deduped:** gateway webhook retries are detected via the message id.
- **Group-scoped:** only `WHATSAPP_GROUP_ID` is processed (or all group chats
  if unset). Direct messages to the bot are ignored.
- **Text only (v1):** images/voice notes are stored as `skipped`. Captions and
  voice transcription are a natural Phase 2 upgrade, as is detecting "RPL-110
  is fixed" follow-ups and turning them into comments/status changes.
