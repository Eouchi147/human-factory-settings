import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    // Old preview paths, renamed to plain words on 30 Sep 2026.
    return [
      { source: "/explore", destination: "/body", permanent: true },
      { source: "/explore/:slug", destination: "/body/:slug", permanent: true },
      { source: "/films", destination: "/watch", permanent: true },
      { source: "/films/fig-01", destination: "/watch", permanent: true },
      { source: "/watch/your-body-builds-itself", destination: "/watch", permanent: false },
      { source: "/you", destination: "/quiz", permanent: true },
      { source: "/restore", destination: "/feel-better", permanent: true },
      { source: "/restore/:path*", destination: "/feel-better/:path*", permanent: true },
      { source: "/library", destination: "/how-we-check", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Preview build: keep every page out of search engines until launch.
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
