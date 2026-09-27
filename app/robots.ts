import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "AdsBot-Google", allow: "/" },
      { userAgent: "AdsBot-Google-Mobile", allow: "/" },
    ],
    sitemap: "https://radar.rotadomilhao.store/sitemap.xml",
    host: "https://radar.rotadomilhao.store",
  };
}
