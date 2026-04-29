import { proxyJsonPost } from "../../../../../lib/openclaw-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = {
  params: Promise<{ name: string }>;
};

function isAllowedHookName(name: string) {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

export async function POST(request: Request, context: Context) {
  const { name } = await context.params;

  if (!isAllowedHookName(name)) {
    return Response.json({ error: "Invalid hook name." }, { status: 400 });
  }

  return proxyJsonPost(request, `/hooks/${name}`);
}
