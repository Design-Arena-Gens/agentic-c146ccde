import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAuditEvents } from "@/lib/audit";
import { format } from "date-fns";

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const events = await getAuditEvents(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Audit trail
        </h1>
        <p className="text-sm text-slate-500">
          21 CFR Part 11 compliant, tamper-evident log of all user and system
          actions.
        </p>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="pb-3">Timestamp</th>
              <th className="pb-3">Actor</th>
              <th className="pb-3">Action</th>
              <th className="pb-3">Entity</th>
              <th className="pb-3">Metadata</th>
              <th className="pb-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-blue-50/40">
                <td className="py-3 text-xs text-slate-500">
                  {format(event.createdAt, "dd MMM yyyy HH:mm:ss")}
                </td>
                <td className="py-3">
                  {event.actor?.name ?? "System"}
                  <div className="text-xs text-slate-400">
                    {event.actor?.email ?? "system@documentmanagement"}
                  </div>
                </td>
                <td className="py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {event.action}
                </td>
                <td className="py-3 text-xs text-slate-500">
                  {event.entityType} — {event.entityId}
                </td>
                <td className="py-3 text-xs text-slate-500">
                  <code className="rounded bg-slate-100 px-2 py-1">
                    {JSON.stringify(event.metadata ?? {}, null, 0)}
                  </code>
                </td>
                <td className="py-3 text-xs text-slate-500">
                  {event.ipAddress ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
