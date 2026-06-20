#!/usr/bin/env bash
#
# Provision a fresh Ubuntu Server to run the RPL WhatsApp worker under pm2.
# Safe to re-run. Installs Node 22 LTS (if needed), pm2, and the worker's
# dependencies, then scaffolds .env and prints the next steps.
#
#   bash worker/deploy/ubuntu-setup.sh
#
set -euo pipefail

# This script lives in worker/deploy/ — resolve the worker dir from it.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

MIN_NODE_MAJOR=20      # Baileys 7 needs Node 18+; we require 20+ to be safe
NODE_SETUP_VERSION=22  # LTS to install when Node is missing or too old

log()  { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!]\033[0m  %s\n' "$*"; }

# --- Node.js -----------------------------------------------------------------
need_node=1
if command -v node >/dev/null 2>&1; then
  current_major="$(node -v | sed 's/^v\([0-9]*\).*/\1/')"
  if [ "$current_major" -ge "$MIN_NODE_MAJOR" ]; then
    log "Node $(node -v) already present — skipping install."
    need_node=0
  else
    warn "Node $(node -v) is older than v${MIN_NODE_MAJOR}; upgrading to ${NODE_SETUP_VERSION}.x."
  fi
fi

if [ "$need_node" -eq 1 ]; then
  log "Installing Node.js ${NODE_SETUP_VERSION} LTS via NodeSource…"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_SETUP_VERSION}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# --- pm2 ---------------------------------------------------------------------
if command -v pm2 >/dev/null 2>&1; then
  log "pm2 $(pm2 -v) already installed."
else
  log "Installing pm2 globally…"
  sudo npm install -g pm2
fi

# --- worker dependencies -----------------------------------------------------
log "Installing worker dependencies…"
cd "$WORKER_DIR"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

# --- .env scaffold -----------------------------------------------------------
if [ -f .env ]; then
  log ".env already exists — leaving it untouched."
else
  cp .env.example .env
  warn "Created worker/.env from the template — edit it before starting:"
  warn "    WEBHOOK_URL    = https://YOUR-APP-DOMAIN/api/whatsapp/webhook"
  warn "    WEBHOOK_SECRET = (must match WHATSAPP_WEBHOOK_SECRET on the app)"
fi

# --- next steps --------------------------------------------------------------
cat <<'EOF'

------------------------------------------------------------------
Provisioning done. Next steps:

  1. Edit the worker config:     nano worker/.env
  2. First-time link (scan QR):  cd worker && npm start
       Scan the QR on the bot phone (WhatsApp > Linked devices >
       Link a device). When you see "Connected to WhatsApp",
       press Ctrl-C. The login is saved in worker/auth_info/.
  3. Hand off to pm2:            pm2 start ecosystem.config.cjs
                                 pm2 save
                                 pm2 startup   # run the line it prints
  4. Lock to your group: post in the group, copy the @g.us id from
     `pm2 logs rpl-bot`, set WHATSAPP_GROUP_ID in worker/.env, then
     `pm2 restart rpl-bot`.

  Day to day:  pm2 status | pm2 logs rpl-bot | pm2 monit

Full runbook: worker/deploy/README.md
------------------------------------------------------------------
EOF
