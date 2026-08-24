import type { Metadata, Viewport } from "next";

const iconUrl = "/icon-512.png";

export const metadata: Metadata = {
  title: "SpecOS — Ditch",
  description: "Instant cocktail specs, recipes, and operational answers for Ditch team members",
  manifest: "/specos-manifest.json",
  icons: {
    icon: iconUrl,
    apple: iconUrl,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpecOS",
  },
};

export const viewport: Viewport = {
  themeColor: "#143b4b",
  width: "device-width",
  initialScale: 1,
};

export default function SpecOSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ditch-cream">
      {children}
    </div>
  );
}
