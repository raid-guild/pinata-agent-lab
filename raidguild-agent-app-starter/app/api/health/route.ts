import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  getDb();
  return NextResponse.json({ ok: true, service: "raidguild-agent-app-starter" });
}
