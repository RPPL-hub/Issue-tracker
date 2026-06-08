import Link from "next/link";
import {
  Logo,
  DashboardIcon,
  ReportsIcon,
  AnalyticsIcon,
  SettingsIcon,
} from "./Icons";

const NAV = [
  { label: "Dashboard", Icon: DashboardIcon, href: "/", active: true },
  { label: "Reports", Icon: ReportsIcon, href: "/", soon: true },
  { label: "Analytics", Icon: AnalyticsIcon, href: "/", soon: true },
  { label: "Settings", Icon: SettingsIcon, href: "/", soon: true },
];

export function Brand({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo className="h-6 w-6 text-brand" />
      <span className="text-base font-semibold tracking-tight text-white">
        Rwenzori
      </span>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-ink-900 px-4 py-5 md:flex">
      <div className="px-2">
        <Brand />
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV.map(({ label, Icon, href, active, soon }) => {
          const className = `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            active
              ? "bg-brand/15 text-brand ring-1 ring-brand/20"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          }`;
          return (
            <Link key={label} href={href} className={className}>
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              {soon && (
                <span className="ml-auto rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2 px-2 pt-4 text-xs text-slate-600">
        <Logo className="h-4 w-4 text-slate-600" />
        <span>Rwenzori Process · RPL</span>
      </div>
    </aside>
  );
}
