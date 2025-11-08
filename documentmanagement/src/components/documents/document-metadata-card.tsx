import { format } from "date-fns";
import { ShieldCheck, IdCard, CalendarDays, Edit3 } from "lucide-react";
import { DocumentStatusForm } from "./document-status-form";
import type { getDocument } from "@/server/documents";

type DocumentDetail = NonNullable<Awaited<ReturnType<typeof getDocument>>>;

export function DocumentMetadataCard({
  document,
  canManage,
  currentUser,
}: {
  document: DocumentDetail;
  canManage: boolean;
  currentUser: { id: string; role: string };
}) {
  const metadataItems = [
    {
      label: "Document number",
      value: document.documentNumber,
      icon: <IdCard className="h-4 w-4 text-slate-500" />,
    },
    {
      label: "Document type",
      value: document.type.type,
      icon: <Edit3 className="h-4 w-4 text-slate-500" />,
    },
    {
      label: "Security classification",
      value: document.documentSecurity,
      icon: <ShieldCheck className="h-4 w-4 text-slate-500" />,
    },
    {
      label: "Effective from",
      value: document.effectiveFrom
        ? format(document.effectiveFrom, "dd MMM yyyy")
        : "Pending approval",
      icon: <CalendarDays className="h-4 w-4 text-slate-500" />,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Controlled document
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {document.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Created by {document.createdBy.name} • {document.documentCategory} •
            {` ${document.status}`} • Current version{" "}
            {document.currentVersion?.versionLabel ?? "Draft"}
          </p>
        </div>
        {canManage && (
          <DocumentStatusForm document={document} currentUser={currentUser} />
        )}
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metadataItems.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3"
          >
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.icon}
              {item.label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-800">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
