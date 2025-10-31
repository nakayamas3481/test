"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { saveWorkflowAction, type ActionResult } from "@/app/actions";

const initialState: ActionResult | undefined = undefined;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-400"
      disabled={pending}
    >
      {pending ? "保存中..." : "保存"}
    </button>
  );
}

export function WorkflowForm({ jobTitles }: { jobTitles: string[] }) {
  const [state, formAction] = useFormState(saveWorkflowAction, initialState);
  const [selectedJob, setSelectedJob] = useState("");

  return (
    <form action={formAction} className="space-y-4 rounded border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700" htmlFor="applicantJobTitle">
          申請者の職位
        </label>
        <input
          id="applicantJobTitle"
          name="applicantJobTitle"
          list="job-title-options"
          value={selectedJob}
          onChange={(event) => setSelectedJob(event.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Engineer"
          required
        />
        <datalist id="job-title-options">
          {jobTitles.map((title) => (
            <option key={title} value={title} />
          ))}
        </datalist>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="steps">
          承認者の職位 (1行につき1つ)
        </label>
        <textarea
          id="steps"
          name="steps"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          rows={4}
          placeholder={"Team Lead\nFinance"}
          required
        />
        <p className="text-xs text-slate-500">入力順に承認が進みます。最低1名が必要です。</p>
      </div>
      {state?.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      {state?.status === "success" && <p className="text-sm text-emerald-600">{state.message}</p>}
      <SubmitButton />
    </form>
  );
}
