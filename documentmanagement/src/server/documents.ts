import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  DocumentCategory,
  DocumentSecurity,
  DocumentStatus,
  LifecycleState,
  Role,
  WorkflowStatus,
  WorkflowStepStatus,
  SignaturePurpose,
} from "@prisma/client";
import { createAuditEvent } from "@/lib/audit";
import { verifyPassword, hashPassword } from "@/lib/password";

const isoDate = z
  .string()
  .datetime()
  .transform((value) => new Date(value));

export const createDocumentSchema = z.object({
  title: z.string().min(3),
  documentNumber: z.string().min(3),
  documentCategory: z.nativeEnum(DocumentCategory),
  documentSecurity: z.nativeEnum(DocumentSecurity),
  typeId: z.number().int().positive(),
  versionLabel: z.string().min(1),
  issueDate: isoDate.nullable().optional(),
  issuedById: z.string().optional(),
  issuerRole: z.nativeEnum(Role),
  effectiveFrom: isoDate.nullable().optional(),
  nextIssueDate: isoDate.nullable().optional(),
  summary: z.string().optional(),
  changeNote: z.string().optional(),
  workflowTemplateId: z.string().optional(),
  content: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export const createVersionSchema = z.object({
  documentId: z.string().cuid(),
  versionLabel: z.string().min(1),
  issueDate: isoDate.nullable().optional(),
  issuedById: z.string().optional(),
  issuerRole: z.nativeEnum(Role),
  effectiveFrom: isoDate.nullable().optional(),
  nextIssueDate: isoDate.nullable().optional(),
  summary: z.string().optional(),
  changeNote: z.string().optional(),
  content: z.string().optional(),
});

export type CreateVersionInput = z.infer<typeof createVersionSchema>;

export const signatureSchema = z.object({
  documentVersionId: z.string().cuid(),
  workflowStepId: z.string().cuid().optional(),
  password: z.string().min(8),
  purpose: z.nativeEnum(SignaturePurpose),
  comments: z.string().optional(),
});

export type SignatureInput = z.infer<typeof signatureSchema>;

export const updateDocumentSchema = z.object({
  documentCategory: z.nativeEnum(DocumentCategory).optional(),
  documentSecurity: z.nativeEnum(DocumentSecurity).optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  lifecycleState: z.nativeEnum(LifecycleState).optional(),
  effectiveFrom: isoDate.nullable().optional(),
  nextIssueDate: isoDate.nullable().optional(),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

export async function listDocuments() {
  return prisma.document.findMany({
    include: {
      currentVersion: true,
      type: true,
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function applyElectronicSignature(
  input: SignatureInput,
  user: { id: string; email?: string | null; role: string }
) {
  const data = signatureSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const account = await tx.user.findUnique({
      where: { id: user.id },
    });

    if (!account) {
      throw new Error("User not found");
    }

    const valid = await verifyPassword(data.password, account.passwordHash);

    if (!valid) {
      await createAuditEvent({
        actorId: user.id,
        action: "SIGNATURE_REJECTED",
        entityType: "DOCUMENT_VERSION",
        entityId: data.documentVersionId,
        metadata: { reason: "invalid_credentials" },
      });
      throw new Error("Electronic signature rejected. Invalid password.");
    }

    const version = await tx.documentVersion.findUnique({
      where: { id: data.documentVersionId },
      include: { document: true },
    });

    if (!version) {
      throw new Error("Document version not found");
    }

    const signature = await tx.electronicSignature.create({
      data: {
        documentVersionId: version.id,
        userId: user.id,
        purpose: data.purpose,
        signatureHash: await hashPassword(
          `${user.id}:${version.id}:${Date.now()}`
        ),
        metadata: {
          comments: data.comments,
          role: user.role,
        },
        workflowStepId: data.workflowStepId ?? null,
      },
      include: { user: true },
    });

    if (data.workflowStepId) {
      const step = await tx.documentWorkflowStep.findUnique({
        where: { id: data.workflowStepId },
        include: {
          run: {
            include: {
              steps: true,
            },
          },
        },
      });

      if (!step) {
        throw new Error("Workflow step not found");
      }

      if (
        step.assigneeId &&
        step.assigneeId !== user.id &&
        step.role !== user.role
      ) {
        throw new Error("You are not authorized to sign this workflow step.");
      }

      await tx.documentWorkflowStep.update({
        where: { id: step.id },
        data: {
          status: WorkflowStepStatus.COMPLETED,
          completedAt: new Date(),
          documentVersionId: version.id,
          comments: data.comments,
        },
      });

      const pendingSteps = await tx.documentWorkflowStep.count({
        where: {
          runId: step.runId,
          status: WorkflowStepStatus.PENDING,
        },
      });

      if (pendingSteps === 0) {
        await tx.documentWorkflowRun.update({
          where: { id: step.runId },
          data: {
            status: WorkflowStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        await tx.document.update({
          where: { id: version.documentId },
          data: {
            status:
              data.purpose === SignaturePurpose.APPROVAL
                ? DocumentStatus.APPROVED
                : DocumentStatus.EFFECTIVE,
            lifecycleState: LifecycleState.EFFECTIVE,
          },
        });
      } else {
        const nextStep = await tx.documentWorkflowStep.findFirst({
          where: { runId: step.runId, status: WorkflowStepStatus.PENDING },
          orderBy: { order: "asc" },
        });

        await tx.documentWorkflowRun.update({
          where: { id: step.runId },
          data: {
            status: WorkflowStatus.IN_PROGRESS,
            currentStep: nextStep ? nextStep.order : step.order + 1,
          },
        });

        if (nextStep) {
          await tx.documentWorkflowStep.update({
            where: { id: nextStep.id },
            data: { status: WorkflowStepStatus.IN_PROGRESS },
          });
        }
      }
    }

    await createAuditEvent({
      actorId: user.id,
      action: "SIGNATURE_CAPTURED",
      entityType: "DOCUMENT_VERSION",
      entityId: version.id,
      documentId: version.documentId,
      documentVersionId: version.id,
      metadata: {
        purpose: data.purpose,
        comments: data.comments,
      },
    });

    return signature;
  });
}

export async function getDocument(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
    include: {
      currentVersion: true,
      type: true,
      createdBy: true,
      versions: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: true,
          issuedBy: true,
          signatures: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
          workflowSteps: {
            include: {
              assignee: { select: { id: true, name: true, email: true, role: true } },
              signatures: true,
            },
            orderBy: { order: "asc" },
          },
        },
      },
      workflows: {
        include: {
          steps: {
            include: {
              assignee: true,
              signatures: {
                include: { user: true },
              },
            },
            orderBy: { order: "asc" },
          },
          template: true,
        },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          actor: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      securityGrants: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });
}

export async function createDocument(
  input: CreateDocumentInput,
  user: { id: string; role: string }
) {
  const data = createDocumentSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        title: data.title,
        documentNumber: data.documentNumber,
        documentCategory: data.documentCategory,
        documentSecurity: data.documentSecurity,
        createdById: user.id,
        typeId: data.typeId,
        status: DocumentStatus.DRAFT,
        lifecycleState: LifecycleState.DRAFT,
      },
    });

    const version = await tx.documentVersion.create({
      data: {
        documentId: document.id,
        versionLabel: data.versionLabel,
        issueDate: data.issueDate ?? null,
        effectiveFrom: data.effectiveFrom ?? null,
        nextIssueDate: data.nextIssueDate ?? null,
        issuerRole: data.issuerRole,
        status: DocumentStatus.DRAFT,
        summary: data.summary,
        changeNote: data.changeNote,
        content: data.content,
        createdById: user.id,
        issuedById: data.issuedById ?? user.id,
      },
    });

    await tx.document.update({
      where: { id: document.id },
      data: {
        currentVersionId: version.id,
        effectiveFrom: data.effectiveFrom ?? null,
        nextIssueDate: data.nextIssueDate ?? null,
      },
    });

    let workflowRunId: string | null = null;

    if (data.workflowTemplateId) {
      const template = await tx.workflowTemplate.findUnique({
        where: { id: data.workflowTemplateId },
        include: { steps: { orderBy: { stepOrder: "asc" } } },
      });

      if (!template) {
        throw new Error("Workflow template not found");
      }

      const run = await tx.documentWorkflowRun.create({
        data: {
          documentId: document.id,
          templateId: template.id,
          status: WorkflowStatus.PENDING,
        },
      });

      workflowRunId = run.id;

      await Promise.all(
        template.steps.map((step) =>
          tx.documentWorkflowStep.create({
            data: {
              runId: run.id,
              templateStepId: step.id,
              order: step.stepOrder,
              role: step.role,
              stepType: step.stepType,
              status: WorkflowStepStatus.PENDING,
            },
          })
        )
      );
    }

    await createAuditEvent({
      actorId: user.id,
      action: "DOCUMENT_CREATED",
      entityType: "DOCUMENT",
      entityId: document.id,
      documentId: document.id,
      documentVersionId: version.id,
      workflowRunId: workflowRunId,
      metadata: {
        number: document.documentNumber,
        version: version.versionLabel,
        category: document.documentCategory,
        security: document.documentSecurity,
      },
    });

    return { documentId: document.id };
  });
}

export async function createDocumentVersion(
  input: CreateVersionInput,
  user: { id: string; role: string }
) {
  const data = createVersionSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const doc = await tx.document.findUnique({ where: { id: data.documentId } });

    if (!doc) {
      throw new Error("Document not found");
    }

    const version = await tx.documentVersion.create({
      data: {
        documentId: doc.id,
        versionLabel: data.versionLabel,
        issueDate: data.issueDate ?? null,
        effectiveFrom: data.effectiveFrom ?? null,
        nextIssueDate: data.nextIssueDate ?? null,
        issuerRole: data.issuerRole,
        summary: data.summary,
        changeNote: data.changeNote,
        content: data.content,
        status: DocumentStatus.DRAFT,
        createdById: user.id,
        issuedById: data.issuedById ?? user.id,
      },
    });

    await tx.documentVersion.updateMany({
      where: {
        documentId: doc.id,
        id: { not: version.id },
      },
      data: { isSuperseded: true },
    });

    await tx.document.update({
      where: { id: doc.id },
      data: {
        currentVersionId: version.id,
        status: DocumentStatus.DRAFT,
        lifecycleState: LifecycleState.UNDER_REVISION,
        effectiveFrom: data.effectiveFrom ?? null,
        nextIssueDate: data.nextIssueDate ?? null,
      },
    });

    await createAuditEvent({
      actorId: user.id,
      action: "DOCUMENT_VERSION_CREATED",
      entityType: "DOCUMENT_VERSION",
      entityId: version.id,
      documentId: doc.id,
      documentVersionId: version.id,
      metadata: {
        versionLabel: version.versionLabel,
        issuerRole: version.issuerRole,
      },
    });

    return version;
  });
}

export async function updateDocument(
  documentId: string,
  input: UpdateDocumentInput,
  user: { id: string; role: string }
) {
  const data = updateDocumentSchema.parse(input);

  const metadataPayload = {
    ...data,
    effectiveFrom: data.effectiveFrom
      ? data.effectiveFrom.toISOString()
      : null,
    nextIssueDate: data.nextIssueDate
      ? data.nextIssueDate.toISOString()
      : null,
  };

  const document = await prisma.document.update({
    where: { id: documentId },
    data: {
      documentCategory: data.documentCategory,
      documentSecurity: data.documentSecurity,
      status: data.status,
      lifecycleState: data.lifecycleState,
      effectiveFrom: data.effectiveFrom ?? undefined,
      nextIssueDate: data.nextIssueDate ?? undefined,
    },
  });

  await createAuditEvent({
    actorId: user.id,
    action: "DOCUMENT_UPDATED",
    entityType: "DOCUMENT",
    entityId: document.id,
    documentId: document.id,
    metadata: metadataPayload,
  });

  return document;
}
