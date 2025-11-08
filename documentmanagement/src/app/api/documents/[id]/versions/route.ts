import { NextResponse } from "next/server";
import { requireSession, assertRole, getSessionUser } from "@/lib/session";
import {
  createDocumentVersion,
  createVersionSchema,
} from "@/server/documents";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    assertRole(session, ["ADMIN", "QA_MANAGER", "DOCUMENT_CONTROLLER", "AUTHOR"]);

    const { id } = await params;
    const body = await request.json();
    const input = createVersionSchema.parse({
      ...body,
      documentId: id,
    });

    const actor = getSessionUser(session);
    const result = await createDocumentVersion(input, {
      id: actor.id,
      role: actor.role,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create version";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
