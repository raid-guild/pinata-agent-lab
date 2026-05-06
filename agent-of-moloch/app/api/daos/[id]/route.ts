import { NextRequest, NextResponse } from "next/server";
import { deleteDao, getGovernanceBundle, updateDao } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const daoId = Number(id);
  if (!Number.isInteger(daoId) || daoId <= 0) {
    return NextResponse.json({ error: "Valid dao id is required" }, { status: 400 });
  }

  try {
    const dao = updateDao(daoId, await request.json());
    return NextResponse.json({ dao, bundle: getGovernanceBundle() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update dao" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const daoId = Number(id);
  if (!Number.isInteger(daoId) || daoId <= 0) {
    return NextResponse.json({ error: "Valid dao id is required" }, { status: 400 });
  }

  try {
    deleteDao(daoId);
    return NextResponse.json({ ok: true, bundle: getGovernanceBundle() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete dao" }, { status: 400 });
  }
}
