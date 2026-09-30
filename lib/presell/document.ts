import { httpsUrl, type CopyLanguage, type PresellTemplate } from "@/lib/copy/pack";

export type PresellContent = {
  template: PresellTemplate;
  language: CopyLanguage;
  product: string;
  niche: string;
  whyRising: string;
  headline: string;
  body: string;
  longCopy: string;
  shortCopy: string;
  cta: string;
  mediaUrl: string;
  checkoutUrl: string;
};

const LABELS: Record<
  CopyLanguage,
  {
    why: string;
    market: string;
    offer: string;
    quiz: string;
    yes: string;
    no: string;
    footer: string;
    media: string;
  }
> = {
  pt: {
    why: "Por que isso está subindo",
    market: "O que o mercado está fazendo",
    offer: "Como posicionar a oferta",
    quiz: "Isso descreve o seu momento?",
    yes: "Sim, quero ver",
    no: "Ainda não",
    footer:
      "Página de pré-venda. Não promete renda nem resultado. O argumento de mercado veio dos dados do Radar.",
    media: "Espaço para imagem ou vídeo",
  },
  es: {
    why: "Por qué esto está subiendo",
    market: "Lo que el mercado está haciendo",
    offer: "Cómo posicionar la oferta",
    quiz: "¿Esto describe tu momento?",
    yes: "Sí, quiero ver",
    no: "Todavía no",
    footer:
      "Página de preventa. No promete ingresos ni resultados. El argumento de mercado salió de los datos del Radar.",
    media: "Espacio para imagen o video",
  },
  en: {
    why: "Why this is rising",
    market: "What the market is doing",
    offer: "How to position the offer",
    quiz: "Does this describe your moment?",
    yes: "Yes, show me",
    no: "Not yet",
    footer:
      "Presell page. It does not promise income or results. The market argument comes from Radar data.",
    media: "Space for an image or video",
  },
};

export function presellLabels(language: CopyLanguage) {
  return LABELS[language];
}

