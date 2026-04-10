import { NextResponse } from "next/server";

const ICON_URL =
  "https://uwalxhxajdkecucjcdwk.supabase.co/storage/v1/object/public/training-assets/trainos-icon.png";

export async function GET() {
  const res = await fetch(ICON_URL);
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
