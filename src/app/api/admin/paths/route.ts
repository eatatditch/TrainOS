import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const paths = await db.trainingPath.findMany({
    include: {
      modules: { include: { module: true }, orderBy: { sortOrder: "asc" } },
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(paths);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await request.json();

  const path = await db.trainingPath.create({
    data: {
      title: data.title,
      description: data.description || "",
      targetRole: data.targetRole || "",
      isActive: true,
      modules: {
        create: (data.moduleIds || []).map((moduleId: string, i: number) => ({
          moduleId,
          sortOrder: i,
          isRequired: true,
        })),
      },
    },
    include: { modules: true },
  });

  return NextResponse.json(path);
}
