import { createHash, timingSafeEqual } from "node:crypto";
import type { AccessPlan } from "@prisma/client";

export type HotmartAction = "grant" | "revoke" | "ignore";

export type HotmartPurchase = {
  event: string;
  action: HotmartAction;
  email: string;
  name: string;
  offerCode: string;
  transaction: string;
  currency: string;
  approvedAt: Date | null;
  nextChargeAt: Date | null;
};

const GRANT_EVENTS = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "approved", "completed"]);

const REVOKE_EVENTS = new Set([
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_CANCELED",
  "PURCHASE_PROTEST",
  "SUBSCRIPTION_CANCELLATION",
  "refunded",
  "chargeback",
  "canceled",
  "cancelled",
  "dispute",
]);

/** Códigos de oferta já usados nos checkouts deste produto. */
const OFFERS: Record<string, { plan: AccessPlan; months: number }> = {
  oc5d4edg: { plan: "STANDARD", months: 1 },
  s96p6m7e: { plan: "STANDARD", months: 12 },
  vzd6xfcl: { plan: "PREMIUM", months: 1 },
  b8flpvap: { plan: "PREMIUM", months: 12 },
  i148m1: { plan: "PREMIUM", months: 12 },
};

export function hotmartTokensMatch(received: string, expected: string) {
  if (!received || !expected) {
    return false;
  }
  const left = createHash("sha256").update(received).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function extractHottok(headerToken: string | null, body: unknown) {
  const header = headerToken?.trim() || "";
  if (header) {
    return header;
  }
  if (isRecord(body) && typeof body.hottok === "string") {
    return body.hottok.trim();
  }
  return "";
}

export function parseHotmartBody(body: unknown): HotmartPurchase | null {
  if (!isRecord(body)) {
    return null;
  }

  if (isRecord(body.data)) {
    return parseWebhookV2(body);
  }

  return parseLegacyPostback(body);
}

export function planForOffer(offerCode: string): { plan: AccessPlan; months: number; known: boolean } {
  const known = OFFERS[offerCode.toLowerCase()];
  if (known) {
    return { ...known, known: true };
  }
  return { plan: "STANDARD", months: 1, known: false };
}

export function accessLocale(currency: string) {
  const code = currency.trim().toUpperCase();
  if (code === "BRL") {
    return "pt";
  }
  if (code === "EUR") {
    return "es";
  }
  return "en";
}

export function addUtcMonths(start: Date, months: number) {
  const next = new Date(start.getTime());
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}

export function periodEnd(purchase: HotmartPurchase, months: number) {
  if (purchase.nextChargeAt) {
    return purchase.nextChargeAt;
  }
  return addUtcMonths(purchase.approvedAt ?? new Date(), months);
}

function parseWebhookV2(body: Record<string, unknown>): HotmartPurchase | null {
  const data = isRecord(body.data) ? body.data : null;
  if (!data) {
    return null;
  }
  const purchase = isRecord(data.purchase) ? data.purchase : {};
  const buyer = isRecord(data.buyer) ? data.buyer : {};
  const subscription = isRecord(data.subscription) ? data.subscription : {};
  const offer = isRecord(purchase.offer) ? purchase.offer : {};
  const price = isRecord(purchase.price) ? purchase.price : {};
  const event = stringValue(body.event);
  const email = stringValue(buyer.email).toLowerCase();
  if (!event || !email) {
    return null;
  }

  return {
    event,
    action: actionForEvent(event),
    email,
    name: stringValue(buyer.name),
    offerCode: stringValue(offer.code).toLowerCase(),
    transaction: stringValue(purchase.transaction),
    currency: stringValue(price.currency_value),
    approvedAt: parseEpoch(purchase.approved_date) ?? parseEpoch(purchase.order_date),
    nextChargeAt: parseEpoch(purchase.date_next_charge) ?? parseEpoch(subscription.date_next_charge),
  };
}

function parseLegacyPostback(body: Record<string, unknown>): HotmartPurchase | null {
  const event = (stringValue(body.event) || stringValue(body.status)).toLowerCase();
  const email = stringValue(body.email).toLowerCase();
  if (!event || !email) {
    return null;
  }
  const first = stringValue(body.first_name);
  const last = stringValue(body.last_name);
  const name = stringValue(body.name) || [first, last].filter(Boolean).join(" ");

  return {
    event,
    action: actionForEvent(event),
    email,
    name,
    offerCode: (stringValue(body.off) || stringValue(body.offer_code)).toLowerCase(),
    transaction: stringValue(body.transaction),
    currency: stringValue(body.currency),
    approvedAt: null,
    nextChargeAt: null,
  };
}

function actionForEvent(event: string): HotmartAction {
  const normalized = event.trim();
  const upper = normalized.toUpperCase();
  const lower = normalized.toLowerCase();
  if (GRANT_EVENTS.has(upper) || GRANT_EVENTS.has(lower)) {
    return "grant";
  }
  if (REVOKE_EVENTS.has(upper) || REVOKE_EVENTS.has(lower)) {
    return "revoke";
  }
  return "ignore";
}

function parseEpoch(value: unknown): Date | null {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : null;
  if (numeric == null || !Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  const ms = numeric < 1e12 ? numeric * 1000 : numeric;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
