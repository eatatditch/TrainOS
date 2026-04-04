import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const role = request.nextUrl.searchParams.get("role");
  const location = request.nextUrl.searchParams.get("location");

  const users = await db.user.findMany({
    where: {
      ...(role ? { role: role as any } : {}),
      ...(location ? { location } : {}),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      location: true,
      phone: true,
      hireDate: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          completions: true,
          assignments: true,
        },
      },
    },
    orderBy: { lastName: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await request.json();

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(data.password || "ditch2024", 12);

  const user = await db.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || "EMPLOYEE",
      location: data.location || "",
      phone: data.phone || "",
      hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
      isActive: true,
    },
  });

  return NextResponse.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
}
