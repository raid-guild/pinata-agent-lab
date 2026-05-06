import { NextRequest, NextResponse } from "next/server";
import { deleteProposal, getGovernanceBundle, updateProposal } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const proposalId = Number(id);
  if (!Number.isInteger(proposalId) || proposalId <= 0) {
    return NextResponse.json({ error: "Valid proposal record id is required" }, { status: 400 });
  }

  try {
    const proposal = updateProposal(proposalId, await request.json());
    return NextResponse.json({ proposal, bundle: getGovernanceBundle() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update proposal" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const proposalId = Number(id);
  if (!Number.isInteger(proposalId) || proposalId <= 0) {
    return NextResponse.json({ error: "Valid proposal record id is required" }, { status: 400 });
  }

  try {
    deleteProposal(proposalId);
    return NextResponse.json({ ok: true, bundle: getGovernanceBundle() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete proposal" }, { status: 400 });
  }
}
