import { NextRequest, NextResponse } from "next/server";

/** Backward-compatible redirect for cached clients using the old mascot URL. */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/paloma-man.svg", request.url), 307);
}
