import { NextResponse } from "next/server";
import { requireSession, getSessionUser } from "@/lib/session";
import {
  applyElectronicSignature,
  signatureSchema,
} from "@/server/documents";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const input = signatureSchema.parse({
      ...body,
      documentVersionId: id,
    });

    const actor = getSessionUser(session);
    const result = await applyElectronicSignature(input, {
      id: actor.id,
      email: actor.email,
      role: actor.role,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to apply signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
