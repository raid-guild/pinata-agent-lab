import { NextRequest, NextResponse } from "next/server";
import { getGovernanceBundle, listSnapshotArtifacts, upsertSnapshotArtifact } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ artifacts: listSnapshotArtifacts() });
}

export async function POST(request: NextRequest) {
  try {
    const artifact = upsertSnapshotArtifact(await request.json());
    return NextResponse.json({ artifact, bundle: getGovernanceBundle() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update artifact checkpoint" }, { status: 400 });
  }
}
