import { NextRequest, NextResponse } from "next/server";
import { addDraft, getContactBundle } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { contactId?: number; body?: string };

  if (!payload.contactId) {
    return NextResponse.json({ error: "contactId is required" }, { status: 400 });
  }

  try {
    addDraft(payload.contactId, payload.body ?? "");
    return NextResponse.json(getContactBundle(payload.contactId), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save draft" }, { status: 400 });
  }
}
