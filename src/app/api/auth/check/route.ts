import { NextResponse } from "next/server";
import { ALL_ACTIVE_ROLES, authorizeApi } from "@/lib/api-auth";

export async function GET() {
  const auth = await authorizeApi(ALL_ACTIVE_ROLES, {
    allowPasswordReset: true,
  });
  if (!auth.authorized) return auth.response;

  const { id, email, firstName, lastName, role, mustResetPassword } = auth.user;
  return NextResponse.json({
    authenticated: true,
    user: { id, email, firstName, lastName, role, mustResetPassword },
  });
}
