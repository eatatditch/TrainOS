import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth required
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname === "/unauthorized"
  ) {
    // Refresh session cookies even on public routes
    const { user, supabaseResponse } = await updateSession(request);

    // Redirect logged-in users away from login
    if (user && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return supabaseResponse;
  }

  // All other routes require auth
  const { user, supabaseResponse } = await updateSession(request);

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Note: admin role checks are handled at the page/API level via
  // requireRole() because middleware can't query the Prisma profile.
  // The middleware only ensures a valid Supabase session exists.

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
