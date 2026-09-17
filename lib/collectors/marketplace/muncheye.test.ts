import assert from "node:assert/strict";
import { marketplaceLaunchToSignalPayload } from "./adapter";
import { extractMuncheyeLandingUrl, parseMuncheyeItems } from "./muncheye";

const LISTING = `
<div class="item clearfix mega_item">
  <div class="item_info">
    <a href="/keto-skincare-lab" rel="bookmark">Jane Doe: Keto Skincare Lab</a>
  </div>
  <meta itemprop="name" content="Keto Skincare Lab"/>
  <meta itemprop="releaseDate" content="2026-09-16"/>
</div>
`;

const ARTICLE = `
<table>
  <tr><td><b>JV Page:</b></td><td><a href="https://fablefoxai.com/jv">https://fablefoxai.com/jv</a></td></tr>
</table>
<a href="https://fonts.googleapis.com/css?family=Electrolize">font</a>
<a href="https://www.facebook.com/sharer/sharer.php?u=https://muncheye.com/fablefoxai">Share</a>
`;

function main() {
  const items = parseMuncheyeItems(LISTING, "2026-09-14T00:00:00.000Z");
  assert.equal(items.length, 1);
  assert.equal(items[0]?.url, "https://muncheye.com/keto-skincare-lab");
  assert.equal(items[0]?.keyword, "keto");

  const landing = extractMuncheyeLandingUrl(ARTICLE);
  assert.equal(landing, "https://fablefoxai.com/jv");

  const payload = marketplaceLaunchToSignalPayload({
    ...items[0]!,
    url: landing!,
  });
  assert.equal(payload.domain, "fablefoxai.com");
  assert.equal(payload.value, "muncheye:fablefoxai.com");
  assert.notEqual(payload.domain, "muncheye.com");
  assert.notEqual(payload.domain, "keto-skincare-lab");

  const skipped = marketplaceLaunchToSignalPayload(items[0]!);
  assert.equal(skipped.domain, null);

  console.log("muncheye parser tests passed");
}

main();
