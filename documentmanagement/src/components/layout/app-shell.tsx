import { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, FileText, GitBranch, ScrollText, Users, Settings, LayoutDashboard } from "lucide-react";
import { SidebarNavigation } from "./sidebar-navigation";
import { UserMenu } from "./user-menu";

type NavItem = {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
};

const NAV_ITEMS: NavItem[] = [
  {
    name: "Overview",
    description: "Compliance posture, workflow and document metrics.",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "QA", "QA_MANAGER", "DOCUMENT_CONTROLLER", "AUTHOR", "REVIEWER", "APPROVER", "VIEWER"],
  },
  {
    name: "Documents",
    description: "Controlled documents, versions and lifecycle tasks.",
    href: "/documents",
    icon: FileText,
    roles: ["ADMIN", "QA", "QA_MANAGER", "DOCUMENT_CONTROLLER", "AUTHOR", "REVIEWER", "APPROVER", "VIEWER"],
  },
  {
    name: "Workflows",
    description: "Configure review and approval workflows.",
    href: "/workflows",
    icon: GitBranch,
    roles: ["ADMIN", "QA", "QA_MANAGER", "DOCUMENT_CONTROLLER"],
  },
  {
    name: "Audit Trail",
    description: "Tamper evident activity logs.",
    href: "/audit-log",
    icon: ScrollText,
    roles: ["ADMIN", "QA", "QA_MANAGER", "DOCUMENT_CONTROLLER"],
  },
  {
    name: "Users",
    description: "Manage access, roles, and electronic signature settings.",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN", "QA_MANAGER"],
  },
  {
    name: "Configuration",
    description: "Document types, security classifications and retention.",
    href: "/admin/configuration",
    icon: Settings,
    roles: ["ADMIN", "QA_MANAGER", "DOCUMENT_CONTROLLER"],
  },
];

export function AppShell({
  user,
  children,
}: {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
  };
  children: ReactNode;
}) {
  const allowedNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/80 px-6 py-8 lg:flex lg:flex-col lg:gap-8">
        <div className="flex items-center gap-2 text-blue-700">
          <ShieldCheck className="h-6 w-6" />
          <div>
            <p className="text-sm font-semibold">DocumentManagement</p>
            <p className="text-xs text-slate-500">Pharma Document DMS</p>
          </div>
        </div>
        <SidebarNavigation items={allowedNav} />
        <div className="mt-auto rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Compliance Center
          </p>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            <li>21 CFR Part 11 electronic signatures</li>
            <li>ISO 9001 aligned lifecycle controls</li>
            <li>GMP &amp; ICH Q7 ready audit readiness</li>
          </ul>
          <Link
            href="/workflows"
            className="mt-4 inline-flex items-center text-xs font-medium text-blue-700 underline-offset-4 hover:underline"
          >
            Review SOP workflow
          </Link>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/70 px-6 backdrop-blur">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">
              {user.role.replaceAll("_", " ")}
            </span>
            <span className="text-xs text-slate-500">
              {(user.name ?? "User")} · {(user.email ?? "email not set")}
            </span>
          </div>
          <UserMenu name={user.name} />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">{children}</main>
        <footer className="border-t border-slate-200 bg-white/60 px-6 py-4 text-xs text-slate-500">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} DocumentManagement • 21 CFR Part 11 compliant audit trail</span>
            <span>
              ISO 9001 · ICH Q7 · GMP alignment — validated release {process.env.NEXT_PUBLIC_RELEASE ?? "1.0.0"}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
