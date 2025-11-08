"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Loader2, UserPlus } from "lucide-react";

const userSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(12),
  role: z.string(),
});

type UserInput = z.infer<typeof userSchema>;

export function UserCreateForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<UserInput>({
    resolver: zodResolver(userSchema) as Resolver<UserInput>,
    defaultValues: {
      role: "AUTHOR",
    },
  });

  const onSubmit = (values: UserInput) => {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "Unable to create user");
        return;
      }

      form.reset({ role: "AUTHOR" });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="w-full max-w-lg">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:border-blue-300"
      >
        <UserPlus className="h-4 w-4" />
        New user
      </button>
      {open && (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" error={form.formState.errors.name?.message}>
              <input
                {...form.register("name")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
              />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <input
                type="email"
                {...form.register("email")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
              />
            </Field>
          </div>
          <Field
            label="Temporary password"
            error={form.formState.errors.password?.message}
          >
            <input
              type="password"
              {...form.register("password")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
            />
          </Field>
          <Field label="Role">
            <select
              {...form.register("role")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-200"
            >
              {[
                "ADMIN",
                "QA_MANAGER",
                "QA",
                "DOCUMENT_CONTROLLER",
                "AUTHOR",
                "REVIEWER",
                "APPROVER",
                "VIEWER",
              ].map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-blue-700">
            <ShieldCheck className="mr-2 inline h-3.5 w-3.5" />
            All users must have unique credentials for electronic signatures.
            Enforce password changes on first login.
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
                Provisioning…
              </>
            ) : (
              "Create user"
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
