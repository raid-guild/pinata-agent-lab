import { NextRequest, NextResponse } from "next/server";
import { createTodo, getTodoBundle } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || undefined;
  return NextResponse.json(getTodoBundle(status));
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    title?: string;
    body?: string;
    priority?: string;
    dueDate?: string;
  };

  try {
    const todo = createTodo(payload);
    return NextResponse.json({ todo, bundle: getTodoBundle() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create todo" }, { status: 400 });
  }
}
