import { prisma } from "../prisma";

export async function listWorkflows() {
  return prisma.workflow.findMany({
    orderBy: { applicantJobTitle: "asc" },
    include: { steps: { orderBy: { order: "asc" } } },
  });
}

export async function upsertWorkflow({
  applicantJobTitle,
  approverTitles,
}: {
  applicantJobTitle: string;
  approverTitles: string[];
}) {
  const cleanSteps = approverTitles
    .map((title) => title.trim())
    .filter((title) => title.length > 0);

  if (cleanSteps.length === 0) {
    throw new Error("At least one approver title is required");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.workflow.findUnique({ where: { applicantJobTitle } });
    if (existing) {
      await tx.workflowStep.deleteMany({ where: { workflowId: existing.id } });
      return tx.workflow.update({
        where: { id: existing.id },
        data: {
          steps: {
            create: cleanSteps.map((title, index) => ({
              order: index + 1,
              approverTitle: title,
            })),
          },
        },
        include: { steps: { orderBy: { order: "asc" } } },
      });
    }

    return tx.workflow.create({
      data: {
        applicantJobTitle,
        steps: {
          create: cleanSteps.map((title, index) => ({
            order: index + 1,
            approverTitle: title,
          })),
        },
      },
      include: { steps: { orderBy: { order: "asc" } } },
    });
  });
}
