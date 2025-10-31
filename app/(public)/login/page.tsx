import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Expense Approval</h1>
          <p className="mt-2 text-sm text-slate-500">研修用の経費申請アプリにログインしてください。</p>
        </div>
        <LoginForm />
        <div className="rounded border border-slate-200 bg-white p-4 text-xs text-slate-500">
          <p className="font-medium">サンプルアカウント</p>
          <ul className="mt-2 space-y-1">
            <li>エンジニア: engineer@example.com / engineerpass</li>
            <li>承認者: lead@example.com / leadpass</li>
            <li>財務: finance@example.com / financepass</li>
            <li>管理者: admin@example.com / adminpass</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
