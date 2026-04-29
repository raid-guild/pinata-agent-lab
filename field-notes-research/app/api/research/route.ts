import { NextRequest, NextResponse } from "next/server";
import { addFieldNote, getResearchBundle } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    getResearchBundle({
      source: request.nextUrl.searchParams.get("source") || undefined,
      tag: request.nextUrl.searchParams.get("tag") || undefined
    })
  );
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    title?: string;
    source?: string;
    sourceType?: string;
    body?: string;
    quote?: string;
    tags?: string;
    theme?: string;
    followUp?: string;
  };

  try {
    addFieldNote(payload);
    return NextResponse.json(getResearchBundle(), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save note" }, { status: 400 });
  }
}
