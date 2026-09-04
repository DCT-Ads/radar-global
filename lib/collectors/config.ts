import { z } from "zod";

export const crtshConfigSchema = z.object({
  keywords: z.array(z.string().trim().min(2)).min(1),
  maxAgeDays: z.number().int().min(1).max(90).default(30),
  maxDomainsPerKeyword: z.number().int().min(1).max(100).default(15),
  maxDomainsPerRun: z.number().int().min(1).max(200).default(40),
});

export type CrtshConfig = z.infer<typeof crtshConfigSchema>;

export const DEFAULT_CRTSH_CONFIG: CrtshConfig = {
  keywords: ["keto", "weightloss", "skincare", "cbd"],
  maxAgeDays: 30,
  maxDomainsPerKeyword: 15,
  maxDomainsPerRun: 40,
};

export function parseCrtshConfig(raw: unknown): CrtshConfig {
  const parsed = crtshConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_CRTSH_CONFIG;
}
