import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-ditch-orange">403</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to view this page.</p>
        <Link href="/dashboard" className="btn-primary inline-block mt-6">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
