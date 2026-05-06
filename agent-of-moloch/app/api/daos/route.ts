import { NextRequest, NextResponse } from "next/server";
import { createDao, getGovernanceBundle, listDaos } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ daos: listDaos() });
}

export async function POST(request: NextRequest) {
  try {
    const dao = createDao(await request.json());
    return NextResponse.json({ dao, bundle: getGovernanceBundle() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create dao" }, { status: 400 });
  }
}
