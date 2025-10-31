import { WorkflowForm } from "@/app/(app)/_components/workflow-form";
import { getCurrentUser } from "@/lib/auth";
import { getJobTitles, getWorkflows } from "@/lib/queries";

export default async function WorkflowPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  if (user.role !== "ADMIN") {
    return <p className="text-sm text-slate-500">ワークフローの編集権限がありません。</p>;
  }

  const [workflows, jobTitles] = await Promise.all([getWorkflows(), getJobTitles()]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">承認ワークフロー設定</h1>
        <p className="text-sm text-slate-500">
          申請者の職位ごとに承認ステップを定義します。1行につき1つの職位を入力してください。
        </p>
      </div>
      <WorkflowForm jobTitles={jobTitles} />
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">既存のワークフロー</h2>
        {workflows.length === 0 ? (
          <p className="rounded border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
            まだワークフローが登録されていません。
          </p>
        ) : (
          <ul className="space-y-3">
            {workflows.map((workflow) => (
              <li key={workflow.id} className="rounded border border-slate-200 bg-white p-4 text-sm">
                <p className="font-semibold text-slate-900">申請者: {workflow.applicantJobTitle}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-600">
                  {workflow.steps.map((step) => (
                    <li key={step.id}>{step.approverTitle}</li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
