import { NextRequest, NextResponse } from "next/server";
import { addPlan, getPracticeBundle } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { goalId?: number; body?: string };

  if (!payload.goalId) {
    return NextResponse.json({ error: "goalId is required" }, { status: 400 });
  }

  try {
    addPlan(payload.goalId, payload.body ?? "");
    return NextResponse.json(getPracticeBundle(payload.goalId), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save plan" }, { status: 400 });
  }
}
