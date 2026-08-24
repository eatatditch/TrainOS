import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="app-canvas flex min-h-screen items-center justify-center px-4 py-10">
      <div className="shell-card w-full max-w-md p-8 text-center sm:p-10">
        <p className="page-kicker">Wrong lineup</p>
        <h1 className="text-7xl font-black tracking-[-0.06em] text-ditch-orange">403</h1>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-ditch-ink">That area isn&apos;t assigned to you.</h2>
        <p className="mt-3 text-sm leading-6 text-ditch-navy/55">Head back to your home screen or ask a manager if you think this is a mistake.</p>
        <Link href="/dashboard" className="btn-primary mt-7">
          Back home
        </Link>
      </div>
    </main>
  );
}
