import assert from "node:assert/strict";
import {
  CONTACT_SCORE_WEIGHTS,
  contactScoreOf,
  extractProducerContact,
  isPublicProducerEmail,
  normalizeFacebook,
  normalizeInstagram,
  normalizeLinkedin,
  normalizeX,
  normalizeYoutube,
} from "@/lib/producers/contact";

function main() {
  assert.equal(isPublicProducerEmail("hello@curso.com"), true);
  assert.equal(isPublicProducerEmail("proxy@whoisguard.com"), false);
  assert.equal(normalizeInstagram("https://www.instagram.com/radar.global"), "radar.global");
  assert.equal(normalizeInstagram("https://instagram.com/p/abc"), null);
  assert.equal(normalizeLinkedin("https://www.linkedin.com/in/doug-begui"), "in/doug-begui");
  assert.equal(normalizeYoutube("https://youtube.com/@novaoferta"), "@novaoferta");
  assert.equal(normalizeYoutube("https://youtube.com/watch?v=abc123"), null);
  assert.equal(normalizeFacebook("https://facebook.com/novaoferta"), "novaoferta");
  assert.equal(normalizeFacebook("https://facebook.com/watch"), null);
  assert.equal(normalizeX("https://x.com/radar_global"), "radar_global");
  assert.equal(normalizeX("https://twitter.com/intent/tweet"), null);

  const empty = extractProducerContact([]);
  assert.deepEqual(empty, {
    email: null,
    instagram: null,
    youtube: null,
    facebook: null,
    linkedin: null,
    x: null,
    companyName: null,
    contactScore: 0,
  });

  const found = extractProducerContact([
    {
      url: "https://instagram.com/novaoferta",
      snippet: "Fale: contato@novaoferta.com https://linkedin.com/in/novaoferta",
      raw: {
        companyName: "Nova Oferta Ltda",
        youtube: "https://youtube.com/@novaoferta",
        facebook: "https://facebook.com/novaoferta",
        x: "https://x.com/novaoferta",
      },
    },
  ]);
  assert.equal(found.email, "contato@novaoferta.com");
  assert.equal(found.instagram, "novaoferta");
  assert.equal(found.linkedin, "in/novaoferta");
  assert.equal(found.youtube, "@novaoferta");
  assert.equal(found.facebook, "novaoferta");
  assert.equal(found.x, "novaoferta");
  assert.equal(found.companyName, "Nova Oferta Ltda");
  assert.equal(found.contactScore, 100);

  const youtubeChannel = extractProducerContact([
    {
      name: "Finance Lab",
      domain: "youtube.com",
      raw: { channelTitle: "Finance Lab", title: "Day Trading crypto live" },
      url: "https://www.youtube.com/watch?v=abc",
    },
  ]);
  assert.equal(youtubeChannel.companyName, "Finance Lab");
  assert.equal(youtubeChannel.youtube, null);

  const privacy = extractProducerContact([
    { snippet: "Registrant: privacy@withheldforprivacy.com" },
  ]);
  assert.equal(privacy.email, null);
  assert.equal(privacy.contactScore, 0);

  assert.equal(
    contactScoreOf({
      email: "a@b.com",
      instagram: null,
      youtube: null,
      facebook: null,
      linkedin: null,
      x: null,
      companyName: null,
    }),
    CONTACT_SCORE_WEIGHTS.email,
  );

  console.log("producer-contact tests passed");
}

main();
