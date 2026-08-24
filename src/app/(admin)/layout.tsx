import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.mustResetPassword) redirect("/reset-password");

  if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="app-canvas min-h-screen">
      <AdminSidebar user={user} />
      <main className="pt-16 lg:pl-72 lg:pt-0">
        <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}
