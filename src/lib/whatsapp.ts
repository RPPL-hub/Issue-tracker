// Adapter for the WhatsApp gateway (built for Whapi.Cloud's webhook + send
// API; other gateways like Green-API need only this file changed).

export interface IncomingMessage {
  externalId: string | null;
  chatId: string;
  isGroup: boolean;
  fromMe: boolean;
  sender: string;
  senderName: string;
  type: string;
  text: string;
}

// Whapi webhook body: { messages: [{ id, from_me, type, chat_id, from,
// from_name, text: { body }, ... }], event: {...} }
export function normalizeWebhook(body: unknown): IncomingMessage[] {
  if (!body || typeof body !== "object") return [];
  const messages = (body as Record<string, unknown>).messages;
  if (!Array.isArray(messages)) return [];

  const out: IncomingMessage[] = [];
  for (const m of messages) {
    if (!m || typeof m !== "object") continue;
    const msg = m as Record<string, unknown>;
    const chatId = typeof msg.chat_id === "string" ? msg.chat_id : "";
    if (!chatId) continue;

    const textObj = msg.text as Record<string, unknown> | undefined;
    out.push({
      externalId: typeof msg.id === "string" ? msg.id : null,
      chatId,
      isGroup: chatId.endsWith("@g.us"),
      fromMe: msg.from_me === true,
      sender: typeof msg.from === "string" ? msg.from : "unknown",
      senderName:
        typeof msg.from_name === "string" && msg.from_name.trim()
          ? msg.from_name.trim()
          : typeof msg.from === "string"
            ? msg.from
            : "Unknown",
      type: typeof msg.type === "string" ? msg.type : "unknown",
      text:
        textObj && typeof textObj.body === "string" ? textObj.body.trim() : "",
    });
  }
  return out;
}

// Post a confirmation back into the group. Best-effort: failures are logged
// and swallowed so they never break message ingestion.
export async function sendGroupReply(
  chatId: string,
  text: string,
): Promise<boolean> {
  const token = process.env.WHAPI_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch("https://gate.whapi.cloud/messages/text", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: chatId, body: text }),
    });
    if (!res.ok) {
      console.error(`WhatsApp reply failed: HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("WhatsApp reply failed:", err);
    return false;
  }
}
