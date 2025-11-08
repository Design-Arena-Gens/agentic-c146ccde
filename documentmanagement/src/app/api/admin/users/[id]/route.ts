import { NextResponse } from "next/server";
import { requireSession, assertRole, getSessionUser } from "@/lib/session";
import {
  updateUserStatus,
  updateUserStatusSchema,
} from "@/server/users";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    assertRole(session, ["ADMIN", "QA_MANAGER"]);
    const { id } = await params;
    const body = await request.json();
    const input = updateUserStatusSchema.parse(body);
    const actor = getSessionUser(session);
    const user = await updateUserStatus(id, input, actor.id);
    return NextResponse.json(user);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
