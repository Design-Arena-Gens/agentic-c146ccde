"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Power, Loader2 } from "lucide-react";

export function UserStatusToggle({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggle = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "Unable to update user");
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={toggle}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
          isActive
            ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        } disabled:cursor-not-allowed`}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Power className="h-3.5 w-3.5" />
        )}
        {isActive ? "Suspend" : "Activate"}
      </button>
      {error && <div className="text-[11px] text-red-500">{error}</div>}
    </div>
  );
}
