/**
 * Decodifica entidades HTML e limpa nomes públicos vindos de <title>,
 * removendo duplicação de marca (ex: "Foo – Foo" -> "Foo").
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  ndash: "–",
  mdash: "—",
  nbsp: " ",
  hellip: "…",
};

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => {
      const key = name.toLowerCase();
      return key in NAMED_ENTITIES ? NAMED_ENTITIES[key] : match;
    });
}

/** Separadores comuns em títulos: traços, pipe, dois-pontos, bullet. */
const TITLE_SEPARATORS = /\s+[–—\-|:•·]\s+/;

export function cleanPublicName(value: string | null | undefined): string {
  if (!value) return "";

  const decoded = decodeHtmlEntities(value).replace(/\s+/g, " ").trim();

  const parts = decoded
    .split(TITLE_SEPARATORS)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) return decoded;

  // Remove partes consecutivas duplicadas (case-insensitive).
  const deduped: string[] = [];
  for (const part of parts) {
    const last = deduped[deduped.length - 1];
    if (!last || last.toLowerCase() !== part.toLowerCase()) {
      deduped.push(part);
    }
  }

  // Se sobrou marca única repetida em tudo, retorna ela.
  if (deduped.length === 1) return deduped[0];

  return deduped.join(" – ");
}

const JUNK_PUBLIC_NAME =
  /^(home|welcome|index|untitled|just a moment(\.\.\.)?|attention required!?|access denied|403|404|error)$/i;

export function publicNameToSave(value: string | null | undefined): string | null {
  const cleaned = cleanPublicName(value);
  return cleaned || null;
}

export function isDomainLikePublicName(name: string, domain: string) {
  const normalized = name.toLowerCase().trim();
  const host = domain.toLowerCase().replace(/^www\./, "");
  const stem = host.split(".")[0] ?? "";
  return (
    normalized === host ||
    normalized === `www.${host}` ||
    normalized === stem ||
    normalized === domain.toLowerCase()
  );
}

/** Nome público limpo, ou null se vazio / só o domínio. */
export function distinctPublicName(
  value: string | null | undefined,
  domain: string,
): string | null {
  const cleaned = publicNameToSave(value);
  if (!cleaned || isDomainLikePublicName(cleaned, domain)) {
    return null;
  }
  if (cleaned.length < 2 || cleaned.length > 160 || JUNK_PUBLIC_NAME.test(cleaned)) {
    return null;
  }
  return cleaned;
}
