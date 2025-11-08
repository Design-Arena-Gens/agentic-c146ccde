import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDashboardMetrics } from "@/server/dashboard";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { ShieldCheck, Clock, FileText, CheckCircle2, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const [metrics, recentDocuments, openWorkflows] = await Promise.all([
    getDashboardMetrics(session.user.id, session.user.role),
    prisma.document.findMany({
      include: {
        type: true,
        currentVersion: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.documentWorkflowRun.findMany({
      where: {
        status: { not: "COMPLETED" },
      },
      include: {
        document: true,
        template: true,
      },
      orderBy: { startedAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">
          Compliance Control Center
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Real-time visibility into controlled documents, workflows, and audit
          health indicators.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<FileText className="h-5 w-5 text-blue-600" />}
            label="Controlled documents"
            value={metrics.documents}
            description="Includes all current and historical versions."
          />
          <MetricCard
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            label="Pending workflow tasks"
            value={metrics.pendingSteps}
            description="Review & approval tasks awaiting action."
          />
          <MetricCard
            icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
            label="Audit events (7 days)"
            value={metrics.auditCount}
            description="Tamper evident events captured for regulators."
          />
          <MetricCard
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            label="Upcoming revisions"
            value={metrics.upcomingRevisions}
            description="Effective docs due for next issue within 30 days."
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent controlled documents
              </h2>
              <p className="text-sm text-slate-500">
                Newly issued and revised documents with security designations.
              </p>
            </div>
          </header>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Number</th>
                  <th className="pb-3">Version</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Security</th>
                  <th className="pb-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-blue-50/40">
                    <td className="py-3 font-medium">
                      <a
                        href={`/documents/${doc.id}`}
                        className="text-blue-700 hover:underline"
                      >
                        {doc.title}
                      </a>
                    </td>
                    <td className="py-3">{doc.documentNumber}</td>
                    <td className="py-3">
                      {doc.currentVersion?.versionLabel ?? "Draft"}
                    </td>
                    <td className="py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {doc.type.type}
                    </td>
                    <td className="py-3">
                      <SecurityBadge level={doc.documentSecurity} />
                    </td>
                    <td className="py-3 text-sm text-slate-500">
                      {format(doc.updatedAt, "dd MMM yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Workflow health
            </h2>
            <p className="text-sm text-slate-500">
              Active review & approval pipelines.
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {openWorkflows.map((run) => (
                <li
                  key={run.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {run.document.title}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Started {format(run.startedAt, "dd MMM yyyy")}
                      </p>
                    </div>
                    <WorkflowStatusBadge status={run.status} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Template: {run.template?.name ?? "Custom"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Lifecycle summary
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {metrics.lifecycle.map((bucket) => (
                <li
                  key={bucket.status}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="font-medium">{bucket.status}</span>
                  <span className="text-slate-600">{bucket._count._all}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function SecurityBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    CONFIDENTIAL: "bg-red-100 text-red-700 border-red-200",
    INTERNAL: "bg-blue-100 text-blue-700 border-blue-200",
    RESTRICTED: "bg-amber-100 text-amber-700 border-amber-200",
    PUBLIC: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${colors[level] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}
    >
      {level}
    </span>
  );
}

function WorkflowStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: {
      label: "Pending",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    COMPLETED: {
      label: "Completed",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    REJECTED: {
      label: "Rejected",
      className: "bg-red-100 text-red-700 border-red-200",
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    },
  };

  const entry = map[status] ?? map.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${entry.className}`}
    >
      {status === "COMPLETED" ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <Clock className="h-3.5 w-3.5" />
      )}
      {entry.label}
    </span>
  );
}
