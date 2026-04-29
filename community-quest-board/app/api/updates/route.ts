import { NextRequest, NextResponse } from "next/server";
import { getQuestBundle, updateQuest } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    questId?: number;
    author?: string;
    body?: string;
    status?: string;
    owner?: string;
    outcome?: string;
  };

  if (!payload.questId) {
    return NextResponse.json({ error: "questId is required" }, { status: 400 });
  }

  try {
    updateQuest({
      questId: payload.questId,
      author: payload.author ?? "",
      body: payload.body ?? "",
      status: payload.status ?? "open",
      owner: payload.owner ?? "",
      outcome: payload.outcome ?? ""
    });
    return NextResponse.json(getQuestBundle(payload.questId), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save update" }, { status: 400 });
  }
}
