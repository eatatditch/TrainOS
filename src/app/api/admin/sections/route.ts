import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  const sections = await db.section.findMany({
    include: { modules: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(sections);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await request.json();
  const slug = slugify(data.title);

  const section = await db.section.create({
    data: {
      title: data.title,
      description: data.description || "",
      slug,
      icon: data.icon || "",
      sortOrder: data.sortOrder || 0,
      isActive: true,
    },
  });

  return NextResponse.json(section);
}
