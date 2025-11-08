import { NextResponse } from "next/server";
import { requireSession, assertRole } from "@/lib/session";
import { getAuditEvents } from "@/lib/audit";

export async function GET() {
  try {
    const session = await requireSession();
    assertRole(session, ["ADMIN", "QA_MANAGER", "QA", "DOCUMENT_CONTROLLER"]);
    const events = await getAuditEvents();
    return NextResponse.json(events);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load audit log";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
