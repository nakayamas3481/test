import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";

const navItems = [
  { href: "/", label: "経費一覧", roles: ["EMPLOYEE"] },
  { href: "/approvals", label: "承認キュー", roles: ["APPROVER"] },
  { href: "/admin/workflows", label: "ワークフロー管理", roles: ["ADMIN"] },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const items = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">ログイン中: {user.name}</p>
            <p className="text-xs text-slate-400">{user.jobTitle}</p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className="text-slate-600 hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction}>
            <button className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100" type="submit">
              ログアウト
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
