import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createAuditEvent } from "@/lib/audit";
import { Role } from "@prisma/client";

export const createUserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(12),
  role: z.nativeEnum(Role),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserStatusSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.nativeEnum(Role).optional(),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

export async function createUser(
  input: CreateUserInput,
  actorId: string
) {
  const data = createUserSchema.parse(input);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      role: data.role,
    },
  });

  await createAuditEvent({
    actorId,
    action: "USER_CREATED",
    entityType: "USER",
    entityId: user.id,
    metadata: {
      role: user.role,
      email: user.email,
    },
  });

  return user;
}

export async function updateUserStatus(
  userId: string,
  input: UpdateUserStatusInput,
  actorId: string
) {
  const data = updateUserStatusSchema.parse(input);

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  await createAuditEvent({
    actorId,
    action: "USER_UPDATED",
    entityType: "USER",
    entityId: user.id,
    metadata: data,
  });

  return user;
}
