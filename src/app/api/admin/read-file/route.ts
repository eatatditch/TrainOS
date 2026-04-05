import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get("file");
  if (!fileName) {
    return NextResponse.json({ error: "file param required" }, { status: 400 });
  }

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

  // Check if DOCX
  if (fileName.endsWith(".docx")) {
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return NextResponse.json({ fileName, text: result.value });
  }

  // For PDFs, return base64 (can't easily extract text server-side without heavy deps)
  if (fileName.endsWith(".pdf")) {
    return NextResponse.json({
      fileName,
      text: "[PDF file - text extraction not available]",
      sizeBytes: buffer.length,
    });
  }

  return NextResponse.json({ fileName, text: "[Unsupported format]" });
}
