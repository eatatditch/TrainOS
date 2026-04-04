import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mod = await db.module.findUnique({
    where: { id },
    include: { section: true, quiz: { include: { questions: true } }, assets: true },
  });
  if (!mod) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mod);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const data = await request.json();

  const mod = await db.module.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      slug: data.title ? slugify(data.title) : undefined,
      content: data.content,
      sectionId: data.sectionId,
      estimatedMinutes: data.estimatedMinutes,
      isRequired: data.isRequired,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      tags: data.tags,
    },
  });

  return NextResponse.json(mod);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await db.module.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
