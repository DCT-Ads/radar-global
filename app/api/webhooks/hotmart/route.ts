import { NextResponse } from "next/server";
import { fulfillHotmartPurchase } from "@/lib/hotmart/fulfill";
import { extractHottok, hotmartTokensMatch, parseHotmartBody } from "@/lib/hotmart/webhook";

export async function POST(request: Request) {
  const expected = process.env.HOTMART_HOTTOK?.trim() || "";
  if (!expected) {
    console.error("[hotmart-webhook] HOTMART_HOTTOK is not set");
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const body = await readBody(request);
  const received = extractHottok(request.headers.get("x-hotmart-hottok"), body);
  if (!hotmartTokensMatch(received, expected)) {
    console.warn("[hotmart-webhook] rejected", { reason: "invalid_hottok" });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const purchase = parseHotmartBody(body);
  if (!purchase) {
    console.info("[hotmart-webhook]", { action: "ignored", reason: "unparsed" });
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const result = await fulfillHotmartPurchase(purchase);
    console.info("[hotmart-webhook]", result);
    return NextResponse.json({ ok: true, action: result.action });
  } catch (error) {
    console.error("[hotmart-webhook] fulfill failed", {
      event: purchase.event,
      email: purchase.email,
      offer: purchase.offerCode,
      transaction: purchase.transaction,
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "fulfill_failed" }, { status: 500 });
  }
}

async function readBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") || "";
  const text = await request.text();
  if (!text.trim()) {
    return {};
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(text));
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return Object.fromEntries(new URLSearchParams(text));
  }
}
