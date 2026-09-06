import assert from "node:assert/strict";
import {
  ENRICH_STALE_MS,
  enrichHost,
  enrichProducer,
  isProducerEnrichmentDue,
  parseProducerHtml,
} from "@/lib/producers/enrich";

async function main() {
  assert.equal(enrichHost("https://curso-novo.com.br/go"), "curso-novo.com.br");
  assert.equal(enrichHost("youtube.com"), null);
  assert.equal(enrichHost("youtube.com/watch?v=abc"), null);
  assert.equal(enrichHost("digistore24.com"), null);

  const html = `
    <html>
      <body>
        <a href="mailto:time@curso-novo.com.br">email</a>
        <a href="https://instagram.com/cursooficial">ig</a>
        <a href="https://youtube.com/@cursooficial">yt</a>
        <a href="https://facebook.com/share">noise</a>
        <a href="https://linkedin.com/company/curso-novo">li</a>
        <a href="https://x.com/curso_novo">x</a>
      </body>
    </html>
  `;
  const parsed = parseProducerHtml(html, "curso-novo.com.br");
  assert.equal(parsed.email, "time@curso-novo.com.br");
  assert.equal(parsed.instagram, "cursooficial");
  assert.equal(parsed.youtube, "@cursooficial");
  assert.equal(parsed.facebook, null);
  assert.equal(parsed.linkedin, "company/curso-novo");
  assert.equal(parsed.x, "curso_novo");
  assert.equal(parsed.contactScore, 100);

  const privacy = parseProducerHtml(
    `<a href="mailto:proxy@whoisguard.com">x</a><img src="logo@cdn.com.png" />`,
    "curso.com",
  );
  assert.equal(privacy.email, null);

  const empty = await enrichProducer("curso.com", async () => ({
    ok: false,
    text: async () => "",
  }));
  assert.equal(empty.contactScore, 0);

  const skipped = await enrichProducer("youtube.com", async () => {
    throw new Error("must not fetch skipped hosts");
  });
  assert.equal(skipped.email, null);

  assert.equal(isProducerEnrichmentDue(null), true);
  assert.equal(isProducerEnrichmentDue(new Date()), false);
  assert.equal(
    isProducerEnrichmentDue(new Date(Date.now() - ENRICH_STALE_MS - 1)),
    true,
  );

  console.log("producer-enrich tests passed");
}

main();
