import assert from "node:assert/strict";
import {
  firstMeaningfulWord,
  keywordFromText,
  matchesKeywordWord,
  nicheForKeyword,
  registrableName,
  titleSlug,
} from "./niches";

function main() {
  assert.equal(registrableName("muncheye:ketodrops.com"), "ketodrops");
  assert.equal(registrableName("sales.vjtechlabs.com"), "vjtechlabs");
  assert.equal(registrableName("https://localsitecreator.com/jv"), "localsitecreator");
  assert.equal(registrableName("foo.co.uk"), "foo");
  assert.equal(registrableName("muncheye.com"), null);

  assert.equal(titleSlug("Canva Paradise [PLR]"), "canva-paradise");
  assert.equal(firstMeaningfulWord("100 Confirmed Launch"), null);
  assert.equal(firstMeaningfulWord("Simple Click Tracker Pro"), "click");

  const local = keywordFromText(
    "Local Site Creator",
    "Chris Derenberger",
    "muncheye:localsitecreator.com",
  );
  assert.equal(local.keyword, "localsitecreator");
  assert.equal(local.source, "domain");
  assert.equal(local.kw_domain, "localsitecreator");
  assert.equal(local.kw_title, "local-site-creator");

  const placeholder = keywordFromText(
    "100 Confirmed Launch",
    "Pranshu Gupta",
    "dexraai.com",
  );
  assert.equal(placeholder.keyword, "dexraai");
  assert.equal(placeholder.source, "domain");
  assert.equal(placeholder.kw_title, "100-confirmed-launch");

  const tracker = keywordFromText(
    "Simple Click Tracker Pro",
    "Jen Perdew",
    "nams.ws",
  );
  assert.equal(tracker.keyword, "click");
  assert.equal(tracker.source, "title");
  assert.equal(tracker.kw_domain, "nams");
  assert.equal(tracker.kw_title, "simple-click-tracker-pro");

  const gumroad = keywordFromText(
    "Gumroad Engine",
    "Vijay Pratap Singh",
    "sales.vjtechlabs.com",
  );
  assert.equal(gumroad.keyword, "vjtechlabs");
  assert.equal(gumroad.source, "domain");

  const keto = keywordFromText("Keto Skincare Lab", "Jane Doe");
  assert.equal(keto.keyword, "keto");
  assert.equal(keto.source, "list");
  assert.equal(keto.niche, "health");
  assert.equal(keto.kw_title, "keto-skincare-lab");

  const plr = keywordFromText(
    "Canva Paradise [PLR]",
    "Azam Dzulfikar",
    "plrsuperseller.com",
  );
  assert.equal(plr.keyword, "plr");
  assert.equal(plr.source, "list");
  assert.equal(plr.kw_domain, "plrsuperseller");
  assert.equal(plr.kw_title, "canva-paradise");

  const teelab = keywordFromText(
    "TeeLab AI - AI Editable Designs",
    "Ariel Sanders",
    "teelab.io",
  );
  assert.equal(teelab.keyword, "teelab");
  assert.equal(teelab.source, "domain");

  const pages = keywordFromText(
    "New AI Software — April 2027",
    "Andrew Darius",
    "new-ai-software-apr-2027.pages.dev",
  );
  assert.notEqual(pages.keyword, "pages");
  assert.notEqual(pages.keyword, "ai");

  const bigSoftware = keywordFromText(
    "Big Software with Eric Holmlund",
    "Firelaunchers",
    "firelaunchers.com",
  );
  assert.equal(bigSoftware.keyword, "firelaunchers");
  assert.equal(bigSoftware.source, "domain");

  assert.equal(registrableName("example.com"), "example");
  assert.equal(registrableName("foo.pages.dev"), "pages");

  const daily = keywordFromText("Daily Profit Tips", null, "example.com");
  assert.equal(daily.keyword, "example");
  assert.equal(daily.source, "domain");

  assert.equal(nicheForKeyword("cbd"), "health");
  assert.equal(matchesKeywordWord("Get Worship (Clipe Oficial)", "cbd"), false);
  assert.equal(matchesKeywordWord("Best CBD gummies 2026", "cbd"), true);

  console.log("niches keyword tests passed");
}

main();
