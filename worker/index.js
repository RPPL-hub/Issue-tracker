import "dotenv/config";
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
} from "baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";

// Self-hosted WhatsApp bridge for the Rwenzori Issue Tracker.
// Links as the bot's WhatsApp device, forwards group messages to the app's
// webhook (in the same payload shape Whapi uses, so the server code is
// identical), and posts the "✅ Logged" confirmation the webhook returns.

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const GROUP_ID = process.env.WHATSAPP_GROUP_ID || "";
const AUTH_DIR = process.env.AUTH_DIR || "auth_info";

if (!WEBHOOK_URL || !WEBHOOK_SECRET) {
  console.error(
    "Missing WEBHOOK_URL or WEBHOOK_SECRET. Copy .env.example to .env and fill them in.",
  );
  process.exit(1);
}

const logger = pino({ level: process.env.LOG_LEVEL || "warn" });

function extractText(message) {
  if (!message) return "";
  if (typeof message.conversation === "string") return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return message.imageMessage.caption;
  return "";
}

function messageType(message) {
  if (!message) return "unknown";
  if (message.conversation || message.extendedTextMessage) return "text";
  if (message.imageMessage) return "image";
  if (message.videoMessage) return "video";
  if (message.audioMessage) return "audio";
  if (message.documentMessage) return "document";
  return "unknown";
}

function phoneFromJid(jid) {
  if (!jid) return "unknown";
  return jid.split("@")[0].split(":")[0];
}

// Forward a batch of WhatsApp messages to the app and post back any replies.
async function deliver(sock, waMessages) {
  const payload = {
    messages: waMessages.map((m) => ({
      id: m.key.id,
      from_me: Boolean(m.key.fromMe),
      type: messageType(m.message),
      chat_id: m.key.remoteJid,
      from: phoneFromJid(m.key.participant || m.key.remoteJid),
      from_name: m.pushName || phoneFromJid(m.key.participant || m.key.remoteJid),
      text: { body: extractText(m.message) },
    })),
  };

  let res;
  try {
    res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-token": WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    logger.error({ err }, "Could not reach the app webhook");
    return;
  }

  if (!res.ok) {
    logger.error(`Webhook returned HTTP ${res.status}`);
    return;
  }

  const data = await res.json().catch(() => null);
  const results = Array.isArray(data?.results) ? data.results : [];

  for (const r of results) {
    const tag = r.issueId ? ` RPL-${r.issueId}` : "";
    console.log(
      `[${new Date().toISOString()}] ${r.chatId} — ${r.action}${tag}`,
    );
    if (r.reply && r.chatId) {
      try {
        await sock.sendMessage(r.chatId, { text: r.reply });
      } catch (err) {
        logger.error({ err }, "Failed to send confirmation");
      }
    }
  }
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  let version;
  try {
    ({ version } = await fetchLatestBaileysVersion());
  } catch {
    logger.warn("Could not fetch latest WhatsApp version; using bundled default");
  }

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: Browsers.ubuntu("RPL-Bot"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log(
        "\nScan this QR with the bot phone (WhatsApp → Linked devices → Link a device):\n",
      );
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") {
      console.log("✅ Connected to WhatsApp. Listening for group messages…");
      if (!GROUP_ID) {
        console.log(
          "Tip: WHATSAPP_GROUP_ID is not set — post in your group, copy the @g.us id from the log, then set it in .env and on the app.",
        );
      }
    } else if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.error(
          "Logged out. Delete the auth folder and restart to re-link the bot.",
        );
        process.exit(1);
      } else {
        console.log("Connection closed — reconnecting in 3s…");
        setTimeout(start, 3000);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return; // live messages only, not history sync
    try {
      const eligible = messages.filter((m) => {
        const jid = m.key?.remoteJid || "";
        if (!jid.endsWith("@g.us")) return false; // groups only
        if (GROUP_ID && jid !== GROUP_ID) return false; // configured group only
        if (m.key.fromMe) return false; // never react to our own messages
        if (!m.message) return false;
        return true;
      });
      if (eligible.length > 0) await deliver(sock, eligible);
    } catch (err) {
      logger.error({ err }, "Error handling incoming messages");
    }
  });
}

process.on("unhandledRejection", (err) =>
  logger.error({ err }, "Unhandled rejection"),
);

start().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
