"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema) as Resolver<LoginInput>,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginInput) => {
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: searchParams?.get("callbackUrl") ?? "/dashboard",
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      router.replace(result?.url ?? "/dashboard");
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-white px-4">
      <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-10 shadow-xl">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            DocumentManagement DMS
          </h1>
          <p className="text-sm text-slate-500">
            Secure access with full audit readiness.
          </p>
        </div>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="email"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
              className={clsx(
                "w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition",
                form.formState.errors.email
                  ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
              )}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
              className={clsx(
                "w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition",
                form.formState.errors.password
                  ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
              )}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-500">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Authenticating…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link
            href="https://pharma.gov/21cfr11"
            target="_blank"
            rel="noopener"
            className="text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            21 CFR Part 11 compliance statement
          </Link>
        </div>
      </div>
    </div>
  );
}
