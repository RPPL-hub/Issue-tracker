import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createIssue } from "@/lib/issues";
import { aiConfigured, classifyMessage } from "@/lib/ai";
import {
  normalizeWebhook,
  sendGroupReply,
  type IncomingMessage,
} from "@/lib/whatsapp";
import { formatIssueId } from "@/lib/constants";

export const dynamic = "force-dynamic";

const MIN_CONFIDENCE = Number(process.env.WHATSAPP_MIN_CONFIDENCE || "0.7");

// POST /api/whatsapp/webhook?token=... — receives gateway webhooks.
// Always returns 200 for valid-auth requests (gateways disable endpoints
// that fail repeatedly); per-message outcomes are recorded in the database.
export async function POST(req: NextRequest) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook not configured: set WHATSAPP_WEBHOOK_SECRET." },
      { status: 503 },
    );
  }
  const provided =
    req.headers.get("x-webhook-token") ??
    req.nextUrl.searchParams.get("token");
  if (provided !== secret) {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true, ignored: "invalid JSON" });
  }

  const messages = normalizeWebhook(body);
  const results = [];
  for (const message of messages) {
    results.push(await processMessage(message));
  }

  return NextResponse.json({ ok: true, results });
}

async function processMessage(msg: IncomingMessage) {
  const base = { externalId: msg.externalId, chatId: msg.chatId };

  // Never react to the bot's own confirmations (loop protection).
  if (msg.fromMe) return { ...base, action: "ignored_own_message" };

  // Only listen to the configured group; without config, any group chat.
  const groupId = process.env.WHATSAPP_GROUP_ID;
  if (groupId ? msg.chatId !== groupId : !msg.isGroup) {
    return { ...base, action: "ignored_other_chat" };
  }

  // Dedupe gateway webhook retries.
  if (msg.externalId) {
    const existing = await prisma.whatsAppMessage.findUnique({
      where: { externalId: msg.externalId },
      select: { id: true },
    });
    if (existing) return { ...base, action: "duplicate" };
  }

  // Store the raw message first — nothing is ever lost, even if AI fails.
  const stored = await prisma.whatsAppMessage.create({
    data: {
      externalId: msg.externalId,
      chatId: msg.chatId,
      sender: msg.sender,
      senderName: msg.senderName,
      messageType: msg.type,
      body: msg.text,
      verdict: "pending",
    },
  });

  async function finish(
    verdict: string,
    dbExtra: { confidence?: number; issueId?: number } = {},
    responseExtra: { reply?: string } = {},
  ) {
    await prisma.whatsAppMessage.update({
      where: { id: stored.id },
      data: { verdict, ...dbExtra },
    });
    return { ...base, action: verdict, ...dbExtra, ...responseExtra };
  }

  if (msg.type !== "text" || !msg.text) return finish("skipped");
  if (!aiConfigured()) return finish("no_ai");

  try {
    const verdict = await classifyMessage(msg.senderName, msg.text);

    if (!verdict.isIssue || verdict.confidence < MIN_CONFIDENCE) {
      return finish("chatter", { confidence: verdict.confidence });
    }

    const issue = await createIssue({
      title: verdict.title || msg.text.slice(0, 80),
      description: verdict.description || msg.text,
      priority: verdict.priority,
      department: verdict.department,
      reportedBy: msg.senderName,
      assignedTo: verdict.assignedTo,
      source: "whatsapp",
    });

    const rplId = formatIssueId(issue.id);
    const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "");
    const link = baseUrl ? `\n${baseUrl}/issues/${issue.id}` : "";
    const replyText = `✅ Logged as ${rplId} — ${issue.title} (${issue.priority} · ${issue.department})${link}`;

    // Managed gateway (Whapi) posts the reply directly; a self-hosted worker
    // instead sends the `reply` we return. Only one path runs per deployment.
    const sentViaWhapi = await sendGroupReply(msg.chatId, replyText);

    return finish(
      "issue",
      { confidence: verdict.confidence, issueId: issue.id },
      sentViaWhapi ? {} : { reply: replyText },
    );
  } catch (err) {
    console.error("WhatsApp classification failed:", err);
    return finish("error");
  }
}
