import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PDF_URL =
  "https://uwalxhxajdkecucjcdwk.supabase.co/storage/v1/object/public/training-assets/paloma%20man.pdf";
const PNG_NAME = "paloma-man.png";
const PUBLIC_PNG_URL = `https://uwalxhxajdkecucjcdwk.supabase.co/storage/v1/object/public/training-assets/${PNG_NAME}`;

export async function GET() {
  // Fast path — if PNG already exists, redirect straight to it.
  try {
    const head = await fetch(PUBLIC_PNG_URL, { method: "HEAD" });
    if (head.ok) {
      return NextResponse.redirect(PUBLIC_PNG_URL, {
        status: 302,
        headers: { "Cache-Control": "public, max-age=86400" },
      });
    }
  } catch {
    /* fall through to render */
  }

  // Render PDF → PNG and cache to Supabase storage
  try {
    const pdfRes = await fetch(PDF_URL);
    if (!pdfRes.ok) {
      return NextResponse.json({ error: "Could not fetch source PDF" }, { status: 502 });
    }
    const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());

    // Dynamic imports so the pdfjs worker loads lazily
    const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const canvasMod: any = await import("@napi-rs/canvas");

    // Disable worker (Next.js Node runtime can't spawn web workers)
    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = "";
    }

    const loadingTask = pdfjs.getDocument({
      data: pdfBytes,
      useSystemFonts: false,
      disableFontFace: true,
      isEvalSupported: false,
    });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 3 });

    const canvas = canvasMod.createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d");

    await page.render({
      canvasContext: ctx as any,
      viewport,
    }).promise;

    const pngBuffer: Buffer = canvas.toBuffer("image/png");

    // Cache to Supabase storage if we have the key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      const sb = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      await sb.storage.from("training-assets").upload(PNG_NAME, pngBuffer, {
        contentType: "image/png",
        upsert: true,
      });
    }

    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
