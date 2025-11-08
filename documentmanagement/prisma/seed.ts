import {
  PrismaClient,
  Role,
  DocumentCategory,
  WorkflowStepType,
} from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@documentmanagement.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Quality Administrator",
        email: adminEmail,
        role: Role.ADMIN,
        passwordHash: await hashPassword("Admin!234567"),
      },
    });
  }

  const defaultTypes = [
    {
      type: "Manual",
      description: "High-level governance or quality manuals.",
    },
    {
      type: "Procedure",
      description: "Detailed SOPs governing GMP activities.",
    },
    {
      type: "Work Instruction",
      description: "Task-level instructions with step definitions.",
    },
    {
      type: "Policy",
      description: "Company-wide policy statements.",
    },
    {
      type: "Template",
      description: "Controlled template files to ensure consistency.",
    },
    {
      type: "Checklist",
      description: "Operational checklists for batch execution.",
    },
  ];

  for (const type of defaultTypes) {
    await prisma.documentType.upsert({
      where: { type: type.type },
      update: { description: type.description },
      create: type,
    });
  }

  let workflow = await prisma.workflowTemplate.findFirst({
    where: { name: "Standard SOP approval" },
    include: { steps: true },
  });

  if (!workflow) {
    workflow = await prisma.workflowTemplate.create({
      data: {
        name: "Standard SOP approval",
        description:
          "Ensures author drafting, QA review, and QA manager approval with electronic signatures.",
        category: DocumentCategory.QUALITY,
        isDefault: true,
        steps: {
          create: [
            {
              stepOrder: 1,
              role: Role.AUTHOR,
              stepType: WorkflowStepType.REVIEW,
              requireSignature: true,
              slaHours: 24,
            },
            {
              stepOrder: 2,
              role: Role.QA,
              stepType: WorkflowStepType.REVIEW,
              requireSignature: true,
              slaHours: 48,
            },
            {
              stepOrder: 3,
              role: Role.QA_MANAGER,
              stepType: WorkflowStepType.APPROVAL,
              requireSignature: true,
              slaHours: 24,
            },
          ],
        },
      },
      include: { steps: true },
    });
  }

  if (workflow.isDefault) {
    await prisma.workflowTemplate.updateMany({
      where: {
        id: { not: workflow.id },
        category: DocumentCategory.QUALITY,
      },
      data: { isDefault: false },
    });
  }

  console.log("Seed completed. Admin credentials:");
  console.log(`Email: ${adminEmail}`);
  console.log("Password: Admin!234567");
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
