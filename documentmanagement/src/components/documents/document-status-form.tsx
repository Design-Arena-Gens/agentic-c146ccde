"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { getDocument } from "@/server/documents";

const statusSchema = z.object({
  status: z.string(),
  lifecycleState: z.string(),
  documentSecurity: z.string(),
});

type StatusInput = z.infer<typeof statusSchema>;
type DocumentDetail = NonNullable<Awaited<ReturnType<typeof getDocument>>>;

export function DocumentStatusForm({
  document,
  currentUser,
}: {
  document: DocumentDetail;
  currentUser: { id: string; role: string };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<StatusInput>({
    resolver: zodResolver(statusSchema) as Resolver<StatusInput>,
    defaultValues: {
      status: document.status,
      lifecycleState: document.lifecycleState,
      documentSecurity: document.documentSecurity,
    },
  });

  const onSubmit = (values: StatusInput) => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "Unable to update document");
        return;
      }

      router.refresh();
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm"
    >
      <div className="flex gap-2">
        <select
          {...form.register("status")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide focus:border-blue-500 focus:ring-blue-200"
        >
          {["DRAFT", "IN_REVIEW", "APPROVED", "EFFECTIVE", "RETIRED", "ARCHIVED"].map(
            (status) => (
              <option key={status} value={status}>
                {status}
              </option>
            )
          )}
        </select>
        <select
          {...form.register("lifecycleState")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide focus:border-blue-500 focus:ring-blue-200"
        >
          {[
            "DRAFT",
            "IN_REVIEW",
            "PENDING_APPROVAL",
            "EFFECTIVE",
            "UNDER_REVISION",
            "OBSOLETE",
          ].map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <select
          {...form.register("documentSecurity")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide focus:border-blue-500 focus:ring-blue-200"
        >
          {["CONFIDENTIAL", "INTERNAL", "RESTRICTED", "PUBLIC"].map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Update
            </>
          )}
        </button>
      </div>
      {error && <div className="text-xs text-red-500">{error}</div>}
      <p className="text-[10px] text-slate-500">
        Changes are recorded in the immutable audit log with user {currentUser.id}.
      </p>
    </form>
  );
}
