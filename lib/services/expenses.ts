import fs from "fs/promises";

import { prisma } from "../prisma";
import { saveReceiptFile } from "../uploads";

const APPROVED_STATUS = "APPROVED";
const REJECTED_STATUS = "REJECTED";
const IN_REVIEW_STATUS = "IN_REVIEW";
const PENDING_STATUS = "PENDING";
const WAITING_STATUS = "WAITING";

export async function submitExpense({
  submitterId,
  title,
  amount,
  description,
  receipt,
}: {
  submitterId: string;
  title: string;
  amount: number;
  description?: string | null;
  receipt: File | null;
}) {
  const submitter = await prisma.user.findUnique({ where: { id: submitterId } });
  if (!submitter) {
    throw new Error("Submitter not found");
  }

  const workflow = await prisma.workflow.findUnique({
    where: { applicantJobTitle: submitter.jobTitle },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  if (!workflow || workflow.steps.length === 0) {
    throw new Error("No approval workflow configured for job title");
  }

  const receiptPath = await saveReceiptFile(receipt);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const expense = await tx.expenseReport.create({
        data: {
          title,
          amount,
          description: description?.trim() ? description.trim() : null,
          receiptPath,
          status: IN_REVIEW_STATUS,
          submitterId,
        },
      });

      for (const step of workflow.steps) {
        const approver = await resolveApprover(tx, step.approverTitle);

        await tx.expenseApprovalStep.create({
          data: {
            order: step.order,
            approverTitle: step.approverTitle,
            expenseId: expense.id,
            assignedUserId: approver?.id ?? null,
            status: step.order === 1 ? PENDING_STATUS : WAITING_STATUS,
          },
        });
      }

      return expense;
    });

    return created;
  } catch (error) {
    if (receiptPath) {
      await fs.rm(receiptPath, { force: true }).catch(() => undefined);
    }
    throw error;
  }
}

export async function approveStep({
  approverId,
  stepId,
  comment,
}: {
  approverId: string;
  stepId: string;
  comment?: string;
}) {
  await prisma.$transaction(async (tx) => {
    const step = await tx.expenseApprovalStep.findUnique({
      where: { id: stepId },
      include: { expense: true },
    });

    if (!step) {
      throw new Error("Approval step not found");
    }

    if (step.status !== PENDING_STATUS) {
      throw new Error("Step already completed");
    }

    if (step.assignedUserId && step.assignedUserId !== approverId) {
      throw new Error("Not authorised for this approval");
    }

    await tx.expenseApprovalStep.update({
      where: { id: stepId },
      data: {
        status: APPROVED_STATUS,
        decisionAt: new Date(),
        comment: comment?.trim() ? comment.trim() : null,
        assignedUserId: approverId,
      },
    });

    const nextStep = await tx.expenseApprovalStep.findFirst({
      where: {
        expenseId: step.expenseId,
        status: WAITING_STATUS,
        order: { gt: step.order },
      },
      orderBy: { order: "asc" },
    });

    if (nextStep) {
      await activateStep(tx, nextStep.id);
      await tx.expenseReport.update({
        where: { id: step.expenseId },
        data: { status: IN_REVIEW_STATUS },
      });
      return;
    }

    await tx.expenseReport.update({
      where: { id: step.expenseId },
      data: { status: APPROVED_STATUS },
    });
  });
}

export async function rejectStep({
  approverId,
  stepId,
  comment,
}: {
  approverId: string;
  stepId: string;
  comment?: string;
}) {
  await prisma.$transaction(async (tx) => {
    const step = await tx.expenseApprovalStep.findUnique({
      where: { id: stepId },
      include: { expense: true },
    });

    if (!step) {
      throw new Error("Approval step not found");
    }

    if (step.status !== PENDING_STATUS) {
      throw new Error("Step already completed");
    }

    if (step.assignedUserId && step.assignedUserId !== approverId) {
      throw new Error("Not authorised for this approval");
    }

    await tx.expenseApprovalStep.update({
      where: { id: stepId },
      data: {
        status: REJECTED_STATUS,
        decisionAt: new Date(),
        comment: comment?.trim() ? comment.trim() : null,
        assignedUserId: approverId,
      },
    });

    await tx.expenseApprovalStep.updateMany({
      where: {
        expenseId: step.expenseId,
        status: { in: [PENDING_STATUS, WAITING_STATUS] },
        order: { gt: step.order },
      },
      data: {
        status: "SKIPPED",
      },
    });

    await tx.expenseReport.update({
      where: { id: step.expenseId },
      data: { status: REJECTED_STATUS },
    });
  });
}

async function resolveApprover(tx: typeof prisma, jobTitle: string) {
  return tx.user.findFirst({
    where: {
      jobTitle,
      isActive: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

async function activateStep(tx: typeof prisma, stepId: string) {
  const step = await tx.expenseApprovalStep.update({
    where: { id: stepId },
    data: { status: PENDING_STATUS },
  });

  if (!step.assignedUserId) {
    const approver = await resolveApprover(tx, step.approverTitle);
    if (approver) {
      return tx.expenseApprovalStep.update({
        where: { id: stepId },
        data: { assignedUserId: approver.id },
      });
    }
  }

  return step;
}
