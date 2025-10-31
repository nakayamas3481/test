import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
  password: z.string().min(6, { message: "パスワードは6文字以上です" }),
});

export const expenseSchema = z.object({
  title: z.string().min(3, { message: "タイトルは3文字以上で入力してください" }),
  amount: z
    .string()
    .refine((value) => !Number.isNaN(Number.parseFloat(value)), "金額は数値で入力してください")
    .transform((value) => Number.parseFloat(value))
    .refine((value) => value > 0, "金額は正の数で入力してください"),
  description: z.string().optional(),
});

export const approvalSchema = z.object({
  stepId: z.string().min(1),
  comment: z.string().max(500).optional(),
});

export const workflowSchema = z.object({
  applicantJobTitle: z.string().min(2, { message: "申請者の職位を入力してください" }),
  steps: z
    .string()
    .transform((value) => value.split("\n"))
    .pipe(z.array(z.string()))
    .refine((steps) => steps.some((step) => step.trim().length > 0), "承認者の職位を1つ以上入力してください"),
});
