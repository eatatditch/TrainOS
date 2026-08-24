import { AdminOnly } from "@/components/auth/admin-only";
export default function Layout({ children }: { children: React.ReactNode }) { return <AdminOnly>{children}</AdminOnly>; }
