import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listUsers } from "@/server/users";
import { UserCreateForm } from "@/components/admin/user-create-form";
import { UserStatusToggle } from "@/components/admin/user-status-toggle";
import { format } from "date-fns";

export default async function UsersAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  if (!["ADMIN", "QA_MANAGER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const users = await listUsers();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            User administration
          </h1>
          <p className="text-sm text-slate-500">
            Manage access, roles, lockouts, and electronic signature readiness.
          </p>
        </div>
        <UserCreateForm />
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="pb-3">Name</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Last login</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-blue-50/40">
                <td className="py-3 font-medium text-slate-800">{user.name}</td>
                <td className="py-3 text-slate-600">{user.email}</td>
                <td className="py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {user.role}
                </td>
                <td className="py-3">
                  <StatusBadge active={user.isActive} />
                </td>
                <td className="py-3 text-xs text-slate-500">
                  {user.lastLoginAt
                    ? format(user.lastLoginAt, "dd MMM yyyy HH:mm")
                    : "Never"}
                </td>
                <td className="py-3">
                  <UserStatusToggle userId={user.id} isActive={user.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
      Suspended
    </span>
  );
}
