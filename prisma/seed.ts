import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.session.deleteMany();
  await prisma.expenseApprovalStep.deleteMany();
  await prisma.expenseReport.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.user.deleteMany();

  const users = [
    {
      name: "Erin Engineer",
      email: "engineer@example.com",
      jobTitle: "Engineer",
      role: "EMPLOYEE",
      password: "engineerpass",
    },
    {
      name: "Liam Lead",
      email: "lead@example.com",
      jobTitle: "Team Lead",
      role: "APPROVER",
      password: "leadpass",
    },
    {
      name: "Fiona Finance",
      email: "finance@example.com",
      jobTitle: "Finance",
      role: "APPROVER",
      password: "financepass",
    },
    {
      name: "Derek Director",
      email: "director@example.com",
      jobTitle: "Director",
      role: "APPROVER",
      password: "directorpass",
    },
    {
      name: "Avery Admin",
      email: "admin@example.com",
      jobTitle: "Finance Director",
      role: "ADMIN",
      password: "adminpass",
    },
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        jobTitle: user.jobTitle,
        role: user.role,
        passwordHash,
      },
    });
  }

  await prisma.workflow.create({
    data: {
      applicantJobTitle: "Engineer",
      steps: {
        create: [
          { order: 1, approverTitle: "Team Lead" },
          { order: 2, approverTitle: "Finance" },
        ],
      },
    },
  });

  await prisma.workflow.create({
    data: {
      applicantJobTitle: "Director",
      steps: {
        create: [{ order: 1, approverTitle: "Finance" }],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
