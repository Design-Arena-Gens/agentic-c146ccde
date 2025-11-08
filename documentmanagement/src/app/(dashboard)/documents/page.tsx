import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listDocuments } from "@/server/documents";
import { listDocumentTypes } from "@/server/document-types";
import { ShieldCheck, Filter, FolderPlus } from "lucide-react";
import Link from "next/link";

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const [documents, types] = await Promise.all([
    listDocuments(),
    listDocumentTypes(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Controlled documents
          </h1>
          <p className="text-sm text-slate-500">
            Manage GMP-critical manuals, procedures, and work instructions with
            full lifecycle traceability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/documents/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            <FolderPlus className="h-4 w-4" />
            New document
          </Link>
          <Link
            href="/admin/configuration"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-blue-200 hover:text-blue-700"
          >
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            Configure types
          </Link>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Document log</h2>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-700">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-3">Title</th>
                <th className="pb-3">Number</th>
                <th className="pb-3">Version</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Security</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Next issue</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-blue-50/40">
                  <td className="py-3 font-medium text-blue-700">
                    <Link href={`/documents/${doc.id}`}>{doc.title}</Link>
                  </td>
                  <td className="py-3 text-slate-600">{doc.documentNumber}</td>
                  <td className="py-3">
                    {doc.currentVersion?.versionLabel ?? "Draft"}
                  </td>
                  <td className="py-3 text-xs uppercase tracking-wide text-slate-500">
                    {doc.type.type}
                  </td>
                  <td className="py-3 text-xs uppercase tracking-wide text-slate-500">
                    {doc.documentCategory}
                  </td>
                  <td className="py-3">
                    <SecurityBadge level={doc.documentSecurity} />
                  </td>
                  <td className="py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {doc.status}
                  </td>
                  <td className="py-3 text-sm text-slate-500">
                    {doc.nextIssueDate
                      ? new Date(doc.nextIssueDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="text-sm font-medium text-blue-700 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="rounded-2xl border border-blue-100 bg-blue-50/80 p-6 text-sm text-blue-800">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Document classification
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((type) => (
            <div
              key={type.id}
              className="rounded-xl border border-blue-200/70 bg-white/70 p-4 shadow-sm"
            >
              <div className="text-sm font-semibold text-blue-800">
                {type.type}
              </div>
              <div className="mt-1 text-xs text-blue-600">
                {type.description}
              </div>
            </div>
          ))}
        </div>
      </aside>
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
