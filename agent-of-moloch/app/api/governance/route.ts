import { NextRequest, NextResponse } from "next/server";
import { getGovernanceBundle } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || undefined;
  return NextResponse.json(getGovernanceBundle(status));
}
