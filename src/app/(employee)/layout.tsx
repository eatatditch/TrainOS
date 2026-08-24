import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmployeeSidebar } from "@/components/layout/employee-sidebar";
import { PWARegister } from "@/components/pwa-register";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.mustResetPassword) redirect("/reset-password");

  return (
    <div className="app-canvas min-h-screen">
      <PWARegister />
      <EmployeeSidebar user={user} />
      <main className="pt-16 lg:pl-72 lg:pt-0">
        <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}
