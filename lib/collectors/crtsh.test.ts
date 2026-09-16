import assert from "node:assert/strict";
import { discoverDomainsFromEntries, type CrtshEntry } from "./crtsh";

const now = new Date();
const fresh = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
const forty = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();
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

const found = discoverDomainsFromEntries(entries, "keto", 60, 10);
assert.equal(found.domains.length, 1);
assert.equal(found.domains[0]?.domain, "getketooffer.com");
assert.equal(found.domains[0]?.hasCheckoutSubdomain, true);
assert.ok(found.domains[0] && found.domains[0].ageDays < 60);
assert.equal(found.stats.tooOld, 1);
assert.equal(found.stats.kept, 1);

const hostnameOnly: CrtshEntry[] = [
  {
    id: 4,
    issuer_name: "Let's Encrypt",
    common_name: "weightloss--dev.acme.arphub.io",
    name_value: "weightloss--dev.acme.arphub.io",
    entry_timestamp: fresh,
    not_before: fresh,
    not_after: fresh,
  },
];
const hostHit = discoverDomainsFromEntries(hostnameOnly, "weightloss", 60, 10);
assert.equal(hostHit.domains.length, 1);
assert.equal(hostHit.domains[0]?.domain, "weightloss--dev.acme.arphub.io");
assert.equal(hostHit.stats.apexMiss, 1);

const agedChef: CrtshEntry[] = [
  {
    id: 5,
    issuer_name: "Let's Encrypt",
    common_name: "login.keto--chef.store",
    name_value: "login.keto--chef.store",
    entry_timestamp: forty,
    not_before: forty,
    not_after: forty,
  },
];
const chef = discoverDomainsFromEntries(agedChef, "keto", 60, 10);
assert.equal(chef.domains.length, 1);
assert.equal(chef.domains[0]?.domain, "keto--chef.store");
assert.equal(chef.stats.tooOld, 0);

console.log("crtsh parser ok");
