import assert from "node:assert/strict";
import { discoverDomainsFromEntries, type CrtshEntry } from "./crtsh";

const now = new Date();
const fresh = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
const old = new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000).toISOString();

const entries: CrtshEntry[] = [
  {
    id: 1,
    issuer_name: "Let's Encrypt",
    common_name: "getketooffer.com",
    name_value: "getketooffer.com\nwww.getketooffer.com\ncheckout.getketooffer.com",
    entry_timestamp: fresh,
    not_before: fresh,
    not_after: fresh,
  },
  {
    id: 2,
    issuer_name: "Let's Encrypt",
    common_name: "oldketo.com",
    name_value: "oldketo.com",
    entry_timestamp: old,
    not_before: old,
    not_after: old,
  },
  {
    id: 3,
    issuer_name: "Let's Encrypt",
    common_name: "unrelated-shop.com",
    name_value: "unrelated-shop.com",
    entry_timestamp: fresh,
    not_before: fresh,
    not_after: fresh,
  },
];

const found = discoverDomainsFromEntries(entries, "keto", 30, 10);
assert.equal(found.length, 1);
assert.equal(found[0]?.domain, "getketooffer.com");
assert.equal(found[0]?.hasCheckoutSubdomain, true);
assert.ok(found[0] && found[0].ageDays < 30);

console.log("crtsh parser ok");
