import { NextResponse } from "next/server";
import { requireSession, assertRole, getSessionUser } from "@/lib/session";
import {
  createDocument,
  listDocuments,
  createDocumentSchema,
} from "@/server/documents";

export async function GET() {
  try {
    await requireSession();
    const documents = await listDocuments();
    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    assertRole(session, [
      "ADMIN",
      "QA_MANAGER",
      "QA",
      "DOCUMENT_CONTROLLER",
      "AUTHOR",
    ]);

    const body = await request.json();
    const input = createDocumentSchema.parse(body);
    const actor = getSessionUser(session);
    const result = await createDocument(input, {
      id: actor.id,
      role: actor.role,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create document";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
