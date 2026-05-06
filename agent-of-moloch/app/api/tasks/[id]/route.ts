import { NextRequest, NextResponse } from "next/server";
import { deleteTask, getGovernanceBundle, updateTask } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: "Valid task id is required" }, { status: 400 });
  }

  try {
    const task = updateTask(taskId, await request.json());
    return NextResponse.json({ task, bundle: getGovernanceBundle() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update task" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: "Valid task id is required" }, { status: 400 });
  }

  try {
    deleteTask(taskId);
    return NextResponse.json({ ok: true, bundle: getGovernanceBundle() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete task" }, { status: 400 });
  }
}
