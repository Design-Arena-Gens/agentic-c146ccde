"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Loader2 } from "lucide-react";

const typeSchema = z.object({
  type: z.string().min(3),
  description: z.string().min(5),
});

type TypeInput = z.infer<typeof typeSchema>;

export function DocumentTypeForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<TypeInput>({
    resolver: zodResolver(typeSchema) as Resolver<TypeInput>,
  });

  const onSubmit = (values: TypeInput) => {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/document-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "Unable to create document type");
        return;
      }

      form.reset();
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
        New document type
      </button>
      {open && (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Type
            </label>
            <input
              {...form.register("type")}
              placeholder="Manual, SOP, Template..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
            />
            {form.formState.errors.type && (
              <div className="text-xs text-red-500">
                {form.formState.errors.type.message}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Description
            </label>
            <textarea
              rows={3}
              {...form.register("description")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
            />
            {form.formState.errors.description && (
              <div className="text-xs text-red-500">
                {form.formState.errors.description.message}
              </div>
            )}
          </div>
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
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
              "Save type"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
