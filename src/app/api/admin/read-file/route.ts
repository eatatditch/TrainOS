import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get("file");
  if (!fileName) {
    return NextResponse.json({ error: "file param required" }, { status: 400 });
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
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return NextResponse.json({ fileName, text: result.value });
    }

    // PDF files — use pdf-parse with error handling
    if (fileName.endsWith(".pdf")) {
      try {
        // pdf-parse needs this workaround for serverless
        const pdfParse = (await import("pdf-parse")).default;
        const result = await pdfParse(buffer, { max: 0 });
        return NextResponse.json({ fileName, text: result.text, pages: result.numpages });
      } catch (pdfErr: any) {
        // Fallback: return file info without text
        return NextResponse.json({
          fileName,
          text: `[PDF extraction failed: ${pdfErr.message}]`,
          sizeBytes: buffer.length,
        });
      }
    }

    return NextResponse.json({ fileName, text: "[Unsupported format]" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
