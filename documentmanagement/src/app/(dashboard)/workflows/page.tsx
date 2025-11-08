import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listWorkflowTemplates } from "@/server/workflows";
import { WorkflowTemplateForm } from "@/components/workflows/workflow-template-form";
import { formatDistanceToNow } from "date-fns";

export default async function WorkflowsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const templates = await listWorkflowTemplates();
  const canManage = ["ADMIN", "QA_MANAGER", "DOCUMENT_CONTROLLER"].includes(
    session.user.role
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Workflow templates
          </h1>
          <p className="text-sm text-slate-500">
            Define role-based review and approval sequences to enforce GMP,
            ISO 9001, and ICH Q7 controls.
          </p>
        </div>
        {canManage && (
          <WorkflowTemplateForm categories={["QUALITY", "OPERATIONS", "REGULATORY", "VALIDATION", "OTHER"]} />
        )}
      </header>
      <section className="grid gap-4 lg:grid-cols-2">
        {templates.map((template) => (
          <article
            key={template.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {template.name}
                </h2>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Category: {template.category ?? "Any"} · Created{" "}
                  {formatDistanceToNow(template.createdAt, { addSuffix: true })}
                </p>
              </div>
              {template.isDefault && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Default
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {template.description ?? "No description provided."}
            </p>
            <ol className="mt-4 space-y-2 text-sm">
              {template.steps.map((step) => (
                <li
                  key={step.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                    <span>
                      Step {step.stepOrder}: {step.stepType}
                    </span>
                    <span>Role: {step.role}</span>
                  </div>
                  {step.requireSignature && (
                    <div className="text-[11px] text-emerald-600">
                      Electronic signature required
                    </div>
                  )}
                  {step.slaHours && (
                    <div className="text-[11px] text-slate-500">
                      SLA: {step.slaHours} hours
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </article>
        ))}
        {templates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-6 text-sm text-blue-700">
            No workflow templates yet. Create one to standardize compliant review
            cycles.
          </div>
        )}
      </section>
    </div>
  );
}
