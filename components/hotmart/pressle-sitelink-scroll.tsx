"use client";

import { useEffect } from "react";

const SECTIONS: Record<string, string> = {
  sitelink_demo: "demostracion",
  sitelink_precios: "planos",
  sitelink_casos: "casos",
  sitelink_funciona: "como-funciona",
};

export function PressleSitelinkScroll() {
  useEffect(() => {
    const content = new URLSearchParams(window.location.search).get("utm_content");
    const id = content ? SECTIONS[content] : undefined;
    if (!id) {
      return;
    }
    const node = document.getElementById(id);
    if (!node) {
      return;
    }
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return null;
}
