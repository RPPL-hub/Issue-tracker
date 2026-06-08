// Shared option lists, status workflow, and color maps used across the app.

export const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const DEPARTMENTS = [
  "Operations",
  "Logistics",
  "Quality",
  "IT",
  "Admin",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const STATUSES = ["Open", "In Progress", "Resolved"] as const;
export type Status = (typeof STATUSES)[number];

// Linear workflow: Open -> In Progress -> Resolved.
export function nextStatus(status: string): Status | null {
  switch (status) {
    case "Open":
      return "In Progress";
    case "In Progress":
      return "Resolved";
    default:
      return null;
  }
}

// Label for the single-click action button that advances the workflow.
export function nextStatusActionLabel(status: string): string | null {
  switch (status) {
    case "Open":
      return "Start Progress";
    case "In Progress":
      return "Mark as Resolved";
    default:
      return null;
  }
}

export function formatIssueId(id: number): string {
  return `RPL-${String(id).padStart(3, "0")}`;
}

// Left-border stripe color for each priority (Tailwind class).
export const PRIORITY_STRIPE: Record<string, string> = {
  Critical: "border-l-red-500",
  High: "border-l-orange-500",
  Medium: "border-l-yellow-500",
  Low: "border-l-emerald-500",
};

// Pill/badge styling per priority.
export const PRIORITY_BADGE: Record<string, string> = {
  Critical: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  High: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30",
  Medium: "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30",
  Low: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
};

// Pill/badge styling per status.
export const STATUS_BADGE: Record<string, string> = {
  Open: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
  "In Progress": "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  Resolved: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
};

export function isPriority(value: unknown): value is Priority {
  return (
    typeof value === "string" && (PRIORITIES as readonly string[]).includes(value)
  );
}

export function isDepartment(value: unknown): value is Department {
  return (
    typeof value === "string" &&
    (DEPARTMENTS as readonly string[]).includes(value)
  );
}

export function isStatus(value: unknown): value is Status {
  return (
    typeof value === "string" && (STATUSES as readonly string[]).includes(value)
  );
}
