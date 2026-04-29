import { NextRequest, NextResponse } from "next/server";
import { addLink, getGardenBundle } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    sourceId?: number;
    targetId?: number;
    note?: string;
    topicId?: number;
  };

  try {
    addLink(payload.sourceId ?? 0, payload.targetId ?? 0, payload.note ?? "");
    return NextResponse.json(getGardenBundle(payload.topicId), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to link memories" }, { status: 400 });
  }
}
