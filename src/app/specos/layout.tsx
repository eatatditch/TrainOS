import type { Metadata, Viewport } from "next";

const iconUrl = "https://uwalxhxajdkecucjcdwk.supabase.co/storage/v1/object/public/training-assets/specos-icon.png";

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
    statusBarStyle: "black-translucent",
    title: "SpecOS",
  },
};

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function SpecOSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      {children}
    </div>
  );
}
