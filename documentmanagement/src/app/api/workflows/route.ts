import { NextResponse } from "next/server";
import { requireSession, assertRole, getSessionUser } from "@/lib/session";
import {
  createWorkflowTemplate,
  createWorkflowTemplateSchema,
  listWorkflowTemplates,
} from "@/server/workflows";

export async function GET() {
  try {
    await requireSession();
    const templates = await listWorkflowTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch workflows";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    assertRole(session, ["ADMIN", "QA_MANAGER", "DOCUMENT_CONTROLLER"]);
    const body = await request.json();
    const input = createWorkflowTemplateSchema.parse(body);
    const actor = getSessionUser(session);
    const template = await createWorkflowTemplate(input, {
      id: actor.id,
      role: actor.role,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create workflow";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
