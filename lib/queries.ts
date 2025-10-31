import { unstable_noStore as noStore } from "next/cache";

import { prisma } from "./prisma";

export async function getEmployeeExpenses(userId: string) {
  noStore();
  return prisma.expenseReport.findMany({
    where: { submitterId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      approvals: {
        orderBy: { order: "asc" },
        include: { assignedUser: true },
      },
    },
  });
}

export async function getApprovalQueue(userId: string) {
  noStore();
  return prisma.expenseApprovalStep.findMany({
    where: {
      assignedUserId: userId,
      status: "PENDING",
    },
    orderBy: [{ createdAt: "asc" }],
    include: {
      expense: {
        include: {
          submitter: true,
        },
      },
    },
  });
}

export async function getWorkflows() {
  noStore();
  return prisma.workflow.findMany({
    orderBy: { applicantJobTitle: "asc" },
    include: { steps: { orderBy: { order: "asc" } } },
  });
}

export async function getJobTitles() {
  noStore();
  const jobs = await prisma.user.findMany({
    where: { isActive: true },
    select: { jobTitle: true },
    distinct: ["jobTitle"],
    orderBy: { jobTitle: "asc" },
  });

  return jobs.map((job) => job.jobTitle);
}

export async function getApprovalHistory(userId: string) {
  noStore();
  return prisma.expenseApprovalStep.findMany({
    where: {
      assignedUserId: userId,
      status: {
        in: ["APPROVED", "REJECTED", "SKIPPED"],
      },
    },
    orderBy: [
      { decisionAt: "desc" },
      { updatedAt: "desc" },
    ],
    take: 50,
    include: {
      expense: {
        include: {
          submitter: true,
        },
      },
    },
  });
}
