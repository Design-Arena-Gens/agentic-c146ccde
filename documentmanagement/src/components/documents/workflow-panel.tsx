import { formatDistanceToNow } from "date-fns";
import { GitBranch, CheckCircle2, Clock3 } from "lucide-react";
import type { getDocument } from "@/server/documents";

type DocumentDetail = NonNullable<Awaited<ReturnType<typeof getDocument>>>;

export function WorkflowPanel({
  document,
  currentUser,
}: {
  document: DocumentDetail;
  currentUser: { id: string; role: string };
}) {
  if (document.workflows.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-6 text-sm text-blue-700">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
          <GitBranch className="h-4 w-4" />
          Workflow routing
        </div>
        <p className="mt-2">
          No active workflows yet. Launch a template during document creation or
          update to ensure review and approval traceability.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Workflow routing
          </h2>
          <p className="text-sm text-slate-500">
            Tracks review and approval steps aligned to validated SOPs.
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {document.workflows.map((run) => (
          <div
            key={run.id}
            className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {run.template?.name ?? "Custom workflow"}
                </div>
                <div className="text-xs text-blue-700">
                  Started {formatDistanceToNow(run.startedAt, { addSuffix: true })}
                </div>
              </div>
              <WorkflowStatus status={run.status} />
            </div>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {run.steps.map((step) => (
                <li
                  key={step.id}
                  className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${
                    step.status === "COMPLETED"
                      ? "border-emerald-200 bg-emerald-50/80 text-emerald-700"
                      : step.status === "IN_PROGRESS"
                        ? "border-blue-200 bg-white text-blue-700"
                        : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                    <span>{step.stepType}</span>
                    <span className="font-semibold">{step.status}</span>
                  </div>
                  <div className="mt-1 text-xs">
                    Role: <strong>{step.role}</strong>
                  </div>
                  {step.assignee && (
                    <div className="text-xs">
                      Assigned to: {step.assignee.name}
                    </div>
                  )}
                  {step.completedAt && (
                    <div className="text-xs">
                      Completed {formatDistanceToNow(step.completedAt, { addSuffix: true })}
                    </div>
                  )}
                  {step.comments && (
                    <div className="mt-1 rounded bg-white/70 px-2 py-1 text-xs">
                      {step.comments}
                    </div>
                  )}
                  {step.signatures.length > 0 && (
                    <div className="mt-1 text-[11px] text-emerald-700">
                      Signed by {step.signatures[0].user?.name}
                    </div>
                  )}
                  {step.status !== "COMPLETED" &&
                    (step.assigneeId === currentUser.id ||
                      step.role === currentUser.role) && (
                      <div className="mt-2 text-[11px] font-semibold text-blue-700">
                        Action required by you.
                      </div>
                    )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkflowStatus({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
      <Clock3 className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}
