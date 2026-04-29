import { NextRequest, NextResponse } from "next/server";
import { addNote, getContactBundle } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const contactId = Number(request.nextUrl.searchParams.get("contactId") || 0) || undefined;
  return NextResponse.json(getContactBundle(contactId));
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    contactId?: number;
    body?: string;
    nextAction?: string;
    nextActionDate?: string;
  };

  if (!payload.contactId) {
    return NextResponse.json({ error: "contactId is required" }, { status: 400 });
  }

  try {
    addNote(payload.contactId, payload.body ?? "", payload.nextAction ?? "", payload.nextActionDate ?? "");
    return NextResponse.json(getContactBundle(payload.contactId), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to add note" }, { status: 400 });
  }
}
