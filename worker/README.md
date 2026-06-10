# RPL WhatsApp Worker (self-hosted)

Bridges your team's WhatsApp group to the Issue Tracker for **~$5/month** (or $0
on a machine you already own). It links as the bot's WhatsApp device, forwards
group messages to your deployed app's webhook, and posts the "✅ Logged"
confirmation back into the group. See [`../WHATSAPP.md`](../WHATSAPP.md) for the
full picture and the recommended free/cheap host.

## Prerequisites

- A **dedicated** WhatsApp number (a cheap prepaid SIM — **not** a personal
  number), already added to your team group.
- **Node.js 18+** on the machine that runs this 24/7 (a small cloud VM, or a
  PC / Raspberry Pi you own).
- The app already deployed, with `WHATSAPP_WEBHOOK_SECRET` and
  `ANTHROPIC_API_KEY` set.

## Setup

```bash
cd worker
cp .env.example .env
#   edit .env: set WEBHOOK_URL and WEBHOOK_SECRET (secret must match the app)
npm install
npm start
```

On first run a **QR code** prints in the terminal. On the bot phone, open
**WhatsApp → Linked devices → Link a device** and scan it. The session is saved
in `auth_info/`, so you only link once.

Post a message in your group — the worker logs a line with the chat id. Copy
your group's id (ends with `@g.us`) into `WHATSAPP_GROUP_ID` in `.env` (and on
the app), then restart to limit the bot to just that group.

## Keep it running

Use **pm2** so it survives crashes and reboots:

```bash
npm install -g pm2
pm2 start index.js --name rpl-bot
pm2 save
pm2 startup   # run the one command it prints
```

## Notes

- `auth_info/` is the bot's login — keep it private, never commit it. Deleting
  it logs the bot out (re-scan to re-link).
- The worker only **reads** group messages and **sends confirmations**; all the
  classification and issue logic lives in the app, so there's nothing to
  configure here beyond the webhook URL and secret.
