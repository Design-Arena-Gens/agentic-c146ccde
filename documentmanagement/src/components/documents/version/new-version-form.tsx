"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Loader2 } from "lucide-react";

const versionSchema = z.object({
  versionLabel: z.string().min(1),
  issueDate: z.string().optional(),
  effectiveFrom: z.string().optional(),
  nextIssueDate: z.string().optional(),
  issuerRole: z.string().min(1),
  summary: z.string().optional(),
  changeNote: z.string().optional(),
  content: z.string().optional(),
});

type VersionInput = z.infer<typeof versionSchema>;

export function NewVersionForm({
  documentId,
  currentUser,
}: {
  documentId: string;
  currentUser: { id: string; role: string };
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<VersionInput>({
    resolver: zodResolver(versionSchema) as Resolver<VersionInput>,
    defaultValues: {
      issuerRole: currentUser.role,
    },
  });

  const onSubmit = (values: VersionInput) => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          issueDate: values.issueDate || null,
          effectiveFrom: values.effectiveFrom || null,
          nextIssueDate: values.nextIssueDate || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "Unable to create version");
        return;
      }

      form.reset({ issuerRole: currentUser.role });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="w-full max-w-md">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:border-blue-300"
      >
        <PlusCircle className="h-4 w-4" />
        New revision
      </button>
      {open && (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <FormTextField
            form={form}
            name="versionLabel"
            label="Version label"
            placeholder="1.1"
          />
          <FormRow>
            <FormDateField form={form} name="issueDate" label="Issue date" />
            <FormDateField
              form={form}
              name="effectiveFrom"
              label="Effective from"
            />
          </FormRow>
          <FormDateField
            form={form}
            name="nextIssueDate"
            label="Next issue date"
          />
          <FormTextField
            form={form}
            name="issuerRole"
            label="Issuer role"
            placeholder={currentUser.role}
          />
          <FormTextarea
            form={form}
            name="summary"
            label="Summary"
            placeholder="Highlights of this revision."
          />
          <FormTextarea
            form={form}
            name="changeNote"
            label="Change note"
            placeholder="Regulatory impact, validation needs, training."
          />
          <FormTextarea
            form={form}
            name="content"
            label="Controlled content"
            placeholder="Paste revised content."
            rows={4}
          />
          {error && <div className="text-sm text-red-500">{error}</div>}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              "Save version"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function FormTextField({
  form,
  name,
  label,
  placeholder,
}: {
  form: UseFormReturn<VersionInput>;
  name: keyof VersionInput;
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      <input
        {...form.register(name)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
      />
      {form.formState.errors[name] && (
        <div className="text-xs text-red-500">
          {form.formState.errors[name]?.message?.toString()}
        </div>
      )}
    </div>
  );
}

function FormTextarea({
  form,
  name,
  label,
  placeholder,
  rows = 3,
}: {
  form: UseFormReturn<VersionInput>;
  name: keyof VersionInput;
  label: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      <textarea
        rows={rows}
        {...form.register(name)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
      />
    </div>
  );
}

function FormDateField({
  form,
  name,
  label,
}: {
  form: UseFormReturn<VersionInput>;
  name: keyof VersionInput;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      <input
        type="datetime-local"
        {...form.register(name)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
      />
    </div>
  );
}
