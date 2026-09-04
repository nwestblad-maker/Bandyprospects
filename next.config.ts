import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/clubs",
        destination: "/market",
      },
      {
        source: "/clubs/new",
        destination: "/post-ad",
      },
      {
        source: "/players/new",
        destination: "/join",
      },
    ];
  },
};

export default nextConfig;
