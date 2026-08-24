import { redirect } from "next/navigation";
import { DitchMark } from "@/components/brand/ditch-mark";
import { getUser } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.mustResetPassword) redirect("/dashboard");

  return (
    <main className="app-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-ditch-navy" />
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-8 flex justify-center">
          <DitchMark inverse />
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}

