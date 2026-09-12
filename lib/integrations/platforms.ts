export const PLATFORM_IDS = [
  "digistore24",
  "hotmart",
  "monetizze",
  "kiwify",
  "baygood",
  "clickbank",
  "braip",
  "eduzz",
] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];
export type PlatformAuth = "apikey" | "oauth2" | "dualkey" | "bearer";
export type PlatformField =
  | "apiKey"
  | "clientId"
  | "clientSecret"
  | "basicToken"
  | "devApiKey"
  | "clerkApiKey"
  | "apiToken"
  | "publicKey";

export type PlatformConfig = {
  id: PlatformId;
  fields: PlatformField[];
  auth: PlatformAuth;
  optionalFields?: PlatformField[];
};

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  digistore24: { id: "digistore24", fields: ["apiKey"], auth: "apikey" },
  hotmart: {
    id: "hotmart",
    fields: ["clientId", "clientSecret", "basicToken"],
    auth: "oauth2",
    optionalFields: ["basicToken"],
  },
  monetizze: { id: "monetizze", fields: ["apiKey"], auth: "apikey" },
  kiwify: { id: "kiwify", fields: ["clientId", "clientSecret"], auth: "oauth2" },
  baygood: { id: "baygood", fields: ["apiKey"], auth: "apikey" },
  clickbank: {
    id: "clickbank",
    fields: ["devApiKey", "clerkApiKey"],
    auth: "dualkey",
  },
  braip: { id: "braip", fields: ["apiToken"], auth: "bearer" },
  eduzz: { id: "eduzz", fields: ["publicKey", "apiKey"], auth: "oauth2" },
};

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  digistore24: "Digistore24",
  hotmart: "Hotmart",
  monetizze: "Monetizze",
  kiwify: "Kiwify",
  baygood: "Baygood",
  clickbank: "ClickBank",
  braip: "Braip",
  eduzz: "Eduzz",
};

export function isPlatformId(value: string): value is PlatformId {
  return PLATFORM_IDS.includes(value as PlatformId);
}

export function requiredFields(platform: PlatformId): PlatformField[] {
  const cfg = PLATFORMS[platform];
  const optional = new Set(cfg.optionalFields ?? []);
  return cfg.fields.filter((field) => !optional.has(field));
}
