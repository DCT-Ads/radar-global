import assert from "node:assert/strict";
import {
  cleanPublicName,
  decodeHtmlEntities,
  distinctPublicName,
  publicNameToSave,
} from "@/lib/text/public-name";

function main() {
  assert.equal(decodeHtmlEntities("A &#8211; B"), "A – B");
  assert.equal(decodeHtmlEntities("A &#x2013; B"), "A – B");
  assert.equal(decodeHtmlEntities("Tom &amp; Jerry"), "Tom & Jerry");

  assert.equal(
    cleanPublicName("SkinCare Headquarters &#8211; SkinCare Headquarters"),
    "SkinCare Headquarters",
  );
  assert.equal(
    cleanPublicName("Loja X – Cosméticos Naturais"),
    "Loja X – Cosméticos Naturais",
  );
  assert.equal(cleanPublicName("  Foo   Bar  "), "Foo Bar");
  assert.equal(cleanPublicName(null), "");
  assert.equal(cleanPublicName(undefined), "");
  assert.equal(cleanPublicName(""), "");
  assert.equal(cleanPublicName("Marca | Marca"), "Marca");
  assert.equal(
    publicNameToSave("SkinCare Headquarters &#8211; SkinCare Headquarters"),
    "SkinCare Headquarters",
  );
  assert.equal(publicNameToSave("   "), null);
  assert.equal(
    distinctPublicName("SkinCare Headquarters", "skincarehq.com.ng"),
    "SkinCare Headquarters",
  );
  assert.equal(distinctPublicName("skincarehq.com.ng", "skincarehq.com.ng"), null);
  assert.equal(distinctPublicName("skincarehq", "skincarehq.com.ng"), null);
  assert.equal(distinctPublicName("Just a moment...", "curso.com"), null);

  console.log("public-name tests passed");
}

main();
