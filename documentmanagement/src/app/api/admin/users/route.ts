import { NextResponse } from "next/server";
import { requireSession, assertRole, getSessionUser } from "@/lib/session";
import {
  createUser,
  createUserSchema,
  listUsers,
} from "@/server/users";

export async function GET() {
  try {
    const session = await requireSession();
    assertRole(session, ["ADMIN", "QA_MANAGER"]);
    const users = await listUsers();
    return NextResponse.json(users);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch users";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    assertRole(session, ["ADMIN", "QA_MANAGER"]);
    const body = await request.json();
    const input = createUserSchema.parse(body);
    const actor = getSessionUser(session);
    const user = await createUser(input, actor.id);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
