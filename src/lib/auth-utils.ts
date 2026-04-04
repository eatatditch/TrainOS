import { auth } from "./auth";
import { redirect } from "next/navigation";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireAuth();
  const userRole = (user as any).role as UserRole;
  if (!roles.includes(userRole)) redirect("/unauthorized");
  return user;
}

export async function requireAdmin() {
  return requireRole(["SUPER_ADMIN", "ADMIN"]);
}

export async function requireManager() {
  return requireRole(["SUPER_ADMIN", "ADMIN", "MANAGER"]);
}

export function isAdmin(role: UserRole) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isManager(role: UserRole) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "MANAGER";
}
