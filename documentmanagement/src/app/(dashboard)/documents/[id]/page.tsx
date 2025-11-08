import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDocument } from "@/server/documents";
import { DocumentMetadataCard } from "@/components/documents/document-metadata-card";
import { VersionTimeline } from "@/components/documents/version-timeline";
import { WorkflowPanel } from "@/components/documents/workflow-panel";
import { AuditTrailPanel } from "@/components/documents/audit-trail-panel";

type PageParams = {
  params: Promise<{ id: string }>;
};

export default async function DocumentDetailPage({ params }: PageParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const document = await getDocument(id);

  if (!document) {
    notFound();
  }

  const canManage = ["ADMIN", "QA_MANAGER", "DOCUMENT_CONTROLLER", "QA"].includes(
    session.user.role
  );
  const canAuthor = canManage || session.user.role === "AUTHOR";

  return (
    <div className="space-y-6">
      <DocumentMetadataCard
        document={document}
        canManage={canManage}
        currentUser={session.user}
      />
      <VersionTimeline
        document={document}
        currentUser={session.user}
        canAuthor={canAuthor}
      />
      <WorkflowPanel document={document} currentUser={session.user} />
      <AuditTrailPanel document={document} />
    </div>
  );
}
