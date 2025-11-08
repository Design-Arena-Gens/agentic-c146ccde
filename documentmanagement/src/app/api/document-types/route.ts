import { NextResponse } from "next/server";
import { requireSession, assertRole, getSessionUser } from "@/lib/session";
import {
  createDocumentType,
  createDocumentTypeSchema,
  listDocumentTypes,
} from "@/server/document-types";

export async function GET() {
  try {
    await requireSession();
    const types = await listDocumentTypes();
    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    assertRole(session, ["ADMIN", "QA_MANAGER", "DOCUMENT_CONTROLLER"]);
    const body = await request.json();
    const input = createDocumentTypeSchema.parse(body);
    const actor = getSessionUser(session);
    const type = await createDocumentType(input, { id: actor.id });
    return NextResponse.json(type, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create" },
      { status: 400 }
    );
  }
}
