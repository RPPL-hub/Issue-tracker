import { PRIORITY_BADGE, STATUS_BADGE } from "@/lib/constants";
import { initials } from "@/lib/format";

const PRIORITY_DOT: Record<string, string> = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-yellow-500",
  Low: "bg-emerald-500",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`badge ${PRIORITY_BADGE[priority] ?? "bg-slate-500/15 text-slate-300"}`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[priority] ?? "bg-slate-400"}`}
      />
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`badge ${STATUS_BADGE[status] ?? "bg-slate-500/15 text-slate-300"}`}
    >
      {status}
    </span>
  );
}

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-xs";
  return (
    <span
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full bg-brand/20 font-semibold text-brand ring-1 ring-brand/30`}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
