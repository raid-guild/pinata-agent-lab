import { NextRequest, NextResponse } from "next/server";
import { getGovernanceBundle } from "../../../../lib/db";
import { syncMemory } from "../../../../lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const result = await syncMemory(await request.json());
    return NextResponse.json({ result, bundle: getGovernanceBundle() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sync memory" }, { status: 400 });
  }
}
