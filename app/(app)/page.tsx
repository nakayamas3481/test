import Link from "next/link";
import { redirect } from "next/navigation";

import { ExpenseForm } from "@/app/(app)/_components/expense-form";
import { getCurrentUser } from "@/lib/auth";
import { getEmployeeExpenses } from "@/lib/queries";

const currency = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });
const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});

const statusLabels: Record<string, string> = {
  PENDING: "未処理",
  IN_REVIEW: "承認中",
  APPROVED: "承認済",
  REJECTED: "却下",
  DRAFT: "下書き",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  if (user.role === "APPROVER") {
    redirect("/approvals");
  }

  if (user.role === "ADMIN") {
    redirect("/admin/workflows");
  }

  const expenses = await getEmployeeExpenses(user.id);

  return (
    <div className="space-y-8">
      {(user.role === "EMPLOYEE" || user.role === "ADMIN") && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">新規経費申請</h2>
          <p className="text-sm text-slate-500">
            ワークフローが設定されている職位のみ申請できます。領収書ファイルはPDFまたは画像を添付してください。
          </p>
          <ExpenseForm />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">申請履歴</h2>
        {expenses.length === 0 ? (
          <p className="rounded border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            まだ申請はありません。
          </p>
        ) : (
          <ul className="space-y-4">
            {expenses.map((expense) => (
              <li key={expense.id} className="space-y-3 rounded border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{expense.title}</h3>
                    <p className="text-sm text-slate-500">{dateFormat.format(expense.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{currency.format(expense.amount)}</p>
                    <p className="text-xs text-slate-500">ステータス: {statusLabels[expense.status] ?? expense.status}</p>
                  </div>
                </div>
                {expense.description && <p className="text-sm text-slate-600">{expense.description}</p>}
                {expense.receiptPath && (
                  <Link
                    href={`/receipts/${expense.receiptPath.replace(/^uploads\/?/, "")}`}
                    className="inline-flex items-center text-sm text-blue-600 hover:underline"
                    target="_blank"
                  >
                    領収書を表示
                  </Link>
                )}
                <div className="rounded border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">承認フロー</p>
                  <ol className="mt-2 space-y-1 text-sm">
                    {expense.approvals.map((approval) => (
                      <li key={approval.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <span>
                          {approval.order}. {approval.approverTitle}
                          {approval.assignedUser && <span className="text-slate-500">（{approval.assignedUser.name}）</span>}
                        </span>
                        <span className="text-xs text-slate-500">
                          {approval.status === "PENDING" && "対応待ち"}
                          {approval.status === "WAITING" && "順番待ち"}
                          {approval.status === "APPROVED" && `承認 (${approval.decisionAt ? dateFormat.format(approval.decisionAt) : ""})`}
                          {approval.status === "REJECTED" && `却下 (${approval.decisionAt ? dateFormat.format(approval.decisionAt) : ""})`}
                          {approval.status === "SKIPPED" && "スキップ"}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
