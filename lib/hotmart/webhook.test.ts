import assert from "node:assert/strict";
import {
  accessLocale,
  addUtcMonths,
  extractHottok,
  hotmartTokensMatch,
  parseHotmartBody,
  planForOffer,
} from "@/lib/hotmart/webhook";

function main() {
  assert.equal(hotmartTokensMatch("secret-token", "secret-token"), true);
  assert.equal(hotmartTokensMatch("secret-token", "other-token"), false);
  assert.equal(hotmartTokensMatch("", "secret-token"), false);

  assert.equal(extractHottok(" header-token ", {}), "header-token");
  assert.equal(extractHottok(null, { hottok: " body-token " }), "body-token");
  assert.equal(extractHottok("header", { hottok: "body" }), "header");

  const approved = parseHotmartBody({
    event: "PURCHASE_APPROVED",
    data: {
      buyer: { email: "Buyer@Example.com", name: "Ada Lovelace" },
      purchase: {
        transaction: "HP123",
        approved_date: 1_700_000_000_000,
        offer: { code: "s96p6m7e" },
        price: { currency_value: "EUR" },
        date_next_charge: 1_731_000_000_000,
      },
    },
  });
  assert.ok(approved);
  assert.equal(approved.action, "grant");
  assert.equal(approved.email, "buyer@example.com");
  assert.equal(approved.offerCode, "s96p6m7e");
  assert.equal(approved.currency, "EUR");
  assert.equal(approved.transaction, "HP123");
  assert.ok(approved.nextChargeAt);

  const refunded = parseHotmartBody({
    event: "PURCHASE_REFUNDED",
    data: { buyer: { email: "buyer@example.com" }, purchase: { offer: { code: "oc5d4edg" } } },
  });
  assert.equal(refunded?.action, "revoke");

  const delayed = parseHotmartBody({
    event: "PURCHASE_DELAYED",
    data: { buyer: { email: "buyer@example.com" }, purchase: {} },
  });
  assert.equal(delayed?.action, "ignore");

  const legacy = parseHotmartBody({
    hottok: "x",
    status: "approved",
    email: "legacy@example.com",
    name: "Legacy Buyer",
    off: "oc5d4edg",
    transaction: "HP999",
    currency: "EUR",
  });
  assert.equal(legacy?.action, "grant");
  assert.equal(legacy?.offerCode, "oc5d4edg");

  assert.deepEqual(planForOffer("s96p6m7e"), { plan: "STANDARD", months: 12, known: true });
  assert.deepEqual(planForOffer("vzd6xfcl"), { plan: "PREMIUM", months: 1, known: true });
  assert.deepEqual(planForOffer("unknown"), { plan: "STANDARD", months: 1, known: false });

  assert.equal(accessLocale("eur"), "es");
  assert.equal(accessLocale("BRL"), "pt");
  assert.equal(accessLocale("USD"), "en");

  const end = addUtcMonths(new Date("2026-01-31T00:00:00.000Z"), 1);
  assert.equal(end.toISOString(), "2026-02-28T00:00:00.000Z");

  console.log("hotmart webhook ok");
}

main();
