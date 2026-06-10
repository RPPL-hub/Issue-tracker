import type { IssueDTO } from "@/lib/types";
import { formatIssueId, PRIORITY_STRIPE } from "@/lib/constants";
import { PriorityBadge, StatusBadge, Avatar } from "./Badges";
import { ChatIcon } from "./Icons";

interface Props {
  issues: IssueDTO[];
  onSelect: (id: number) => void;
}

export function IssueTable({ issues, onSelect }: Props) {
  if (issues.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-sm text-slate-500">
        No issues match your filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-medium">ID</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr
              key={issue.id}
              onClick={() => onSelect(issue.id)}
              className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.03]"
            >
              <td
                className={`border-l-4 ${
                  PRIORITY_STRIPE[issue.priority] ?? "border-l-slate-600"
                } px-4 py-3 font-mono text-xs text-slate-400`}
              >
                {formatIssueId(issue.id)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 font-medium text-slate-100">
                  <span className="max-w-[260px] truncate">{issue.title}</span>
                  {issue.commentCount ? (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <ChatIcon className="h-3.5 w-3.5" />
                      {issue.commentCount}
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={issue.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={issue.priority} />
              </td>
              <td className="px-4 py-3 text-slate-300">{issue.department}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={issue.assignedTo} size="sm" />
                  <span className="text-slate-300">{issue.assignedTo}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
