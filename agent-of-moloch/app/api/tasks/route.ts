import { NextRequest, NextResponse } from "next/server";
import { createTask, getGovernanceBundle, listTasks } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || undefined;
  return NextResponse.json({ tasks: listTasks(status) });
}

export async function POST(request: NextRequest) {
  try {
    const task = createTask(await request.json());
    return NextResponse.json({ task, bundle: getGovernanceBundle() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create task" }, { status: 400 });
  }
}
