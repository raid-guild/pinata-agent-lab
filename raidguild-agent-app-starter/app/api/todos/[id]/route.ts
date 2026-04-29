import { NextRequest, NextResponse } from "next/server";
import { deleteTodo, getTodoBundle, updateTodo } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const todoId = Number(id);
  const payload = (await request.json()) as {
    title?: string;
    body?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
  };

  if (!Number.isInteger(todoId) || todoId <= 0) {
    return NextResponse.json({ error: "Valid todo id is required" }, { status: 400 });
  }

  try {
    const todo = updateTodo(todoId, payload);
    return NextResponse.json({ todo, bundle: getTodoBundle() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update todo" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const todoId = Number(id);

  if (!Number.isInteger(todoId) || todoId <= 0) {
    return NextResponse.json({ error: "Valid todo id is required" }, { status: 400 });
  }

  try {
    deleteTodo(todoId);
    return NextResponse.json({ ok: true, bundle: getTodoBundle() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete todo" }, { status: 400 });
  }
}
