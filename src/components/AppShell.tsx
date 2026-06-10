import { Sidebar, Brand } from "./Sidebar";

// Page chrome shared by the dashboard and the issue detail view:
// a fixed sidebar on desktop and a compact brand bar on mobile.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-ink-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center border-b border-white/5 px-4 py-3 md:hidden">
          <Brand />
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
