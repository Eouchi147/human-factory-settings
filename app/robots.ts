import type { MetadataRoute } from "next";

// Preview build: keep crawlers out until launch.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
