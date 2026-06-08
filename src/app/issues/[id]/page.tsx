"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PriorityBadge, StatusBadge, Avatar } from "@/components/Badges";
import { ArrowLeftIcon, CheckIcon, SendIcon, ChatIcon } from "@/components/Icons";
import {
  formatIssueId,
  nextStatus,
  nextStatusActionLabel,
} from "@/lib/constants";
import { timeAgo, clockTime } from "@/lib/format";
import type { IssueDTO } from "@/lib/types";

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) ?? "";

  const [issue, setIssue] = useState<IssueDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/issues/${id}`, { cache: "no-store" });
      if (res.status === 404) {
        setError("Issue not found.");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIssue(data.issue as IssueDTO);
      setError(null);
    } catch {
      setError("Could not load this issue.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  async function advance() {
    if (!issue) return;
    const target = nextStatus(issue.status);
    if (!target) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const data = await res.json();
      if (res.ok) setIssue(data.issue as IssueDTO);
    } finally {
      setAdvancing(false);
    }
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!issue || !comment.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, body: comment }),
      });
      const data = await res.json();
      if (res.ok) {
        setIssue((prev) =>
          prev
            ? {
                ...prev,
                comments: [...(prev.comments ?? []), data.comment],
                commentCount: (prev.commentCount ?? 0) + 1,
              }
            : prev,
        );
        setComment("");
      }
    } finally {
      setPosting(false);
    }
  }

  const actionLabel = issue ? nextStatusActionLabel(issue.status) : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push("/")}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back to dashboard
        </button>

        {loading ? (
          <div className="card p-10 text-center text-sm text-slate-500">
            Loading…
          </div>
        ) : error ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <Link href="/" className="btn-ghost mt-4 inline-flex">
              Return to dashboard
            </Link>
          </div>
        ) : issue ? (
          <>
            <div className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs text-slate-500">
                    {formatIssueId(issue.id)}
                  </span>
                  <h1 className="mt-1 text-2xl font-semibold text-white">
                    {issue.title}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={issue.status} />
                  <PriorityBadge priority={issue.priority} />
                  <span className="badge bg-slate-500/15 text-slate-300">
                    {issue.department}
                  </span>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {issue.description}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/5 pt-4 text-xs text-slate-400">
                <span>
                  Reported by{" "}
                  <span className="text-slate-200">{issue.reportedBy}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  Assigned to <Avatar name={issue.assignedTo} size="sm" />
                  <span className="text-slate-200">{issue.assignedTo}</span>
                </span>
                <span>Opened {timeAgo(issue.createdAt)}</span>
              </div>

              <div className="mt-5">
                {actionLabel ? (
                  <button
                    onClick={advance}
                    disabled={advancing}
                    className="btn-brand w-full"
                  >
                    <CheckIcon className="h-4 w-4" />
                    {advancing ? "Updating…" : actionLabel}
                  </button>
                ) : (
                  <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                    <CheckIcon className="h-4 w-4" /> Resolved
                  </div>
                )}
                <p className="mt-2 text-center text-xs text-slate-600">
                  Workflow: Open → In Progress → Resolved
                </p>
              </div>
            </div>

            <div className="card mt-5">
              <div className="flex items-center gap-2 border-b border-white/5 px-6 py-4">
                <ChatIcon className="h-5 w-5 text-slate-400" />
                <h2 className="text-base font-semibold text-white">
                  Timeline &amp; Comments
                </h2>
                <span className="ml-auto text-xs text-slate-500">
                  {issue.comments?.length ?? 0} updates
                </span>
              </div>

              <div className="space-y-5 px-6 py-5">
                {issue.comments && issue.comments.length > 0 ? (
                  issue.comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <Avatar name={c.author} size="sm" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-100">
                            {c.author}
                          </span>
                          <span className="text-xs text-slate-500">
                            {clockTime(c.createdAt)} · {timeAgo(c.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-300">
                          {c.body}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No updates yet. Add the first one below.
                  </p>
                )}
              </div>

              <form
                onSubmit={postComment}
                className="space-y-2 border-t border-white/5 px-6 py-4"
              >
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name"
                  className="input sm:max-w-[220px]"
                />
                <div className="flex items-end gap-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Post an update or hand-off note…"
                    className="input resize-none"
                  />
                  <button
                    type="submit"
                    disabled={posting || !comment.trim()}
                    className="btn-brand shrink-0"
                  >
                    <SendIcon className="h-4 w-4" /> {posting ? "Posting…" : "Post"}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
