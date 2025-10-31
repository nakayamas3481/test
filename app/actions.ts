"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { approveStep, rejectStep, submitExpense } from "@/lib/services/expenses";
import { upsertWorkflow } from "@/lib/services/workflows";
import { expenseSchema, loginSchema, approvalSchema, workflowSchema } from "@/lib/validation";
import { getCurrentUser, signIn, signOut } from "@/lib/auth";

export type ActionResult = {
  status: "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function loginAction(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parse = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parse.success) {
    const { fieldErrors } = parse.error.flatten();
    const flatErrors: Record<string, string> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value && value.length > 0) {
        flatErrors[key] = value[0];
      }
    }
    return { status: "error", message: "入力内容を確認してください", fieldErrors: flatErrors };
  }

  const user = await signIn(parse.data.email, parse.data.password);
  if (!user) {
    return { status: "error", message: "メールアドレスまたはパスワードが正しくありません" };
  }

  const destination =
    user.role === "ADMIN" ? "/admin/workflows" : user.role === "APPROVER" ? "/approvals" : "/";

  redirect(destination);
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}

export async function submitExpenseAction(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "EMPLOYEE" && user.role !== "ADMIN") {
    return { status: "error", message: "経費申請の権限がありません" };
  }

  const receipt = formData.get("receipt");
  const schemaResult = expenseSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    description: formData.get("description") ?? "",
  });

 if (!schemaResult.success) {
    const { fieldErrors } = schemaResult.error.flatten();
    const flatErrors: Record<string, string> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value && value.length > 0) {
        flatErrors[key] = value[0];
      }
    }
    const fallback = schemaResult.error.errors[0]?.message ?? "入力エラーがあります";
    return {
      status: "error",
      message: fallback,
      fieldErrors: flatErrors,
    };
  }

  try {
    await submitExpense({
      submitterId: user.id,
      title: schemaResult.data.title,
      amount: schemaResult.data.amount,
      description: schemaResult.data.description,
      receipt: receipt instanceof File ? receipt : null,
    });
    revalidatePath("/");
    revalidatePath("/approvals");
    return { status: "success", message: "経費申請を登録しました" };
  } catch (error) {
    return { status: "error", message: (error as Error).message };
  }
}

export async function approveExpenseAction(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "APPROVER" && user.role !== "ADMIN") {
    return { status: "error", message: "承認権限がありません" };
  }

  const parsed = approvalSchema.safeParse({
    stepId: formData.get("stepId"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    return { status: "error", message: "入力内容を確認してください" };
  }

  const decision = formData.get("decision");

  try {
    if (decision === "approve") {
      await approveStep({ approverId: user.id, stepId: parsed.data.stepId, comment: parsed.data.comment });
    } else {
      await rejectStep({ approverId: user.id, stepId: parsed.data.stepId, comment: parsed.data.comment });
    }
    revalidatePath("/approvals");
    revalidatePath("/");
    return { status: "success", message: "処理が完了しました" };
  } catch (error) {
    return { status: "error", message: (error as Error).message };
  }
}

export async function saveWorkflowAction(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    return { status: "error", message: "ワークフローの編集権限がありません" };
  }

  const parsed = workflowSchema.safeParse({
    applicantJobTitle: formData.get("applicantJobTitle"),
    steps: formData.get("steps"),
  });

  if (!parsed.success) {
    return { status: "error", message: "入力内容を確認してください" };
  }

  try {
    await upsertWorkflow({
      applicantJobTitle: parsed.data.applicantJobTitle.trim(),
      approverTitles: parsed.data.steps,
    });
    revalidatePath("/admin/workflows");
    return { status: "success", message: "ワークフローを更新しました" };
  } catch (error) {
    return { status: "error", message: (error as Error).message };
  }
}
