import { NextRequest, NextResponse } from "next/server";
import { addSession, getPracticeBundle } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const goalId = Number(request.nextUrl.searchParams.get("goalId") || 0) || undefined;
  return NextResponse.json(getPracticeBundle(goalId));
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    goalId?: number;
    minutes?: number;
    drill?: string;
    reflection?: string;
    nextDrill?: string;
    nextSessionDate?: string;
  };

  if (!payload.goalId) {
    return NextResponse.json({ error: "goalId is required" }, { status: 400 });
  }

  try {
    addSession(
      payload.goalId,
      Number(payload.minutes || 0),
      payload.drill ?? "",
      payload.reflection ?? "",
      payload.nextDrill ?? "",
      payload.nextSessionDate ?? ""
    );
    return NextResponse.json(getPracticeBundle(payload.goalId), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to add session" }, { status: 400 });
  }
}
