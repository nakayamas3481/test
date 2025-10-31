import Link from "next/link";
import { redirect } from "next/navigation";

import { ApprovalDecision } from "@/app/(app)/_components/approval-decision";
import { getCurrentUser } from "@/lib/auth";
import { getApprovalHistory, getApprovalQueue } from "@/lib/queries";

const currency = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });
const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function ApprovalsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  if (user.role === "ADMIN") {
    redirect("/admin/workflows");
  }

  if (user.role !== "APPROVER") {
    return <p className="text-sm text-slate-500">承認権限がありません。</p>;
  }

  const [queue, history] = await Promise.all([
    getApprovalQueue(user.id),
    getApprovalHistory(user.id),
  ]);

  return (
    <div className="space-y-4">
      <section className="space-y-3">
        <h1 className="text-lg font-semibold text-slate-900">承認キュー</h1>
        {queue.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            現在対応が必要な申請はありません。
          </div>
        ) : (
          <ul className="space-y-4">
            {queue.map((step) => (
              <li key={step.id} className="space-y-3 rounded border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{step.expense.title}</h2>
                    <p className="text-sm text-slate-500">
                      申請者: {step.expense.submitter.name}（{step.expense.submitter.jobTitle}）
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{currency.format(step.expense.amount)}</p>
                    <p className="text-xs text-slate-500">提出: {dateFormat.format(step.expense.createdAt)}</p>
                  </div>
                </div>
                {step.expense.description && <p className="text-sm text-slate-600">{step.expense.description}</p>}
                {step.expense.receiptPath && (
                  <Link
                    href={`/receipts/${step.expense.receiptPath.replace(/^uploads\/?/, "")}`}
                    className="inline-flex items-center text-sm text-blue-600 hover:underline"
                    target="_blank"
                  >
                    領収書を表示
                  </Link>
                )}
                <ApprovalDecision stepId={step.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">最近の処理履歴</h2>
        {history.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            過去の処理履歴はまだありません。
          </div>
        ) : (
          <ul className="space-y-3">
            {history.map((step) => (
              <li key={step.id} className="rounded border border-slate-200 bg-white p-4 text-sm shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{step.expense.title}</p>
                    <p className="text-xs text-slate-500">
                      申請者: {step.expense.submitter.name}（{step.expense.submitter.jobTitle}）
                    </p>
                    <p className="text-xs text-slate-500">金額: {currency.format(step.expense.amount)}</p>
                    {step.expense.receiptPath && (
                      <Link
                        href={`/receipts/${step.expense.receiptPath.replace(/^uploads\/?/, "")}`}
                        className="inline-flex items-center text-xs text-blue-600 hover:underline"
                        target="_blank"
                      >
                        領収書を表示
                      </Link>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{statusLabel(step.status)}</p>
                    {step.decisionAt && <p className="text-xs text-slate-500">{dateFormat.format(step.decisionAt)}</p>}
                  </div>
                </div>
                {step.comment && <p className="mt-2 text-xs text-slate-500">コメント: {step.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}

function statusLabel(status: string) {
  if (status === "APPROVED") return "承認済み";
  if (status === "REJECTED") return "却下";
  if (status === "SKIPPED") return "スキップ";
  return status;
}
