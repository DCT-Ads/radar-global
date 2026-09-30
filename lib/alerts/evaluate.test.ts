import assert from "node:assert/strict";
import { draftsForWatch, quietDue, relatedDraft, shouldSendQuietDigest, zonedClock } from "@/lib/alerts/evaluate";

function main() {
  const base = {
    launchId: "l1",
    title: "Oferta",
    niche: "Foco",
    saturation: "SAFE" as const,
    earlySignal: 40,
    lastSaturation: null,
    lastEarlySignal: null,
  };
  assert.equal(draftsForWatch(base, "ALL", "pt").length, 0);

  const stage = draftsForWatch(
    { ...base, lastSaturation: "WARNING", lastEarlySignal: 40, saturation: "SAFE" },
    "ALL",
    "pt",
  );
  assert.equal(stage.length, 1);
  assert.equal(stage[0].kind, "stage");
  assert.match(stage[0].body, /Moderado → Hot/);

  const ignored = draftsForWatch(
    { ...base, lastSaturation: "SAFE", lastEarlySignal: 40, saturation: "SATURATED" },
    "HOT_ONLY",
    "pt",
  );
  assert.equal(ignored.length, 0);

  const intoHot = draftsForWatch(
    { ...base, lastSaturation: "WARNING", lastEarlySignal: 20, saturation: "SAFE", earlySignal: 20 },
    "HOT_ONLY",
    "en",
  );
  assert.equal(intoHot[0]?.kind, "stage");

  const growth = draftsForWatch(
    { ...base, lastSaturation: "SAFE", lastEarlySignal: 20, earlySignal: 40, saturation: "SAFE" },
    "ALL",
    "pt",
  );
  assert.ok(growth.some((item) => item.kind === "growth" && item.body.includes("100%")));

  const small = draftsForWatch(
    { ...base, lastSaturation: "SAFE", lastEarlySignal: 40, earlySignal: 44, saturation: "SAFE" },
    "ALL",
    "pt",
  );
  assert.equal(small.length, 0);

  const related = relatedDraft({ launchId: "l2", title: "Novo", niche: "Foco", locale: "pt" });
  assert.equal(related.dedupeKey, "related:l2");

  const clock = zonedClock(new Date("2026-09-30T11:00:00.000Z"), "America/Sao_Paulo");
  assert.equal(clock.hour, 8);
  assert.equal(clock.dayKey, "2026-09-30");

  assert.equal(quietDue(null, new Date("2026-09-30T00:00:00.000Z")), true);
  assert.equal(
    quietDue(new Date("2026-09-28T00:00:00.000Z"), new Date("2026-09-30T00:00:00.000Z")),
    false,
  );
  assert.equal(
    quietDue(new Date("2026-09-01T00:00:00.000Z"), new Date("2026-09-30T00:00:00.000Z")),
    true,
  );

  assert.equal(
    shouldSendQuietDigest({
      premium: false,
      digestEnabled: true,
      hasNews: false,
      quietIsDue: true,
    }),
    false,
  );
  assert.equal(
    shouldSendQuietDigest({
      premium: true,
      digestEnabled: true,
      hasNews: false,
      quietIsDue: true,
    }),
    true,
  );
  assert.equal(
    shouldSendQuietDigest({
      premium: true,
      digestEnabled: true,
      hasNews: true,
      quietIsDue: true,
    }),
    false,
  );
  assert.equal(
    shouldSendQuietDigest({
      premium: true,
      digestEnabled: false,
      hasNews: false,
      quietIsDue: true,
    }),
    false,
  );
  assert.equal(
    shouldSendQuietDigest({
      premium: true,
      digestEnabled: true,
      hasNews: false,
      quietIsDue: false,
    }),
    false,
  );

  console.log("alerts evaluate ok");
}

main();
