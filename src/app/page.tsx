"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { STATUSES, PRIORITIES, formatIssueId } from "@/lib/constants";
import type { IssueDTO } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { IssueTable } from "@/components/IssueTable";
import { NewIssueFlyout } from "@/components/NewIssueFlyout";
import {
  PlusIcon,
  SearchIcon,
  BellIcon,
  DashboardIcon,
  AnalyticsIcon,
  CheckIcon,
  AlertIcon,
} from "@/components/Icons";

export default function DashboardPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<IssueDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/issues", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load issues");
      const data = await res.json();
      setIssues(data.issues as IssueDTO[]);
      setError(null);
    } catch {
      setError("Could not load issues. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // KPI metrics computed from the live list so they stay accurate after edits.
  const stats = useMemo(() => {
    let open = 0,
      inProgress = 0,
      resolved = 0,
      criticalActive = 0;
    for (const i of issues) {
      if (i.status === "Open") open++;
      else if (i.status === "In Progress") inProgress++;
      else if (i.status === "Resolved") resolved++;
      if (i.priority === "Critical" && i.status !== "Resolved") criticalActive++;
    }
    return { open, inProgress, resolved, criticalActive };
  }, [issues]);

  // Client-side search + filter engine (Status, Priority, Global Text Search).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues.filter((i) => {
      if (statusFilter !== "All" && i.status !== statusFilter) return false;
      if (priorityFilter !== "All" && i.priority !== priorityFilter)
        return false;
      if (q) {
        const hay =
          `${formatIssueId(i.id)} ${i.title} ${i.reportedBy} ${i.assignedTo}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [issues, search, statusFilter, priorityFilter]);

  const kpis = [
    {
      label: "Open Issues",
      value: stats.open,
      Icon: DashboardIcon,
      chip: "bg-blue-500/15 text-blue-400",
      ring: "ring-blue-500/20",
      bg: "from-blue-500/10",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      Icon: AnalyticsIcon,
      chip: "bg-amber-500/15 text-amber-400",
      ring: "ring-amber-500/20",
      bg: "from-amber-500/10",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      Icon: CheckIcon,
      chip: "bg-emerald-500/15 text-emerald-400",
      ring: "ring-emerald-500/20",
      bg: "from-emerald-500/10",
    },
    {
      label: "Critical Active",
      value: stats.criticalActive,
      Icon: AlertIcon,
      chip: "bg-red-500/15 text-red-400",
      ring: "ring-red-500/20",
      bg: "from-red-500/10",
    },
  ];

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Dashboard</h1>
            <p className="text-sm text-slate-400">
              Rwenzori Process Issue Tracker
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
              aria-label="Notifications"
            >
              <BellIcon className="h-5 w-5" />
              {stats.criticalActive > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
            <button onClick={() => setFlyoutOpen(true)} className="btn-brand">
              <PlusIcon className="h-4 w-4" /> New Issue
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.Icon;
            return (
              <div
                key={k.label}
                className={`card bg-gradient-to-br ${k.bg} to-transparent p-5 ring-1 ${k.ring}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{k.label}</span>
                  <span className={`rounded-lg p-2 ${k.chip}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-3 text-3xl font-semibold text-white">
                  {loading ? "—" : String(k.value).padStart(2, "0")}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card mt-6">
          <div className="flex flex-col gap-3 border-b border-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-white">Open Issues</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search id, title, name..."
                  className="input pl-9 sm:w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input sm:w-40"
              >
                <option value="All">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input sm:w-40"
              >
                <option value="All">All priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <div className="px-6 py-16 text-center text-sm text-red-400">
              {error}
            </div>
          ) : loading ? (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              Loading issues…
            </div>
          ) : (
            <IssueTable
              issues={filtered}
              onSelect={(id) => router.push(`/issues/${id}`)}
            />
          )}
        </div>

        {!loading && !error && (
          <p className="mt-4 text-center text-xs text-slate-600">
            Showing {filtered.length} of {issues.length} issues
          </p>
        )}
      </div>

      <NewIssueFlyout
        open={flyoutOpen}
        onClose={() => setFlyoutOpen(false)}
        onCreated={(issue) => setIssues((prev) => [issue, ...prev])}
      />
    </AppShell>
  );
}
