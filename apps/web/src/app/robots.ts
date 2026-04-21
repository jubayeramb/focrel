import type { MetadataRoute } from "next";
import { productUrl } from "@focrel/brand";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${productUrl}/sitemap.xml`,
    host: productUrl,
  };
}
