"use client";

import { useFormState, useFormStatus } from "react-dom";

import { approveExpenseAction, type ActionResult } from "@/app/actions";

const initialState: ActionResult | undefined = undefined;

function ActionButtons() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="submit"
        name="decision"
        value="approve"
        className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:bg-emerald-300"
        disabled={pending}
      >
        承認する
      </button>
      <button
        type="submit"
        name="decision"
        value="reject"
        className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:bg-red-300"
        disabled={pending}
      >
        却下する
      </button>
      {pending && <span className="text-xs text-slate-500">処理中...</span>}
    </div>
  );
}

export function ApprovalDecision({ stepId }: { stepId: string }) {
  const [state, formAction] = useFormState(approveExpenseAction, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="stepId" value={stepId} />
      <textarea
        name="comment"
        placeholder="コメント (任意)"
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        rows={2}
      />
      {state?.status === "error" && <p className="text-xs text-red-600">{state.message}</p>}
      {state?.status === "success" && <p className="text-xs text-emerald-600">{state.message}</p>}
      <ActionButtons />
    </form>
  );
}
