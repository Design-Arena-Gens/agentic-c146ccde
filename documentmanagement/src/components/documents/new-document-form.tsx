"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  type UseFormReturn,
  type Path,
  type Resolver,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, FilePlus, AlertCircle, ShieldCheck } from "lucide-react";

const DOCUMENT_CATEGORIES = [
  "QUALITY",
  "OPERATIONS",
  "REGULATORY",
  "VALIDATION",
  "MANUFACTURING",
  "LAB",
  "SAFETY",
  "TRAINING",
  "SUPPLIER",
  "OTHER",
] as const;

const DOCUMENT_SECURITY = [
  "CONFIDENTIAL",
  "INTERNAL",
  "RESTRICTED",
  "PUBLIC",
] as const;

const ROLES = [
  "ADMIN",
  "QA_MANAGER",
  "QA",
  "DOCUMENT_CONTROLLER",
  "AUTHOR",
  "REVIEWER",
  "APPROVER",
] as const;

const newDocumentSchema = z.object({
  title: z.string().min(3),
  documentNumber: z.string().min(3),
  documentCategory: z.enum(DOCUMENT_CATEGORIES),
  documentSecurity: z.enum(DOCUMENT_SECURITY),
  typeId: z.coerce.number().int(),
  versionLabel: z.string().min(1),
  issueDate: z.string().optional(),
  effectiveFrom: z.string().optional(),
  nextIssueDate: z.string().optional(),
  issuerRole: z.enum(ROLES),
  summary: z.string().optional(),
  changeNote: z.string().optional(),
  workflowTemplateId: z.string().optional(),
  content: z.string().optional(),
});

type NewDocumentInput = z.infer<typeof newDocumentSchema>;

type DocumentType = {
  id: number;
  type: string;
  description: string;
};

type WorkflowTemplate = {
  id: string;
  name: string;
  description: string | null;
  steps: { id: string; stepOrder: number; role: string; stepType: string }[];
};

export function NewDocumentForm({
  userId,
  types,
  workflows,
}: {
  userId: string;
  types: DocumentType[];
  workflows: WorkflowTemplate[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<NewDocumentInput>({
    resolver: zodResolver(newDocumentSchema) as Resolver<NewDocumentInput>,
    defaultValues: {
      documentSecurity: "INTERNAL",
      documentCategory: "QUALITY",
      issuerRole: "AUTHOR",
      versionLabel: "1.0",
    },
  });

  const onSubmit = (values: NewDocumentInput) => {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          issueDate: values.issueDate || null,
          effectiveFrom: values.effectiveFrom || null,
          nextIssueDate: values.nextIssueDate || null,
          issuedById: userId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "Failed to create document");
        return;
      }

      const result = await response.json();
      router.push(`/documents/${result.documentId}`);
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="title">
            Document title
          </label>
          <input
            id="title"
            {...form.register("title")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
            placeholder="e.g., GMP Cleaning Procedure"
          />
          {form.formState.errors.title && (
            <p className="text-xs text-red-500">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="documentNumber"
          >
            Document number
          </label>
          <input
            id="documentNumber"
            {...form.register("documentNumber")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
            placeholder="DOC-QUAL-00045"
          />
          {form.formState.errors.documentNumber && (
            <p className="text-xs text-red-500">
              {form.formState.errors.documentNumber.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="documentCategory"
          >
            Category
          </label>
          <select
            id="documentCategory"
            {...form.register("documentCategory")}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
          >
            {DOCUMENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="documentSecurity"
          >
            Security classification
          </label>
          <select
            id="documentSecurity"
            {...form.register("documentSecurity")}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
          >
            {DOCUMENT_SECURITY.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="typeId">
            Document type
          </label>
          <select
            id="typeId"
            {...form.register("typeId")}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
          >
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.type}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="versionLabel"
          >
            Initial version
          </label>
          <input
            id="versionLabel"
            {...form.register("versionLabel")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <FormDateField
          label="Date of issue"
          field="issueDate"
          icon={<CalendarDays className="h-4 w-4 text-blue-600" />}
          form={form}
        />
        <FormDateField
          label="Effective from"
          field="effectiveFrom"
          icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
          form={form}
        />
        <FormDateField
          label="Next issue date"
          field="nextIssueDate"
          icon={<AlertCircle className="h-4 w-4 text-amber-600" />}
          form={form}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="issuerRole"
          >
            Issuer role
          </label>
          <select
            id="issuerRole"
            {...form.register("issuerRole")}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="workflowTemplateId"
          >
            Workflow template
          </label>
          <select
            id="workflowTemplateId"
            {...form.register("workflowTemplateId")}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
          >
            <option value="">Manual routing</option>
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            Templates enforce sequential review and approval aligned to ISO 9001
            and ICH Q7 expectations.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="summary">
            Executive summary
          </label>
          <textarea
            id="summary"
            rows={3}
            {...form.register("summary")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
            placeholder="Short description of the document purpose."
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="changeNote"
          >
            Change rationale
          </label>
          <textarea
            id="changeNote"
            rows={3}
            {...form.register("changeNote")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
            placeholder="Outline triggers, impact assessment, and training requirements."
          />
        </div>
      </section>

      <section className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="content">
          Document body
        </label>
        <textarea
          id="content"
          rows={8}
          {...form.register("content")}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
          placeholder="Paste or draft the initial controlled content. Attachments can be referenced via controlled repositories."
        />
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Submission will trigger full audit logging and workflow routing in
          line with 21 CFR Part 11 electronic signature controls.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          <FilePlus className="h-4 w-4" />
          {isPending ? "Creating..." : "Create document"}
        </button>
      </div>
    </form>
  );
}

function FormDateField({
  label,
  field,
  icon,
  form,
}: {
  label: string;
  field: keyof NewDocumentInput;
  icon: React.ReactNode;
  form: UseFormReturn<NewDocumentInput>;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700" htmlFor={field}>
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-blue-500 focus-within:ring-blue-200">
        {icon}
        <input
          id={field}
          type="datetime-local"
          {...form.register(field as Path<NewDocumentInput>)}
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}
