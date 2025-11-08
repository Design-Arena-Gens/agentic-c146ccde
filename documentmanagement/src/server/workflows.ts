import { z } from "zod";
import prisma from "@/lib/prisma";
import { DocumentCategory, Role, WorkflowStepType } from "@prisma/client";
import { createAuditEvent } from "@/lib/audit";

export const createWorkflowTemplateSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  category: z.nativeEnum(DocumentCategory).optional(),
  isDefault: z.boolean().optional(),
  steps: z
    .array(
      z.object({
        stepOrder: z.number().int().min(1),
        role: z.nativeEnum(Role),
        stepType: z.nativeEnum(WorkflowStepType),
        requireSignature: z.boolean().default(true),
        slaHours: z.number().int().min(1).max(720).optional(),
      })
    )
    .min(1),
});

export type CreateWorkflowTemplateInput = z.infer<
  typeof createWorkflowTemplateSchema
>;

export async function listWorkflowTemplates() {
  return prisma.workflowTemplate.findMany({
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function createWorkflowTemplate(
  input: CreateWorkflowTemplateInput,
  user: { id: string; role: string }
) {
  const data = createWorkflowTemplateSchema.parse(input);

  const template = await prisma.workflowTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      isDefault: data.isDefault ?? false,
      steps: {
        create: data.steps.map((step) => ({
          stepOrder: step.stepOrder,
          role: step.role,
          stepType: step.stepType,
          requireSignature: step.requireSignature,
          slaHours: step.slaHours,
        })),
      },
    },
    include: { steps: true },
  });

  if (data.isDefault) {
    await prisma.workflowTemplate.updateMany({
      where: {
        id: { not: template.id },
        category: data.category ?? null,
      },
      data: { isDefault: false },
    });
  }

  await createAuditEvent({
    actorId: user.id,
    action: "WORKFLOW_TEMPLATE_CREATED",
    entityType: "CONFIG",
    entityId: template.id,
    metadata: {
      steps: template.steps.length,
      category: template.category,
    },
  });

  return template;
}
