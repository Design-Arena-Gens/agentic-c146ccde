import { format } from "date-fns";
import { Clock, FileText } from "lucide-react";
import type { getDocument } from "@/server/documents";
import { NewVersionForm } from "./version/new-version-form";
import { SignatureCaptureForm } from "./version/signature-capture-form";

type DocumentDetail = NonNullable<Awaited<ReturnType<typeof getDocument>>>;

export function VersionTimeline({
  document,
  currentUser,
  canAuthor,
}: {
  document: DocumentDetail;
  currentUser: { id: string; role: string };
  canAuthor: boolean;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Version control
          </h2>
          <p className="text-sm text-slate-500">
            Each revision retains issue metadata and electronic signatures to
            satisfy Part 11 traceability.
          </p>
        </div>
        {canAuthor && (
          <NewVersionForm documentId={document.id} currentUser={currentUser} />
        )}
      </header>
      <div className="mt-6 space-y-4">
        {document.versions.map((version) => (
          <article
            key={version.id}
            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Version {version.versionLabel}
                </h3>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Issued by {version.issuedBy?.name ?? version.createdBy.name} (
                  {version.issuerRole}) on{" "}
                  {version.issueDate
                    ? format(version.issueDate, "dd MMM yyyy")
                    : "pending issue"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {version.summary ?? "No summary provided."}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-700">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Effective{" "}
                  {version.effectiveFrom
                    ? format(version.effectiveFrom, "dd MMM yyyy")
                    : "upon approval"}
                </div>
                <div className="mt-1">
                  Next issue:{" "}
                  {version.nextIssueDate
                    ? format(version.nextIssueDate, "dd MMM yyyy")
                    : "TBD"}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ContentPreview content={version.content} />
              </div>
              <div className="space-y-4">
                <SignatureCaptureForm
                  version={version}
                  currentUser={currentUser}
                  workflowSteps={document.workflows.flatMap((run) => run.steps)}
                />
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Signatures
                  </h4>
                  <ul className="mt-2 space-y-2 text-sm">
                    {version.signatures.length === 0 && (
                      <li className="text-xs text-slate-500">
                        No signatures captured yet.
                      </li>
                    )}
                    {version.signatures.map((signature) => (
                      <li
                        key={signature.id}
                        className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-emerald-700"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide">
                          {signature.purpose}
                        </div>
                        <div>{signature.user.name}</div>
                        <div className="text-xs text-emerald-600">
                          {format(signature.signedAt, "dd MMM yyyy HH:mm")}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContentPreview({ content }: { content: string | null | undefined }) {
  if (!content) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/70 px-4 py-6 text-sm text-slate-500">
        No controlled content captured. Uploads can be linked via validated
        repositories.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm leading-relaxed text-slate-700 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <FileText className="h-4 w-4" />
        Controlled content
      </div>
      <p className="whitespace-pre-wrap">{content}</p>
    </div>
  );
}
