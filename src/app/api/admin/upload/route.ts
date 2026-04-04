import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const moduleId = formData.get("moduleId") as string;
  const fileType = formData.get("fileType") as string || "DOCUMENT";
  const isPrintable = formData.get("isPrintable") === "true";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Use service role client for storage
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Upload to Supabase Storage
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const path = moduleId ? `modules/${moduleId}/${fileName}` : `uploads/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("training-assets")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("training-assets")
    .getPublicUrl(path);

  // If moduleId provided, create ModuleAsset record
  if (moduleId) {
    const { data: asset, error: assetError } = await supabase
      .from("ModuleAsset")
      .insert({
        moduleId,
        fileName: file.name,
        fileUrl: urlData.publicUrl,
        fileType: fileType,
        fileSize: file.size,
        isPrintable,
        sortOrder: 0,
      })
      .select()
      .single();

    if (assetError) {
      return NextResponse.json({ error: assetError.message }, { status: 500 });
    }

    return NextResponse.json({ asset, url: urlData.publicUrl });
  }

  return NextResponse.json({ url: urlData.publicUrl, path });
}
