# Deploying the WhatsApp worker on Ubuntu Server (pm2)

Production setup for the `worker/` Baileys bot on a **headless Ubuntu Server**,
managed by **pm2**. This replaces running the bot on a desktop (e.g. Zorin),
where the whole machine would slow down and freeze after a few days — a
**resource** problem, not a code one. A lean headless server plus pm2
(auto-restart on crash **and** on reboot) fixes that.

> Baileys talks to WhatsApp over a WebSocket — **no Chromium/Puppeteer** — so all
> you need is Node 18+ (this kit installs Node 22 LTS). The worker makes only
> **outbound** connections, so **no inbound firewall ports are required**.

## Prerequisites

- Ubuntu Server with a sudo user and internet access.
- The dashboard already deployed, with `WHATSAPP_WEBHOOK_SECRET` (and
  `ANTHROPIC_API_KEY`) set on it.
- The bot's dedicated WhatsApp number on a phone you can scan a QR with.

## 1. Get the code onto the server

```bash
git clone <your repo url>
cd Issue-tracker
```

**Migrating from the old machine?** To skip re-scanning the QR you can copy the
saved session across — but **stop the old bot first**, or WhatsApp keeps kicking
one of the two off (the classic disconnect loop):

```bash
# on the OLD machine: stop it, then copy the session to the new server
pm2 stop rpl-bot          # or Ctrl-C if it ran in the foreground
scp -r worker/auth_info <user>@<new-server>:~/Issue-tracker/worker/
```

(Prefer a clean start? Skip this and just re-link in step 4.)

## 2. Run the setup script

```bash
bash worker/deploy/ubuntu-setup.sh
```

Installs Node 22 LTS (if needed), pm2, and the worker's dependencies, then
creates `worker/.env` from the template.

## 3. Configure `.env`

```bash
nano worker/.env
```

Set `WEBHOOK_URL` and `WEBHOOK_SECRET` (the secret must match the app's
`WHATSAPP_WEBHOOK_SECRET`).

## 4. First-time link (scan the QR)

```bash
cd worker
npm start
```

A QR code prints. On the bot phone: **WhatsApp → Linked devices → Link a device →
scan**. When it logs `Connected to WhatsApp`, press **Ctrl-C** — the login is now
saved in `worker/auth_info/`. (Skip this if you copied `auth_info/` in step 1.)

## 5. Hand off to pm2

```bash
pm2 start ecosystem.config.cjs   # from the worker/ directory
pm2 save                         # remember this process list
pm2 startup                      # then run the one command it prints
```

`pm2 save` + `pm2 startup` is what brings the bot back **after a reboot**.

## 6. Lock the bot to your group

Post any message in the team group, then find the id (ends with `@g.us`):

```bash
pm2 logs rpl-bot
```

Put it in `WHATSAPP_GROUP_ID` in `worker/.env` (and on the app), then:

```bash
pm2 restart rpl-bot
```

## Running it day to day

```bash
pm2 status            # is it up?
pm2 logs rpl-bot      # live logs (and the QR, if it ever needs re-linking)
pm2 restart rpl-bot   # apply .env changes
pm2 monit             # live CPU / memory dashboard
```

### Keep an eye on the box (so it never "freezes" again)

The old freeze was the machine running out of resources. On a headless server
that's far less likely, but you can check health any time:

```bash
free -m     # memory (MB)
df -h       # disk usage
htop        # interactive process viewer (sudo apt install htop)
uptime      # load average
```

Optional hardening — remember the worker needs **no** inbound ports:

```bash
sudo apt update && sudo apt upgrade -y   # stay patched
sudo ufw allow OpenSSH                    # keep SSH reachable…
sudo ufw enable                           # …then turn the firewall on
```

> Reaching this box over Tailscale? Allow that interface too, e.g.
> `sudo ufw allow in on tailscale0`.

## Notes

- `worker/auth_info/` is the bot's login — it's git-ignored; keep it private.
  Deleting it logs the bot out (re-scan to re-link).
- `worker/.env` is git-ignored too, so secrets never get committed.
- Seeing `Logged out` in the logs? Delete `auth_info/` and repeat step 4.
