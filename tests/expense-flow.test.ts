import { describe, expect, beforeEach, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { submitExpense, approveStep, rejectStep } from "@/lib/services/expenses";
import { upsertWorkflow } from "@/lib/services/workflows";

async function resetTables() {
  await prisma.session.deleteMany();
  await prisma.expenseApprovalStep.deleteMany();
  await prisma.expenseReport.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.user.deleteMany();
}

async function createUsers() {
  const employee = await prisma.user.create({
    data: {
      name: "Test Employee",
      email: "employee@example.com",
      jobTitle: "Engineer",
      passwordHash: "hash",
      role: "EMPLOYEE",
    },
  });

  const lead = await prisma.user.create({
    data: {
      name: "Lead",
      email: "lead@example.com",
      jobTitle: "Team Lead",
      passwordHash: "hash",
      role: "APPROVER",
    },
  });

  const finance = await prisma.user.create({
    data: {
      name: "Finance",
      email: "finance@example.com",
      jobTitle: "Finance",
      passwordHash: "hash",
      role: "APPROVER",
    },
  });

  return { employee, lead, finance };
}

describe("Expense workflow", () => {
  beforeEach(async () => {
    await resetTables();
    await upsertWorkflow({
      applicantJobTitle: "Engineer",
      approverTitles: ["Team Lead", "Finance"],
    });
    await createUsers();
  });

  it("creates pending approval steps when submitting an expense", async () => {
    const employee = await prisma.user.findFirstOrThrow({ where: { role: "EMPLOYEE" } });

    const expense = await submitExpense({
      submitterId: employee.id,
      title: "Conference travel",
      amount: 1200,
      description: "Flight",
      receipt: null,
    });

    expect(expense.status).toBe("IN_REVIEW");

    const steps = await prisma.expenseApprovalStep.findMany({
      where: { expenseId: expense.id },
      orderBy: { order: "asc" },
    });

    expect(steps).toHaveLength(2);
    expect(steps[0].status).toBe("PENDING");
    expect(steps[0].assignedUserId).toBeDefined();
    expect(steps[1].status).toBe("WAITING");
  });

  it("advances to the next step after approval", async () => {
    const employee = await prisma.user.findFirstOrThrow({ where: { role: "EMPLOYEE" } });
    const approver = await prisma.user.findFirstOrThrow({ where: { jobTitle: "Team Lead" } });

    const expense = await submitExpense({
      submitterId: employee.id,
      title: "Hotel",
      amount: 18000,
      description: "", 
      receipt: null,
    });

    const firstStep = await prisma.expenseApprovalStep.findFirstOrThrow({
      where: { expenseId: expense.id, order: 1 },
    });

    await approveStep({ approverId: approver.id, stepId: firstStep.id, comment: "Looks good" });

    const steps = await prisma.expenseApprovalStep.findMany({
      where: { expenseId: expense.id },
      orderBy: { order: "asc" },
    });

    expect(steps[0].status).toBe("APPROVED");
    expect(steps[1].status).toBe("PENDING");
  });

  it("marks remaining steps as skipped on rejection", async () => {
    const employee = await prisma.user.findFirstOrThrow({ where: { role: "EMPLOYEE" } });
    const approver = await prisma.user.findFirstOrThrow({ where: { jobTitle: "Team Lead" } });

    const expense = await submitExpense({
      submitterId: employee.id,
      title: "Team dinner",
      amount: 8000,
      description: "",
      receipt: null,
    });

    const firstStep = await prisma.expenseApprovalStep.findFirstOrThrow({
      where: { expenseId: expense.id, order: 1 },
    });

    await rejectStep({ approverId: approver.id, stepId: firstStep.id, comment: "Over budget" });

    const updatedExpense = await prisma.expenseReport.findUniqueOrThrow({ where: { id: expense.id } });
    const steps = await prisma.expenseApprovalStep.findMany({ where: { expenseId: expense.id } });

    expect(updatedExpense.status).toBe("REJECTED");
    expect(steps[0].status).toBe("REJECTED");
    expect(steps[1].status).toBe("SKIPPED");
  });
});
