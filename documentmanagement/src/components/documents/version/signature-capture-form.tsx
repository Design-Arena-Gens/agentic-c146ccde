"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import type { getDocument } from "@/server/documents";

const signatureSchema = z.object({
  purpose: z.enum([
    "AUTHORSHIP",
    "REVIEW",
    "APPROVAL",
    "EFFECTIVITY",
    "ACKNOWLEDGEMENT",
  ]),
  password: z.string().min(8),
  comments: z.string().optional(),
  workflowStepId: z.string().optional(),
});

type SignatureInput = z.infer<typeof signatureSchema>;
type DocumentDetail = NonNullable<Awaited<ReturnType<typeof getDocument>>>;
type VersionDetail = DocumentDetail["versions"][number];
type WorkflowStep = DocumentDetail["workflows"][number]["steps"][number];

export function SignatureCaptureForm({
  version,
  currentUser,
  workflowSteps,
}: {
  version: VersionDetail;
  currentUser: { id: string; role: string };
  workflowSteps: WorkflowStep[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<SignatureInput>({
    resolver: zodResolver(signatureSchema) as Resolver<SignatureInput>,
    defaultValues: {
      purpose:
        currentUser.role === "AUTHOR"
          ? "AUTHORSHIP"
          : currentUser.role === "REVIEWER"
            ? "REVIEW"
            : "APPROVAL",
    },
  });

  const eligibleStep = useMemo(() => {
    return workflowSteps.find(
      (step) =>
        step.documentVersionId === null &&
        (step.assigneeId === currentUser.id || step.role === currentUser.role)
    );
  }, [workflowSteps, currentUser]);

  const alreadySigned = version.signatures.some(
    (signature) => signature.userId === currentUser.id
  );

  const disabled = alreadySigned && !eligibleStep;

  const onSubmit = (values: SignatureInput) => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(
        `/api/document-versions/${version.id}/signatures`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            workflowStepId: eligibleStep?.id ?? values.workflowStepId ?? null,
          }),
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "Signature capture failed");
        return;
      }

      form.reset({
        purpose: values.purpose,
        password: "",
        comments: "",
      });
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-4"
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
        <ShieldCheck className="h-4 w-4" />
        Electronic signature
      </div>
      <div className="space-y-1 text-xs text-emerald-700">
        <p>
          Sign with your unique credentials to comply with 21 CFR Part 11
          Subpart C (Electronic Signatures).
        </p>
        {eligibleStep && (
          <p className="font-semibold">
            Workflow step: {eligibleStep.stepType} · {eligibleStep.role}
          </p>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <label className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Purpose
        </label>
        <select
          {...form.register("purpose")}
          className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-200"
          disabled={disabled}
        >
          {[
            "AUTHORSHIP",
            "REVIEW",
            "APPROVAL",
            "EFFECTIVITY",
            "ACKNOWLEDGEMENT",
          ].map((purpose) => (
            <option key={purpose} value={purpose}>
              {purpose}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 text-sm">
        <label className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Password
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 focus-within:border-emerald-500 focus-within:ring-emerald-200">
          <KeyRound className="h-4 w-4 text-emerald-500" />
          <input
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="Re-enter your password"
            disabled={disabled}
          />
        </div>
        {form.formState.errors.password && (
          <div className="text-xs text-red-500">
            {form.formState.errors.password.message}
          </div>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <label className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Annotation (optional)
        </label>
        <textarea
          rows={3}
          {...form.register("comments")}
          className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-200"
          placeholder="Notes captured in the audit trail."
          disabled={disabled}
        />
      </div>
      {error && <div className="text-xs text-red-500">{error}</div>}
      <button
        type="submit"
        disabled={disabled || isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Capturing…
          </>
        ) : (
          "Sign and attest"
        )}
      </button>
      {disabled && (
        <p className="text-[11px] text-emerald-700">
          You have already signed this version. Additional signatures require QA
          override.
        </p>
      )}
    </form>
  );
}
