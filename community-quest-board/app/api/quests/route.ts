import { NextRequest, NextResponse } from "next/server";
import { getQuestBundle } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const questId = Number(request.nextUrl.searchParams.get("questId") || 0) || undefined;
  return NextResponse.json(getQuestBundle(questId));
}
