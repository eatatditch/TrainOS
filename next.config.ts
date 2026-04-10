import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/trainos-icon.png",
        destination:
          "https://uwalxhxajdkecucjcdwk.supabase.co/storage/v1/object/public/training-assets/trainos-icon.png",
      },
    ];
  },
};

export default nextConfig;
