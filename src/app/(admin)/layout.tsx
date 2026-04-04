import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { SessionProvider } from "next-auth/react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(role)) {
    redirect("/dashboard");
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar user={session.user as any} />
        <main className="lg:pl-64">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
