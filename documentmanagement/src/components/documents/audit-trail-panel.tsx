import { format } from "date-fns";
import { Shield } from "lucide-react";
import type { getDocument } from "@/server/documents";

type DocumentDetail = NonNullable<Awaited<ReturnType<typeof getDocument>>>;

export function AuditTrailPanel({ document }: { document: DocumentDetail }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Audit trail
          </h2>
          <p className="text-sm text-slate-500">
            Immutable Part 11 compliant logs with actor, action, timestamp, and
            metadata.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <Shield className="h-3.5 w-3.5" />
          Tamper evident
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="pb-3">Timestamp</th>
              <th className="pb-3">Actor</th>
              <th className="pb-3">Action</th>
              <th className="pb-3">Metadata</th>
              <th className="pb-3">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {document.auditLogs.map((event) => (
              <tr key={event.id} className="hover:bg-blue-50/40">
                <td className="py-3 text-xs text-slate-500">
                  {format(event.createdAt, "dd MMM yyyy HH:mm:ss")}
                </td>
                <td className="py-3">
                  {event.actor?.name ?? "System"}{" "}
                  <span className="text-xs text-slate-500">
                    ({event.actor?.role ?? "SYSTEM"})
                  </span>
                </td>
                <td className="py-3 text-xs font-semibold uppercase tracking-wide">
                  {event.action}
                </td>
                <td className="py-3 text-xs text-slate-500">
                  <code className="rounded bg-slate-100 px-2 py-1">
                    {JSON.stringify(event.metadata ?? {}, null, 0)}
                  </code>
                </td>
                <td className="py-3 text-xs text-slate-500">
                  {event.entityType} · {event.entityId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
