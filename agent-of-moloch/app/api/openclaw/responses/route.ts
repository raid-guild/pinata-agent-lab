import { proxyJsonPost } from "../../../../lib/openclaw-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  return proxyJsonPost(request, "/v1/responses");
}
