import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getUser();
  if (!currentUser || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(currentUser.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const { data: employee } = await db
    .from("User")
    .select("id, email, firstName, lastName, role, location, phone, hireDate, isActive, createdAt")
    .eq("id", id)
    .single();

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch related data separately
  const [
    { data: assignments },
    { data: completions },
    { data: quizAttempts },
    { data: trainingPaths },
  ] = await Promise.all([
    db.from("ModuleAssignment").select("*, module:Module(*, section:Section(*))").eq("userId", id),
    db.from("ModuleCompletion").select("*, module:Module(*)").eq("userId", id),
    db.from("QuizAttempt").select("*, quiz:Quiz(*)").eq("userId", id).order("completedAt", { ascending: false }),
    db.from("UserTrainingPath").select("*, trainingPath:TrainingPath(*)").eq("userId", id),
  ]);

  return NextResponse.json({
    ...employee,
    assignments: assignments || [],
    completions: completions || [],
    quizAttempts: quizAttempts || [],
    trainingPaths: trainingPaths || [],
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getUser();
  if (!adminUser || !["SUPER_ADMIN", "ADMIN"].includes(adminUser.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const data = await request.json();

  if (data.password) {
    const { data: existingUser } = await db
      .from("User")
      .select("authId")
      .eq("id", id)
      .single();

    if (existingUser?.authId) {
      const supabaseAdmin = await createAdminClient();
      await supabaseAdmin.auth.admin.updateUserById(existingUser.authId, { password: data.password });
    }
  }

  const updateData: any = {};
  if (data.firstName) updateData.firstName = data.firstName;
  if (data.lastName) updateData.lastName = data.lastName;
  if (data.email) updateData.email = data.email;
  if (data.role) updateData.role = data.role;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const { data: updatedUser, error } = await db
    .from("User")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: updatedUser.id, email: updatedUser.email, firstName: updatedUser.firstName, lastName: updatedUser.lastName });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deleteUser = await getUser();
  if (!deleteUser || !["SUPER_ADMIN"].includes(deleteUser.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await db.from("User").update({ isActive: false }).eq("id", id);
  return NextResponse.json({ success: true });
}
