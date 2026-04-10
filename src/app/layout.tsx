import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ditch Training",
  description: "Internal training and knowledge center for Ditch team members",
  manifest: "/manifest.json",
  icons: {
    icon: "/api/icon",
    apple: "/api/icon",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ditch Training",
  },
};

export const viewport: Viewport = {
  themeColor: "#cd6028",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
