import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listDocumentTypes } from "@/server/document-types";
import { listWorkflowTemplates } from "@/server/workflows";
import { NewDocumentForm } from "@/components/documents/new-document-form";

export default async function NewDocumentPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const [types, workflows] = await Promise.all([
    listDocumentTypes(),
    listWorkflowTemplates(),
  ]);

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Create controlled document
        </h1>
        <p className="text-sm text-slate-500">
          Capture issuer details, security classification, and initiate required
          workflow routing for 21 CFR Part 11 compliance.
        </p>
      </header>
      <NewDocumentForm
        userId={session.user.id}
        types={types}
        workflows={workflows}
      />
    </div>
  );
}
