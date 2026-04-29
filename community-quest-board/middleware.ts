import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const password = process.env.APP_PASSWORD;

  if (!password) {
    return NextResponse.next();
  }

  const authorization = request.headers.get("authorization");
  const credentials = parseBasicAuth(authorization);

  if (credentials?.username && credentials.password === password) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Community Quest Board", charset="UTF-8"'
    }
  });
}

function parseBasicAuth(header: string | null) {
  if (!header?.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = atob(header.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex <= 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/", "/api/:path*"]
};
