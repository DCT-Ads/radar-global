export const NRD_SOURCE = "whoisds";

export type NrdHit = {
  domain: string;
  keyword: string;
  niche: string;
  listDate: string;
  /** WHOIS/RDAP Creation Date only. Never the WhoisDS list day. */
  registeredAt?: Date | null;
};
