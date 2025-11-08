import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listDocumentTypes } from "@/server/document-types";
import { DocumentTypeForm } from "@/components/admin/document-type-form";

export default async function ConfigurationPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const types = await listDocumentTypes();
  const canManage = ["ADMIN", "QA_MANAGER", "DOCUMENT_CONTROLLER"].includes(
    session.user.role
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Configuration
          </h1>
          <p className="text-sm text-slate-500">
            Maintain controlled vocabularies for document types, security, and
            lifecycle settings.
          </p>
        </div>
        {canManage && <DocumentTypeForm />}
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Document types
        </h2>
        <p className="text-sm text-slate-500">
          Ensure consistent classification across manuals, SOPs, policies, and
          templates.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((type) => (
            <article
              key={type.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="text-sm font-semibold text-slate-800">
                {type.type}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {type.description}
              </div>
            </article>
          ))}
          {types.length === 0 && (
            <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-700">
              No document types configured. Add at least manual, procedure, work
              instruction, and template classifications.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
