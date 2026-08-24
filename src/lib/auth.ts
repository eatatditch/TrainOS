import { createClient } from "@/lib/supabase/server";
import type { Position } from "./positions";
import { db } from "./db";

export interface AppUser {
  id: string;
  authId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE";
  /** Floor job (Server, Bartender, Line Cook, …). Separate from `role`. */
  position: Position | null;
  /** Bypass the 5-minute review timer on training modules. Set per-employee in /admin/employees. */
  skipReviewTimer: boolean;
  /** Force replacement of an administrator-issued or historical password. */
  mustResetPassword: boolean;
}

/**
 * Get the current authenticated user with their profile from the User table.
 * Returns null if not logged in or profile not found.
 */
export async function getUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await db
    .from("User")
    .select("id, authId, email, firstName, lastName, role, position, isActive, skipReviewTimer, mustResetPassword")
    .eq("authId", authUser.id)
    .eq("isActive", true)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    authId: profile.authId,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    role: profile.role as AppUser["role"],
    position: (profile.position as Position) ?? null,
    skipReviewTimer: !!profile.skipReviewTimer,
    mustResetPassword: !!profile.mustResetPassword,
  };
}
