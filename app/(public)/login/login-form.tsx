"use client";

import { useFormState, useFormStatus } from "react-dom";

import { loginAction, type ActionResult } from "@/app/actions";

const initialState: ActionResult | undefined = undefined;

function SubmitButton() {
  const status = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-400"
      disabled={status.pending}
    >
      {status.pending ? "送信中..." : "ログイン"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded border border-slate-200 bg-white p-6 shadow-sm">
      {state?.status === "error" && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{state.message}</div>
      )}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="user@example.com"
          required
        />
        {state?.fieldErrors?.email && (
          <p className="text-xs text-red-600">{state.fieldErrors.email}</p>
        )}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          required
        />
        {state?.fieldErrors?.password && (
          <p className="text-xs text-red-600">{state.fieldErrors.password}</p>
        )}
      </div>
      <SubmitButton />
    </form>
  );
}
