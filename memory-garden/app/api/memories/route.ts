import { NextRequest, NextResponse } from "next/server";
import { addMemory, getGardenBundle, markSeen } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const topicId = Number(request.nextUrl.searchParams.get("topicId") || 0) || undefined;
  return NextResponse.json(getGardenBundle(topicId));
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    title?: string;
    body?: string;
    topicId?: number;
    growth?: number;
    seenMemoryId?: number;
  };

  try {
    if (payload.seenMemoryId) {
      markSeen(payload.seenMemoryId);
      return NextResponse.json(getGardenBundle(payload.topicId), { status: 201 });
    }

    if (!payload.topicId) {
      return NextResponse.json({ error: "topicId is required" }, { status: 400 });
    }

    addMemory(payload.title ?? "", payload.body ?? "", payload.topicId, payload.growth ?? 1);
    return NextResponse.json(getGardenBundle(payload.topicId), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save memory" }, { status: 400 });
  }
}
