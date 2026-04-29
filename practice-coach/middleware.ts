import { NextRequest, NextResponse } from "next/server";

const realm = "Practice Coach";

export function middleware(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  if (!isAppRoute(pathname)) {
    return NextResponse.next();
  }

  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = authorization.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return unauthorized();
  }

  try {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    const username = decoded.slice(0, separator);
    const candidate = decoded.slice(separator + 1);

    if (separator > 0 && username.length > 0 && candidate === password) {
      return NextResponse.next();
    }
  } catch {
    return unauthorized();
  }

  return unauthorized();
}

function isAppRoute(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/") || pathname === "/" || pathname.startsWith("/api/");
}

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${realm}", charset="UTF-8"`
    }
  });
}

export const config = {
  matcher: ["/:path*"]
};
