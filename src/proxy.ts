import { NextResponse, type NextRequest } from "next/server";

const privatePages = ["/history"];
const privateApis = ["/api/history", "/api/schemas"];

function parseToken(request: NextRequest): { expired: boolean; present: boolean } {
  const token = request.cookies.get("swagger_session")?.value;

  if (!token) {
    return { present: false, expired: false };
  }

  const [payload] = token.split(".");

  if (!payload) {
    return { present: true, expired: true };
  }

  try {
    const normalized = payload.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const parsed = JSON.parse(atob(padded)) as { exp?: unknown };
    return {
      present: true,
      expired: typeof parsed.exp !== "number" || parsed.exp <= Math.floor(Date.now() / 1000)
    };
  } catch {
    return { present: true, expired: true };
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsPageAuth = privatePages.some((route) => pathname.startsWith(route));
  const needsApiAuth = privateApis.some((route) => pathname.startsWith(route));

  if (!needsPageAuth && !needsApiAuth) {
    return NextResponse.next();
  }

  const token = parseToken(request);

  if (!token.present || token.expired) {
    if (needsApiAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/history/:path*", "/api/history/:path*", "/api/schemas/:path*"]
};
