import assert from "node:assert/strict";
import { inspectParking, isParked, THIN_BODY_MIN_CHARS } from "./anti-parking";

const REAL_BODY = `
<html><head><title>LiteFinance — TOP Forex Broker in the market</title></head>
<body>
  <h1>LiteFinance</h1>
  <p>Trading accounts, spreads and platforms for forex and CFDs since 2005.</p>
  <p>Open an account, fund with a card or wallet, and follow live market analysis from the desk.</p>
  <p>Education, risk tools and 24/7 support for clients who want a real brokerage product with live markets.</p>
</body></html>
`;

function main() {
  const sale = {
    title: "keto--chef.com - Buy this domain",
    bodySnippet: "<html><body>This domain is for sale at SedoParking. Buy this domain today.</body></html>",
  };
  assert.equal(isParked(sale), true, "sale page must be parked");
  assert.match(inspectParking(sale).reason ?? "", /phrase=/);

  const real = {
    title: "LiteFinance — TOP Forex Broker in the market",
    bodySnippet: REAL_BODY,
  };
  assert.equal(isParked(real), false, "real titled page must not be parked");
  assert.equal(inspectParking(real).reason, null);

  const empty = { title: "Maybe a product", bodySnippet: "" };
  assert.equal(isParked(empty), true, "empty/short body must be parked");
  assert.match(inspectParking(empty).reason ?? "", /thin|no-title/);

  const short = { title: "Product", bodySnippet: "<p>Hi</p>" };
  assert.equal(isParked(short), true, "short body must be parked");
  assert.ok(THIN_BODY_MIN_CHARS >= 200);

  const comingSoon = {
    title: "Coming Soon",
    bodySnippet: REAL_BODY.replace("LiteFinance", "Coming Soon launch page"),
  };
  assert.equal(isParked(comingSoon), true, "coming soon must be parked");
  assert.equal(inspectParking(comingSoon).reason, 'phrase="coming soon"');

  const noTitle = { title: "   ", bodySnippet: REAL_BODY };
  assert.equal(isParked(noTitle), true, "empty title must be parked");
  assert.equal(inspectParking(noTitle).reason, "no-title");

  console.log("anti-parking.test.ts ok");
}

main();
