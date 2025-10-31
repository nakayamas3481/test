"use client";

import { useFormState, useFormStatus } from "react-dom";

import { submitExpenseAction, type ActionResult } from "@/app/actions";

const initialState: ActionResult | undefined = undefined;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-400"
      disabled={pending}
    >
      {pending ? "送信中..." : "申請する"}
    </button>
  );
}

export function ExpenseForm() {
  const [state, formAction] = useFormState(submitExpenseAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700" htmlFor="title">
          タイトル
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="例: 出張交通費"
        />
        {state?.fieldErrors?.title && <p className="text-xs text-red-600">{state.fieldErrors.title}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700" htmlFor="amount">
          金額 (円)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="1200"
        />
        {state?.fieldErrors?.amount && <p className="text-xs text-red-600">{state.fieldErrors.amount}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700" htmlFor="description">
          補足説明 (任意)
        </label>
        <textarea
          id="description"
          name="description"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          rows={3}
        />
        {state?.fieldErrors?.description && <p className="text-xs text-red-600">{state.fieldErrors.description}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700" htmlFor="receipt">
          領収書ファイル (PDF/画像)
        </label>
        <input id="receipt" name="receipt" type="file" className="text-sm" />
      </div>
      {state?.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      {state?.status === "success" && <p className="text-sm text-green-600">{state.message}</p>}
      <SubmitButton />
    </form>
  );
}
