"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import clsx from "clsx";

export function UserMenu({ name }: { name?: string | null }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((state) => !state)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
      >
        <ShieldCheck className="h-4 w-4 text-blue-600" />
        <span>{name ?? "Account"}</span>
        <ChevronDown className={clsx("h-4 w-4 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 mt-3 w-60 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl ring-1 ring-blue-100">
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Electronic signature access requires unique credentials.
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Sign out securely
          </button>
        </div>
      )}
    </div>
  );
}
