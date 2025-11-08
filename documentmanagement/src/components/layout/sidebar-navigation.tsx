"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type Item = {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function SidebarNavigation({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-3 py-3 transition",
              active
                ? "bg-blue-100 font-semibold text-blue-700 shadow-sm"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            )}
          >
            <Icon className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="text-sm">{item.name}</span>
              <span className="text-xs text-slate-500">{item.description}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
