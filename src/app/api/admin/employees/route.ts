import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const role = request.nextUrl.searchParams.get("role");
  const location = request.nextUrl.searchParams.get("location");

  let query = db
    .from("User")
    .select("id, email, firstName, lastName, role, location, phone, hireDate, isActive, createdAt")
    .order("lastName");

  if (role) query = query.eq("role", role);
  if (location) query = query.eq("location", location);

  const { data: users } = await query;

  // Fetch counts separately for assignments and completions
  const usersWithCounts = await Promise.all(
    (users || []).map(async (u: any) => {
      const [{ count: assignmentCount }, { count: completionCount }] = await Promise.all([
        db.from("ModuleAssignment").select("*", { count: "exact", head: true }).eq("userId", u.id),
        db.from("ModuleCompletion").select("*", { count: "exact", head: true }).eq("userId", u.id),
      ]);
      return {
        ...u,
        _count: {
          assignments: assignmentCount || 0,
          completions: completionCount || 0,
        },
      };
    })
  );

  return NextResponse.json(usersWithCounts);
}

export async function POST(request: NextRequest) {
  const adminUser = await getUser();
  if (!adminUser || !["SUPER_ADMIN", "ADMIN"].includes(adminUser.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await request.json();

  const { data: existing } = await db
    .from("User")
    .select("*")
    .eq("email", data.email)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const supabaseAdmin = await createAdminClient();
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password || "ditch2024",
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { data: newUser, error } = await db
    .from("User")
    .insert({
      authId: authData.user.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || "EMPLOYEE",
      location: data.location || "",
      phone: data.phone || "",
      hireDate: data.hireDate ? new Date(data.hireDate).toISOString() : new Date().toISOString(),
      isActive: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: newUser.id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName });
}
