import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/skills`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/dashboard`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/portfolio`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];
}
