import { NextResponse } from "next/server";
import { getUser, type AppUser } from "./auth";

export type UserRole = AppUser["role"];

export const ADMIN_ROLES: readonly UserRole[] = ["SUPER_ADMIN", "ADMIN"];
export const MANAGER_ROLES: readonly UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
];
export const ALL_ACTIVE_ROLES: readonly UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "EMPLOYEE",
];

type ApiAuthorization =
  | { authorized: true; user: AppUser }
  | { authorized: false; response: NextResponse };

interface ApiAuthorizationOptions {
  /** Only the password reset/check endpoints may admit a reset-gated user. */
  allowPasswordReset?: boolean;
}

/**
 * Authenticate an API request and authorize it against application roles.
 *
 * This deliberately resolves the caller through Supabase Auth *and* the
 * active public.User profile on every request. Route handlers use a
 * service-role database client, so this guard must run before any query.
 */
export async function authorizeApi(
  roles: readonly UserRole[] = ALL_ACTIVE_ROLES,
  options: ApiAuthorizationOptions = {},
): Promise<ApiAuthorization> {
  const user = await getUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }

  if (!roles.includes(user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "You do not have permission to perform this action" },
        { status: 403 },
      ),
    };
  }

  if (user.mustResetPassword && !options.allowPasswordReset) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "Set a new password before continuing",
          code: "PASSWORD_RESET_REQUIRED",
        },
        { status: 428 },
      ),
    };
  }

  return { authorized: true, user };
}
