import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // Route specos.eatatditch.com to /specos
  if (host.includes("specos.eatatditch.com")) {
    const { pathname } = request.nextUrl;

    // Already on /specos — let it through
    if (pathname.startsWith("/specos")) {
      return NextResponse.next();
    }

    // API routes needed by SpecOS — let them through
    if (pathname.startsWith("/api/search")) {
      return NextResponse.next();
    }

    // Everything else on this domain → rewrite to /specos
    const url = request.nextUrl.clone();
    url.pathname = "/specos";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|specos-|sw\\.js|manifest\\.json|icon-|trainos-).*)"],
};
