import { z } from "zod";
import prisma from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";

export const createDocumentTypeSchema = z.object({
  type: z.string().min(3),
  description: z.string().min(5),
});

export type CreateDocumentTypeInput = z.infer<
  typeof createDocumentTypeSchema
>;

export async function listDocumentTypes() {
  return prisma.documentType.findMany({
    orderBy: { type: "asc" },
  });
}

export async function createDocumentType(
  input: CreateDocumentTypeInput,
  user: { id: string }
) {
  const data = createDocumentTypeSchema.parse(input);
  const docType = await prisma.documentType.create({
    data,
  });

  await createAuditEvent({
    actorId: user.id,
    action: "DOCUMENT_TYPE_CREATED",
    entityType: "CONFIG",
    entityId: docType.id.toString(),
    metadata: data,
  });

  return docType;
}
