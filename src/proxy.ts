import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const sessionResponse = await updateSession(request);
  const hostname = (request.headers.get("host") ?? "")
    .split(":", 1)[0]
    .toLowerCase();

  if (hostname === "specos.eatatditch.com") {
    const { pathname } = request.nextUrl;

    // SpecOS resources and its authenticated API requests keep their paths.
    if (
      pathname.startsWith("/specos") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/api/search") ||
      pathname.startsWith("/api/dietary-definitions") ||
      pathname.startsWith("/api/mascot")
    ) {
      return sessionResponse;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/specos";
    const rewriteResponse = NextResponse.rewrite(url);

    // Preserve any refreshed Supabase cookies on rewritten responses.
    sessionResponse.cookies.getAll().forEach(({ name, value, ...options }) =>
      rewriteResponse.cookies.set(name, value, options),
    );
    return rewriteResponse;
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|specos-|sw\\.js|manifest\\.json|icon-|trainos-|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
