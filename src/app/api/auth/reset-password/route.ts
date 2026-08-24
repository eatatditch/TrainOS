import { NextRequest, NextResponse } from "next/server";
import { ALL_ACTIVE_ROLES, authorizeApi } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { validatePassword } from "@/lib/password-policy";
import {
  createAdminClient,
  createClient as createSessionClient,
} from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(ALL_ACTIVE_ROLES, {
    allowPasswordReset: true,
  });
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => null);
  const password = body?.password;
  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const supabaseAdmin = await createAdminClient();
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    auth.user.authId,
    { password },
  );
  if (authError) {
    return NextResponse.json(
      { error: "Unable to update your password. Please try again." },
      { status: 400 },
    );
  }

  const { data: updatedProfile, error: profileError } = await db
    .from("User")
    .update({ mustResetPassword: false })
    .eq("id", auth.user.id)
    .eq("authId", auth.user.authId)
    .select("id")
    .single();

  if (profileError || !updatedProfile) {
    return NextResponse.json(
      {
        error:
          "Your password changed, but TrainOS could not finish unlocking your account. Please contact an administrator.",
      },
      { status: 500 },
    );
  }

  // Preserve the current browser session but revoke other sessions where
  // possible so a historical credential/session cannot remain active.
  const sessionClient = await createSessionClient();
  await sessionClient.auth.signOut({ scope: "others" });

  return NextResponse.json({ success: true });
}