export function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return /^[\w-]{6,20}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v") ?? "";
      return /^[\w-]{6,20}$/.test(id) ? id : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function vimeoId(url: string) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.replace(/^www\./, "").endsWith("vimeo.com")) return null;
    const id = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    return /^\d{6,12}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function isFileVideo(url: string) {
  return /\.(mp4|webm)(\?|$)/i.test(url);
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mediaHtml(url: string, emptyLabel: string) {
  if (!url) {
    return `<div style="margin:20px 0;border:1px dashed #D4AF37;border-radius:12px;padding:28px;text-align:center;color:#8BA3B8;">${escapeHtml(emptyLabel)}</div>`;
  }
  const youtube = youtubeId(url);
  if (youtube) {
    return `<div style="margin:20px 0;position:relative;padding-top:56.25%;"><iframe src="https://www.youtube.com/embed/${youtube}" title="video" style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:12px;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  const vimeo = vimeoId(url);
  if (vimeo) {
    return `<div style="margin:20px 0;position:relative;padding-top:56.25%;"><iframe src="https://player.vimeo.com/video/${vimeo}" title="video" style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:12px;" allowfullscreen></iframe></div>`;
  }
  if (isFileVideo(url)) {
    return `<video controls src="${escapeHtml(url)}" style="width:100%;margin:20px 0;border-radius:12px;"></video>`;
  }
  return `<img src="${escapeHtml(url)}" alt="" style="width:100%;margin:20px 0;border-radius:12px;" />`;
}

function ctaHtml(labelText: string, checkoutUrl: string) {
  const label = escapeHtml(labelText);
  if (checkoutUrl) {
    return `<p style="margin:28px 0 0;"><a href="${escapeHtml(checkoutUrl)}" style="display:inline-block;background:#D4AF37;color:#0B1C33;font-weight:700;text-decoration:none;padding:12px 18px;border-radius:8px;">${label}</a></p>`;
  }
  return `<p style="margin:28px 0 0;"><span style="display:inline-block;background:#D4AF37;color:#0B1C33;font-weight:700;padding:12px 18px;border-radius:8px;">${label}</span></p>`;
}

export function renderPresellHtml(content: PresellContent) {
  const labels = presellLabels(content.language);
  const safeMedia = httpsUrl(content.mediaUrl);
  const safeCheckout = httpsUrl(content.checkoutUrl);
  const headline = escapeHtml(content.headline);
  const niche = escapeHtml(content.niche);
  const why = escapeHtml(content.whyRising);
  const body = escapeHtml(content.body);
  const longCopy = escapeHtml(content.longCopy);
  const shortCopy = escapeHtml(content.shortCopy);
  const media = mediaHtml(safeMedia, labels.media);
  const cta = ctaHtml(content.cta, safeCheckout);

  let main = "";
  if (content.template === "vsl") {
    main = `<p style="color:#D4AF37;font-size:13px;letter-spacing:.04em;text-transform:uppercase;">${niche}</p><h1 style="font-size:32px;line-height:1.2;margin:8px 0 0;">${headline}</h1>${media}<p style="white-space:pre-wrap;line-height:1.6;">${longCopy}</p>${cta}`;
  } else if (content.template === "quiz") {
    main = `<p style="color:#D4AF37;font-size:13px;letter-spacing:.04em;text-transform:uppercase;">${escapeHtml(labels.quiz)}</p><h1 style="font-size:32px;line-height:1.2;margin:8px 0 0;">${headline}</h1><p style="line-height:1.6;">${body}</p><details style="margin-top:16px;border:1px solid rgba(212,175,55,.35);border-radius:12px;padding:14px;"><summary style="cursor:pointer;color:#D4AF37;font-weight:700;">${escapeHtml(labels.yes)}</summary><p style="white-space:pre-wrap;line-height:1.6;">${longCopy}</p>${cta}</details><p style="margin-top:12px;color:#8BA3B8;">${escapeHtml(labels.no)}</p>`;
  } else if (content.template === "comparison") {
    main = `<h1 style="font-size:32px;line-height:1.2;margin:0;">${headline}</h1><div style="display:grid;gap:12px;margin-top:20px;"><section style="border:1px solid rgba(0,194,203,.25);border-radius:12px;padding:16px;"><h2 style="color:#D4AF37;font-size:14px;margin:0 0 8px;">${escapeHtml(labels.market)}</h2><p style="margin:0;line-height:1.6;">${why || shortCopy}</p></section><section style="border:1px solid rgba(212,175,55,.35);border-radius:12px;padding:16px;"><h2 style="color:#D4AF37;font-size:14px;margin:0 0 8px;">${escapeHtml(labels.offer)}</h2><p style="margin:0;white-space:pre-wrap;line-height:1.6;">${longCopy}</p></section></div>${media}${cta}`;
  } else {
    main = `<p style="color:#D4AF37;font-size:13px;letter-spacing:.04em;text-transform:uppercase;">${niche}</p><h1 style="font-size:32px;line-height:1.2;margin:8px 0 0;">${headline}</h1>${why ? `<h2 style="color:#D4AF37;font-size:16px;margin:24px 0 8px;">${escapeHtml(labels.why)}</h2><p style="line-height:1.6;">${why}</p>` : ""}<p style="white-space:pre-wrap;line-height:1.6;">${longCopy || body}</p>${media}${cta}`;
  }

  return `<!DOCTYPE html><html lang="${content.language}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/><title>${headline}</title></head><body style="margin:0;background:#0B1C33;color:#F5F7FA;font-family:Georgia,serif;"><main style="max-width:720px;margin:0 auto;padding:40px 20px 64px;">${main}<p style="margin-top:40px;font-family:sans-serif;font-size:12px;line-height:1.5;color:#8BA3B8;">${escapeHtml(labels.footer)}</p></main></body></html>`;
}
