import { NextRequest, NextResponse } from "next/server";
import { getSharedMemoryState } from "../../../lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const daoId = Number(request.nextUrl.searchParams.get("daoId") || "");
  const memory = await getSharedMemoryState(Number.isInteger(daoId) && daoId > 0 ? daoId : undefined);
  return NextResponse.json({ memory });
}
