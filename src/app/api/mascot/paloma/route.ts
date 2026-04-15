import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_PNG_URL =
  "https://uwalxhxajdkecucjcdwk.supabase.co/storage/v1/object/public/training-assets/paloma-man.png";

// Friendly inline-SVG fallback used until a real paloma-man.png lands in the
// training-assets bucket. Surf-bro vibes: tan, sunglasses, hair, smile.
const FALLBACK_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffe7d4"/>
      <stop offset="100%" stop-color="#ffd0a8"/>
    </radialGradient>
  </defs>
  <circle cx="100" cy="95" r="85" fill="url(#bg)"/>
  <ellipse cx="155" cy="120" rx="14" ry="55" fill="#cd6028" transform="rotate(20 155 120)"/>
  <ellipse cx="155" cy="120" rx="6" ry="48" fill="#fff" opacity="0.4" transform="rotate(20 155 120)"/>
  <path d="M55 175 Q55 130 100 130 Q145 130 145 175 Z" fill="#325269"/>
  <rect x="90" y="115" width="20" height="14" fill="#e8b58a"/>
  <circle cx="100" cy="95" r="32" fill="#e8b58a"/>
  <path d="M70 80 Q80 55 100 58 Q120 52 132 78 Q120 70 100 72 Q82 72 70 80 Z" fill="#3a2a1a"/>
  <rect x="74" y="88" width="22" height="10" rx="3" fill="#1a1a1a"/>
  <rect x="104" y="88" width="22" height="10" rx="3" fill="#1a1a1a"/>
  <rect x="96" y="91" width="8" height="3" fill="#1a1a1a"/>
  <path d="M88 108 Q100 120 112 108" stroke="#3a2a1a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <g transform="translate(38 145) rotate(-15)">
    <ellipse cx="0" cy="0" rx="14" ry="11" fill="#e8b58a"/>
    <rect x="-12" y="-4" width="6" height="3" rx="1.5" fill="#e8b58a"/>
    <rect x="6" y="-4" width="8" height="3" rx="1.5" fill="#e8b58a"/>
  </g>
  <circle cx="100" cy="155" r="4" fill="#cd6028"/>
</svg>`;

export async function GET(req: Request) {
  // Cache-buster: callers can append ?v=anything to force a fresh fetch from
  // Supabase (and a fresh response from us). Without it we still revalidate
  // every request, but we'll serve a short-lived cached copy.
  const url = new URL(req.url);
  const version = url.searchParams.get("v") || "";
  const pngUrl = version ? `${PUBLIC_PNG_URL}?v=${encodeURIComponent(version)}` : PUBLIC_PNG_URL;

  // Try to fetch the real PNG. If found, stream it back ourselves so we
  // control cache headers end-to-end (no stale 302 redirects hanging around
  // in the browser after Tracy re-uploads the file).
  try {
    const res = await fetch(pngUrl, { cache: "no-store" });
    if (res.ok) {
      const bytes = new Uint8Array(await res.arrayBuffer());
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          "Content-Type": res.headers.get("content-type") || "image/png",
          // Short cache so re-uploads show up quickly. must-revalidate so
          // browsers re-check with us instead of blindly serving stale.
          "Cache-Control": "public, max-age=60, must-revalidate",
        },
      });
    }
  } catch {
    // fall through to SVG
  }

  // Otherwise serve the inline SVG fallback.
  return new NextResponse(FALLBACK_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300",
    },
  });
}
