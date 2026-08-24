import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function AdminOnly({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) redirect("/admin");
  return children;
}
