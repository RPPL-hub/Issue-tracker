import Anthropic from "@anthropic-ai/sdk";
import { PRIORITIES, DEPARTMENTS, isPriority, isDepartment } from "./constants";

// Claude Haiku keeps per-message cost negligible (the user-approved budget for
// this pipeline). Override with ANTHROPIC_MODEL to trade cost for capability.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

export interface Classification {
  isIssue: boolean;
  confidence: number; // 0..1
  title: string;
  description: string;
  priority: string;
  department: string;
  assignedTo: string; // "" when the message names nobody
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM_PROMPT = `You triage messages from the Rwenzori Process team's WhatsApp group for an internal issue tracker.

Decide whether a message is a NEW workplace problem report that should become a tracked issue.

Count as an issue: equipment breakdowns, jams, failures, safety hazards, spills, shortages, delays, quality failures, IT outages — any actionable operational problem being reported.

Do NOT count as an issue: greetings, casual chat, questions, acknowledgements ("ok", "on it", "thanks"), scheduling talk, status updates or follow-ups about problems that are clearly already being handled, or messages about fixing/resolving something.

When it IS an issue, extract:
- title: short, descriptive summary (e.g. "Conveyor Belt B Jammed")
- description: the problem details, cleaned up but faithful to the message
- priority: ${PRIORITIES.join(" | ")} — Critical only for safety hazards or full production stoppage
- department: ${DEPARTMENTS.join(" | ")} — best fit for who owns the problem
- assignedTo: a person's name ONLY if the message explicitly asks someone to handle it; otherwise ""

confidence is your 0-to-1 confidence in the is_issue decision. When it is not an issue, set title and description to "" and use priority "Low", department "Operations".`;

const OUTPUT_SCHEMA = {
  type: "object" as const,
  additionalProperties: false,
  required: [
    "is_issue",
    "confidence",
    "title",
    "description",
    "priority",
    "department",
    "assigned_to",
  ],
  properties: {
    is_issue: { type: "boolean" as const },
    confidence: {
      type: "number" as const,
      description: "Confidence in the is_issue decision, 0 to 1",
    },
    title: { type: "string" as const },
    description: { type: "string" as const },
    priority: { type: "string" as const, enum: [...PRIORITIES] },
    department: { type: "string" as const, enum: [...DEPARTMENTS] },
    assigned_to: {
      type: "string" as const,
      description: "Empty string when no assignee is named",
    },
  },
};

export async function classifyMessage(
  senderName: string,
  text: string,
): Promise<Classification> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Sender: ${senderName}\nMessage:\n${text}`,
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: OUTPUT_SCHEMA,
      },
    },
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Classifier returned no text content");
  }

  const raw = JSON.parse(block.text) as Record<string, unknown>;

  const confidence =
    typeof raw.confidence === "number"
      ? Math.min(1, Math.max(0, raw.confidence))
      : 0;

  return {
    isIssue: raw.is_issue === true,
    confidence,
    title: typeof raw.title === "string" ? raw.title.trim() : "",
    description:
      typeof raw.description === "string" ? raw.description.trim() : "",
    priority: isPriority(raw.priority) ? raw.priority : "Medium",
    department: isDepartment(raw.department) ? raw.department : "Operations",
    assignedTo:
      typeof raw.assigned_to === "string" ? raw.assigned_to.trim() : "",
  };
}
