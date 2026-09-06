import assert from "node:assert/strict";
import { launchIdentityFromSignal } from "@/lib/signals/launch-identity";

function baseSignal(
  overrides: Partial<Parameters<typeof launchIdentityFromSignal>[0]> = {},
) {
  return {
    source: "whoisds",
    value: "novo-curso.com",
    domain: "novo-curso.com",
    rawData: null,
    ...overrides,
  };
}

function main() {
  const domain = launchIdentityFromSignal(baseSignal({}));
  assert.equal(domain.launchDomain, "novo-curso.com");
  assert.equal(domain.producerDomain, "novo-curso.com");

  const youtube = launchIdentityFromSignal(
    baseSignal({
      source: "youtube",
      value: "abc123xyz",
      domain: "youtube.com",
      rawData: {
        title: "Day Trading crypto live",
        channelTitle: "Finance Lab",
      },
    }),
  );
  assert.equal(youtube.launchDomain, "youtube.com/watch?v=abc123xyz");
  assert.equal(youtube.launchTitle, "Day Trading crypto live");
  assert.equal(youtube.producerName, "Finance Lab");
  assert.equal(youtube.producerDomain, "youtube.com");

  console.log("review-identity tests passed");
}

main();
