import { NextRequest, NextResponse } from "next/server";

/** Backward-compatible redirect for previously installed PWA manifests. */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/icon-512.png", request.url), 307);
}
