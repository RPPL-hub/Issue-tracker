"use client";

import { useState } from "react";
import { PRIORITIES, DEPARTMENTS } from "@/lib/constants";
import type { IssueDTO } from "@/lib/types";
import { CloseIcon } from "./Icons";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (issue: IssueDTO) => void;
}

const EMPTY = {
  title: "",
  description: "",
  priority: "Medium",
  department: "Operations",
  reportedBy: "",
  assignedTo: "",
};

export function NewIssueFlyout({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function field<K extends keyof typeof EMPTY>(key: K) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create issue.");
        return;
      }
      onCreated(data.issue as IssueDTO);
      setForm({ ...EMPTY });
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New issue"
        className={`absolute right-0 top-0 h-full w-full max-w-md transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <form
          onSubmit={handleSubmit}
          className="flex h-full flex-col border-l border-white/10 bg-ink-800"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-white">New Issue</h2>
              <p className="text-xs text-slate-400">Report a workplace issue</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div>
              <label className="label" htmlFor="title">
                Issue Title
              </label>
              <input
                id="title"
                className="input"
                placeholder="e.g. Conveyor Belt B Jammed"
                value={form.title}
                onChange={field("title")}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="input resize-none"
                placeholder="Describe the problem in detail..."
                value={form.description}
                onChange={field("description")}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="priority">
                  Priority
                </label>
                <select
                  id="priority"
                  className="input"
                  value={form.priority}
                  onChange={field("priority")}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="department">
                  Department
                </label>
                <select
                  id="department"
                  className="input"
                  value={form.department}
                  onChange={field("department")}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="reportedBy">
                Reported By
              </label>
              <input
                id="reportedBy"
                className="input"
                placeholder="Your name"
                value={form.reportedBy}
                onChange={field("reportedBy")}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="assignedTo">
                Assigned To
              </label>
              <input
                id="assignedTo"
                className="input"
                placeholder="Owner of resolution (optional)"
                value={form.assignedTo}
                onChange={field("assignedTo")}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-red-500/20">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
            <button type="button" onClick={onClose} className="btn-ghost">
              Close
            </button>
            <button type="submit" disabled={submitting} className="btn-brand">
              {submitting ? "Submitting..." : "Submit Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
