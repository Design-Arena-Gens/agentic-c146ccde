"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2, Trash2 } from "lucide-react";

const stepSchema = z.object({
  stepOrder: z.number(),
  role: z.string(),
  stepType: z.string(),
  requireSignature: z.boolean(),
  slaHours: z.number().min(1).max(720).optional(),
});

const templateSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  category: z.string().optional(),
  isDefault: z.boolean().optional(),
  steps: z.array(stepSchema).min(1),
});

type TemplateInput = z.infer<typeof templateSchema>;

export function WorkflowTemplateForm({ categories }: { categories: string[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<TemplateInput>({
    resolver: zodResolver(templateSchema) as Resolver<TemplateInput>,
    defaultValues: {
      isDefault: false,
      steps: [
        {
          stepOrder: 1,
          role: "AUTHOR",
          stepType: "REVIEW",
          requireSignature: true,
        },
        {
          stepOrder: 2,
          role: "QA_MANAGER",
          stepType: "APPROVAL",
          requireSignature: true,
        },
      ],
    },
  });

  const steps = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const onSubmit = (values: TemplateInput) => {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "Unable to create template");
        return;
      }

      form.reset();
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="w-full max-w-xl">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:border-blue-300"
      >
        <Plus className="h-4 w-4" />
        New template
      </button>
      {open && (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Template name"
              error={form.formState.errors.name?.message}
            >
              <input
                {...form.register("name")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
              />
            </Field>
            <Field label="Category">
              <select
                {...form.register("category")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
              >
                <option value="">Any</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={2}
              {...form.register("description")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...form.register("isDefault")} />
            Set as default workflow for selected category
          </label>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                Steps ({steps.fields.length})
              </h3>
              <button
                type="button"
                onClick={() =>
                  steps.append({
                    stepOrder: steps.fields.length + 1,
                    role: "QA",
                    stepType: "REVIEW",
                    requireSignature: true,
                  })
                }
                className="inline-flex items-center gap-1 rounded border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 hover:border-blue-300"
              >
                <Plus className="h-3.5 w-3.5" />
                Add step
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {steps.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:grid-cols-[auto,auto,auto,120px,40px]"
                >
                  <input
                    type="number"
                    min={1}
                    {...form.register(`steps.${index}.stepOrder`, {
                      valueAsNumber: true,
                    })}
                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
                  />
                  <select
                    {...form.register(`steps.${index}.stepType`)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
                  >
                    {["REVIEW", "APPROVAL", "NOTIFICATION"].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    {...form.register(`steps.${index}.role`)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
                  >
                    {[
                      "AUTHOR",
                      "REVIEWER",
                      "APPROVER",
                      "QA",
                      "QA_MANAGER",
                      "DOCUMENT_CONTROLLER",
                    ].map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-600">
                      <input
                        type="checkbox"
                        {...form.register(`steps.${index}.requireSignature`)}
                        className="mr-1"
                      />
                      Signature
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={720}
                      placeholder="SLA hrs"
                      {...form.register(`steps.${index}.slaHours`, {
                        valueAsNumber: true,
                      })}
                      className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:ring-blue-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => steps.remove(index)}
                    className="self-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
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
              "Save template"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1 text-sm">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      {children}
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
}
