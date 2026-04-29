import {
  checkOpenClawGateway,
  featureDisabled,
  getOpenClawBaseUrl,
  requireProxyAuth
} from "../../../../lib/openclaw-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (featureDisabled()) {
    return Response.json(
      {
        ok: false,
        enabled: false,
        status: "disabled"
      },
      { status: 404 }
    );
  }

  const authError = await requireProxyAuth(request);
  if (authError) return authError;

  const gateway = await checkOpenClawGateway();
  if (!gateway) {
    return Response.json(
      {
        ok: false,
        enabled: true,
        status: "unreachable",
        target: getOpenClawBaseUrl()
      },
      { status: 502 }
    );
  }

  return Response.json(
    {
      ok: gateway.ok,
      enabled: true,
      status: gateway.ok ? "healthy" : "upstream-error",
      target: getOpenClawBaseUrl(),
      upstream: {
        status: gateway.status,
        statusText: gateway.statusText
      }
    },
    { status: gateway.ok ? 200 : 502 }
  );
}
