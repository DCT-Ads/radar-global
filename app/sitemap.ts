import type { MetadataRoute } from "next";

const BASE = "https://radar.rotadomilhao.store";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/privacidade",
    "/termos",
    "/reembolso",
    "/contato",
    "/anual",
    "/eu",
    "/espanol",
    "/mensual",
    "/pressle",
    "/gracias",
    "/bienvenido",
    "/mas-tarde",
    "/upsell-es",
  ];
  return paths.map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
