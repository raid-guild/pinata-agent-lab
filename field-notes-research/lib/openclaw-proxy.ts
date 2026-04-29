const OPENCLAW_BASE_URL = process.env.OPENCLAW_BASE_URL ?? "http://127.0.0.1:18789";
const MAX_BODY_BYTES = 1024 * 1024;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export function featureDisabled() {
  return !process.env.API_PASSWORD;
}

export function getOpenClawBaseUrl() {
  return OPENCLAW_BASE_URL;
}

export async function requireProxyAuth(request: Request) {
  const apiPassword = process.env.API_PASSWORD;

  if (!apiPassword) {
    return jsonError("OpenClaw proxy is disabled.", 404);
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  const headerToken = request.headers.get("x-api-password");
  const token = bearerToken ?? headerToken;

  if (!token || token !== apiPassword) {
    return jsonError("Unauthorized.", 401);
  }

  return null;
}

export function validateJsonRequest(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return jsonError("Payload too large.", 413);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonError("Content-Type must be application/json.", 415);
  }

  return null;
}

function buildUpstreamUrl(pathname: string) {
  return new URL(pathname, OPENCLAW_BASE_URL);
}

function buildUpstreamHeaders(request: Request, pathname: string) {
  const headers = new Headers({
    accept: request.headers.get("accept") ?? "application/json",
    "content-type": "application/json"
  });

  if (pathname.startsWith("/hooks/") && process.env.API_PASSWORD) {
    headers.set("x-openclaw-token", process.env.API_PASSWORD);
  }

  if (pathname === "/v1/responses" && process.env.OPENCLAW_GATEWAY_TOKEN) {
    headers.set("authorization", `Bearer ${process.env.OPENCLAW_GATEWAY_TOKEN}`);
  }

  return headers;
}

export async function checkOpenClawGateway() {
  try {
    const response = await fetch(buildUpstreamUrl("/"), {
      method: "GET",
      headers: {
        accept: "application/json"
      }
    });

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText
    };
  } catch {
    return null;
  }
}

export async function proxyJsonPost(request: Request, pathname: string) {
  const authError = await requireProxyAuth(request);
  if (authError) return authError;

  const validationError = validateJsonRequest(request);
  if (validationError) return validationError;

  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
    return jsonError("Payload too large.", 413);
  }

  let upstream: Response;

  try {
    upstream = await fetch(buildUpstreamUrl(pathname), {
      method: "POST",
      headers: buildUpstreamHeaders(request, pathname),
      body
    });
  } catch {
    return jsonError("Could not reach OpenClaw gateway.", 502);
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  const cacheControl = upstream.headers.get("cache-control");
  if (cacheControl) responseHeaders.set("cache-control", cacheControl);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}
