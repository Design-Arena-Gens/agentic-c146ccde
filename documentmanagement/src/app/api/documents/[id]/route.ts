import { NextResponse } from "next/server";
import { requireSession, assertRole, getSessionUser } from "@/lib/session";
import {
  getDocument,
  updateDocument,
  updateDocumentSchema,
} from "@/server/documents";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  try {
    await requireSession();
    const { id } = await params;
    const document = await getDocument(id);

    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    assertRole(session, ["ADMIN", "QA_MANAGER", "QA", "DOCUMENT_CONTROLLER"]);
    const { id } = await params;
    const body = await request.json();
    const input = updateDocumentSchema.parse(body);
    const actor = getSessionUser(session);
    const result = await updateDocument(id, input, {
      id: actor.id,
      role: actor.role,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update document";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
