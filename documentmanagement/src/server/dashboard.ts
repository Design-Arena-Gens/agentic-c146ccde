import prisma from "@/lib/prisma";
import { WorkflowStepStatus, DocumentStatus, Role } from "@prisma/client";

export async function getDashboardMetrics(userId: string, role: string) {
  const roleConditions =
    role === "ADMIN"
      ? undefined
      : [
          { assigneeId: userId },
          { role: role as Role },
        ];

  const [documents, pendingSteps, auditCount, upcomingRevisions] =
    await Promise.all([
      prisma.document.count(),
      prisma.documentWorkflowStep.count({
        where: {
          status: {
            in: [
              WorkflowStepStatus.PENDING,
              WorkflowStepStatus.IN_PROGRESS,
            ],
          },
          ...(roleConditions ? { OR: roleConditions } : {}),
        },
      }),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          },
        },
      }),
      prisma.documentVersion.count({
        where: {
          nextIssueDate: {
            lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          },
          status: {
            in: [DocumentStatus.APPROVED, DocumentStatus.EFFECTIVE],
          },
        },
      }),
    ]);

  const lifecycle = await prisma.document.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const workflows = await prisma.documentWorkflowRun.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return {
    documents,
    pendingSteps,
    auditCount,
    upcomingRevisions,
    lifecycle,
    workflows,
  };
}
