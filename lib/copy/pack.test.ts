import assert from "node:assert/strict";
import { languageForMarket, parseCopyPack, presellSlug } from "@/lib/copy/pack";
import { renderPresellHtml } from "@/lib/presell/document";

function main() {
  assert.equal(languageForMarket("BR", "en"), "pt");
  assert.equal(languageForMarket("US", "pt"), "en");
  assert.equal(languageForMarket("EUA", "pt"), "en");
  assert.equal(languageForMarket("MX", "pt"), "es");
  assert.equal(languageForMarket("", "es"), "es");

  const raw = JSON.stringify({
    framework: "PAS",
    headlines: ["Um", "Dois", "Três"],
    body: "Corpo",
    ctas: ["A", "B", "C"],
    shortCopy: "Curta",
    longCopy: "Longa",
  });
  const pack = parseCopyPack(`texto ${raw}`, "pt");
  assert.equal(pack?.framework, "PAS");
  assert.equal(pack?.language, "pt");
  assert.equal(pack?.headlines[2], "Três");
  assert.equal(parseCopyPack("sem json", "en"), null);

  const slug = presellSlug("Mente Visionária");
  assert.match(slug, /^presell-mente-visionaria-[a-z0-9]+$/);

  const html = renderPresellHtml({
    template: "blog",
    language: "pt",
    product: "Radar",
    niche: "Foco",
    whyRising: "A IA mudou o trabalho.",
    headline: "Chegue antes",
    body: "Corpo",
    longCopy: "Texto longo",
    shortCopy: "Curto",
    cta: "Ver o painel",
    mediaUrl: "",
    checkoutUrl: "",
  });
  assert.match(html, /Chegue antes/);
  assert.match(html, /A IA mudou o trabalho/);
  assert.doesNotMatch(html, /<script/i);

  const escaped = renderPresellHtml({
    template: "blog",
    language: "en",
    product: "X",
    niche: "<script>",
    whyRising: "",
    headline: "Safe",
    body: "b",
    longCopy: "l",
    shortCopy: "s",
    cta: "Go",
    mediaUrl: "javascript:alert(1)",
    checkoutUrl: "",
  });
  assert.match(escaped, /&lt;script&gt;/);
  assert.doesNotMatch(escaped, /javascript:alert/);

  console.log("copy pack ok");
}

main();
