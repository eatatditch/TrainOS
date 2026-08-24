import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MANAGER_ROLES, authorizeApi } from "@/lib/api-auth";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(MANAGER_ROLES);
  if (!auth.authorized) return auth.response;

  const fileName = request.nextUrl.searchParams.get("file");
  if (!fileName) {
    return NextResponse.json({ error: "file param required" }, { status: 400 });
  }
  if (
    fileName.length > 512 ||
    fileName.startsWith("/") ||
    fileName.split("/").some((segment) => segment === "..")
  ) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabase.storage
      .from("training-assets")
      .download(fileName);

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "File not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    // DOCX files
    if (fileName.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return NextResponse.json({ fileName, text: result.value });
    }

    // PDF files — basic text extraction without external deps
    if (fileName.endsWith(".pdf")) {
      // Extract readable text from PDF binary by scanning for text streams
      const text = extractTextFromPdfBuffer(buffer);
      return NextResponse.json({ fileName, text, sizeBytes: buffer.length });
    }

    return NextResponse.json({ fileName, text: "[Unsupported format]" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to read file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractTextFromPdfBuffer(buffer: Buffer): string {
  const str = buffer.toString("latin1");
  const texts: string[] = [];

  // Find text between BT and ET markers (PDF text objects)
  const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let match;

  while ((match = btEtRegex.exec(str)) !== null) {
    const block = match[1];
    // Extract strings in parentheses (PDF literal strings)
    const parenRegex = /\(([^)]*)\)/g;
    let strMatch;
    while ((strMatch = parenRegex.exec(block)) !== null) {
      const decoded = strMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\")
        .replace(/\\([()])/g, "$1");
      if (decoded.trim()) texts.push(decoded);
    }
    // Extract hex strings
    const hexRegex = /<([0-9a-fA-F]+)>/g;
    let hexMatch;
    while ((hexMatch = hexRegex.exec(block)) !== null) {
      const hex = hexMatch[1];
      let decoded = "";
      for (let i = 0; i < hex.length; i += 2) {
        decoded += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      if (decoded.trim()) texts.push(decoded);
    }
  }

  return texts.join(" ").replace(/\s+/g, " ").trim();
}
