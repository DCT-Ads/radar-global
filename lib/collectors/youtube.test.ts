import assert from "node:assert/strict";
import { parseYoutubeHits } from "./youtube";

const mixed = {
  items: [
    {
      id: { videoId: "keep-keto-1" },
      snippet: {
        title: "7-day keto meal plan",
        description: "Low carb recipes",
        channelTitle: "Health",
        publishedAt: "2026-09-01T00:00:00Z",
      },
    },
    {
      id: { videoId: "drop-worship" },
      snippet: {
        title: "Passando Pela Prova | Get Worship (Clipe Oficial)",
        description: "Clipe oficial",
        channelTitle: "Gospel",
        publishedAt: "2026-09-01T00:00:00Z",
      },
    },
  ],
};

const parsed = parseYoutubeHits(mixed, ["keto", "cbd"], 10);
assert.equal(parsed.stats.fetched, 2);
assert.equal(parsed.stats.keywordMiss, 1);
assert.equal(parsed.stats.kept, 1);
assert.equal(parsed.hits[0]?.videoId, "keep-keto-1");

const searched = parseYoutubeHits(mixed, ["keto"], 10, "keto");
assert.equal(searched.stats.kept, 1);
assert.equal(searched.hits[0]?.videoId, "keep-keto-1");

console.log("youtube parser ok");
