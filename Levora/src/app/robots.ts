import type { MetadataRoute } from "next";
import { getSiteUrl, privateRoutePrefixes } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: privateRoutePrefixes,
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
