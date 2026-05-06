import { NextRequest, NextResponse } from "next/server";
import { createProposal, getGovernanceBundle, listProposals } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || undefined;
  return NextResponse.json({ proposals: listProposals(status) });
}

export async function POST(request: NextRequest) {
  try {
    const proposal = createProposal(await request.json());
    return NextResponse.json({ proposal, bundle: getGovernanceBundle() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create proposal" }, { status: 400 });
  }
}
