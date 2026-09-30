"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { PresellView } from "@/components/presell/presell-view";
import type { SalesAssetDto } from "@/lib/copy/asset-dto";
import {
  PRESELL_TEMPLATES,
  type CopyLanguage,
  type CopyPack,
  type PresellTemplate,
} from "@/lib/copy/pack";
import { ALL_OPPORTUNITY_FORMATS } from "@/lib/data/opportunity-categories";
import { renderPresellHtml, type PresellContent } from "@/lib/presell/document";

const fieldClass =
  "w-full rounded-lg border border-[#D4AF37]/30 bg-[#0B1A2F] px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none";

const MARKETS = ["", "US", "UK", "AU", "BR"] as const;

function errorText(
  code: string,
  t: (key: "noKey" | "missingFields" | "upgrade" | "genericError") => string,
) {
  if (code === "NO_KEY") return t("noKey");
  if (code === "MISSING") return t("missingFields");
  if (code === "UPGRADE_REQUIRED") return t("upgrade");
  return t("genericError");
}

async function readError(res: Response, fallback: string) {
  const data: unknown = await res.json().catch(() => null);
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  return fallback;
}

export function CopyGenerator() {
  const t = useTranslations("copy");
  const formats = useTranslations("momentum.formats");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"generate" | "library">("generate");
  const [product, setProduct] = useState(searchParams.get("produto")?.trim() ?? "");
  const [niche, setNiche] = useState(searchParams.get("nicho")?.trim() ?? "");
  const [market, setMarket] = useState(searchParams.get("market")?.trim() ?? "");
  const [stage, setStage] = useState(searchParams.get("stage")?.trim() ?? "");
  const [why, setWhy] = useState(searchParams.get("why")?.trim() ?? "");
  const [format, setFormat] = useState(searchParams.get("format")?.trim() ?? "");
  const [pack, setPack] = useState<CopyPack | null>(null);
  const [headlines, setHeadlines] = useState<string[]>(["", "", ""]);
  const [body, setBody] = useState("");
  const [ctas, setCtas] = useState<string[]>(["", "", ""]);
  const [shortCopy, setShortCopy] = useState("");
  const [longCopy, setLongCopy] = useState("");
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [ctaIndex, setCtaIndex] = useState(0);
  const [template, setTemplate] = useState<PresellTemplate>("blog");
  const [mediaUrl, setMediaUrl] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [assetId, setAssetId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [published, setPublished] = useState(false);
  const [library, setLibrary] = useState<SalesAssetDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const produto = searchParams.get("produto")?.trim();
    const nicho = searchParams.get("nicho")?.trim();
    if (produto) setProduct(produto);
    if (nicho) setNiche(nicho);
    const nextWhy = searchParams.get("why")?.trim();
    const nextMarket = searchParams.get("market")?.trim();
    const nextStage = searchParams.get("stage")?.trim();
    const nextFormat = searchParams.get("format")?.trim();
    if (nextWhy) setWhy(nextWhy);
    if (nextMarket) setMarket(nextMarket);
    if (nextStage) setStage(nextStage);
    if (nextFormat) setFormat(nextFormat);
  }, [searchParams]);

  useEffect(() => {
    void loadLibrary();
  }, []);

  function applyAsset(asset: SalesAssetDto) {
    setTab("generate");
    setAssetId(asset.id);
    setSlug(asset.slug);
    setPublished(asset.published);
    setProduct(asset.product);
    setNiche(asset.niche);
    setMarket(asset.market);
    setStage(asset.stage);
    setWhy(asset.whyRising);
    setFormat(asset.format);
    setHeadlines(asset.headlines.length >= 3 ? asset.headlines.slice(0, 3) : ["", "", ""]);
    setBody(asset.body);
    setCtas(asset.ctas.length >= 3 ? asset.ctas.slice(0, 3) : ["", "", ""]);
    setShortCopy(asset.shortCopy);
    setLongCopy(asset.longCopy);
    setHeadlineIndex(asset.headlineIndex);
    setCtaIndex(asset.ctaIndex);
    setTemplate(asset.template ?? "blog");
    setMediaUrl(asset.mediaUrl);
    setCheckoutUrl(asset.checkoutUrl);
    setPack({
      language: asset.language,
      framework: asset.framework,
      headlines: [
        asset.headlines[0] ?? "",
        asset.headlines[1] ?? "",
        asset.headlines[2] ?? "",
      ],
      body: asset.body,
      ctas: [asset.ctas[0] ?? "", asset.ctas[1] ?? "", asset.ctas[2] ?? ""],
      shortCopy: asset.shortCopy,
      longCopy: asset.longCopy,
    });
  }

  async function loadLibrary() {
    const res = await fetch("/api/sales-assets");
    if (!res.ok) return;
    const data: unknown = await res.json();
    if (data && typeof data === "object" && "assets" in data && Array.isArray(data.assets)) {
      setLibrary(data.assets as SalesAssetDto[]);
    }
  }

  function payload() {
    return {
      product,
      niche,
      market,
      stage,
      whyRising: why,
      format,
      language: pack?.language ?? (locale === "pt" || locale === "es" ? locale : "en"),
      framework: pack?.framework ?? "AIDA",
      headlines,
      body,
      ctas,
      shortCopy,
      longCopy,
      template,
      mediaUrl,
      checkoutUrl,
      headlineIndex,
      ctaIndex,
    };
  }

  async function gerarCopy() {
    if (!product.trim() || !niche.trim()) {
      toast.error(t("missingFields"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/copy/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: product.trim(),
          niche: niche.trim(),
          whyRising: why.trim(),
          market,
          stage,
          format,
          locale,
        }),
      });
      if (!res.ok) {
        throw new Error(errorText(await readError(res, "FAILED"), t));
      }
      const data: unknown = await res.json();
      const next =
        data && typeof data === "object" && "pack" in data ? (data.pack as CopyPack) : null;
      if (!next?.headlines || next.headlines.length < 3) {
        throw new Error(t("genericError"));
      }
      setPack(next);
      setHeadlines([...next.headlines]);
      setBody(next.body);
      setCtas([...next.ctas]);
      setShortCopy(next.shortCopy);
      setLongCopy(next.longCopy);
      setHeadlineIndex(0);
      setCtaIndex(0);
      setAssetId(null);
      setSlug("");
      setPublished(false);
      toast.success(t("generated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  async function persist(nextPublished?: boolean) {
    if (headlines.filter(Boolean).length < 3 || ctas.filter(Boolean).length < 3 || !longCopy.trim()) {
      toast.error(t("missingFields"));
      return null;
    }
    const res = await fetch(assetId ? `/api/sales-assets/${assetId}` : "/api/sales-assets", {
      method: assetId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload(),
        ...(nextPublished === undefined ? {} : { published: nextPublished }),
      }),
    });
    if (!res.ok) throw new Error(errorText(await readError(res, "FAILED"), t));
    const data: unknown = await res.json();
    let asset =
      data && typeof data === "object" && "asset" in data ? (data.asset as SalesAssetDto) : null;
    if (!asset) return null;
    if (nextPublished && !asset.published) {
      const publishRes = await fetch(`/api/sales-assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true }),
      });
      if (!publishRes.ok) throw new Error(t("genericError"));
      const publishedData: unknown = await publishRes.json();
      if (
        publishedData &&
        typeof publishedData === "object" &&
        "asset" in publishedData
      ) {
        asset = publishedData.asset as SalesAssetDto;
      }
    }
    applyAsset(asset);
    await loadLibrary();
    return asset;
  }

  async function salvar() {
    setSaving(true);
    try {
      const asset = await persist();
      if (asset) toast.success(t("saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("genericError"));
    } finally {
      setSaving(false);
    }
  }

  async function publicar() {
    setSaving(true);
    try {
      const asset = await persist(!published);
      if (asset) toast.success(asset.published ? t("published") : t("unpublish"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("genericError"));
    } finally {
      setSaving(false);
    }
  }

  async function duplicate(id: string) {
    const res = await fetch("/api/sales-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duplicateId: id }),
    });
    if (!res.ok) {
      toast.error(t("genericError"));
      return;
    }
    await loadLibrary();
    toast.success(t("saved"));
  }

  async function remove(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    const res = await fetch(`/api/sales-assets/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(t("genericError"));
      return;
    }
    if (assetId === id) {
      setAssetId(null);
      setPublished(false);
      setSlug("");
    }
    await loadLibrary();
  }

  function baixar() {
    const content = previewContent();
    if (!content) return;
    const blob = new Blob([renderPresellHtml(content)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug || "presell"}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function previewContent(): PresellContent | null {
    const headline = headlines[headlineIndex] || headlines[0];
    const cta = ctas[ctaIndex] || ctas[0];
    if (!headline || !cta) return null;
    const language: CopyLanguage =
      pack?.language ?? (locale === "pt" || locale === "es" ? locale : "en");
    return {
      template,
      language,
      product,
      niche,
      whyRising: why,
      headline,
      body,
      longCopy,
      shortCopy,
      cta,
      mediaUrl,
      checkoutUrl,
    };
  }

  const preview = previewContent();

  return (
    <div className="min-h-full rounded-2xl bg-gradient-to-br from-[#0B1A2F] to-[#12263F] p-6 md:p-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-[#D4AF37]">{t("title")}</h1>
        <p className="mt-2 text-slate-300">{t("subtitle")}</p>
        <div className="mt-6 flex gap-2">
          {(["generate", "library"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={
                tab === item
                  ? "rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0B1A2F]"
                  : "rounded-lg border border-[#D4AF37]/40 px-4 py-2 text-sm text-slate-200"
              }
            >
              {item === "generate" ? t("tabGenerate") : t("tabLibrary")}
            </button>
          ))}
        </div>

        {tab === "library" ? (
          <div className="mt-8 space-y-3">
            {library.length === 0 ? <p className="text-sm text-slate-400">{t("libraryEmpty")}</p> : null}
            {library.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-[#D4AF37]/25 bg-[#0B1A2F]/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-[#F5F7FA]">{item.product}</h2>
                    <p className="text-sm text-[#8BA3B8]">
                      {item.niche}
                      {item.published ? ` · ${t("published")}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="text-sm text-[#D4AF37]" onClick={() => applyAsset(item)}>
                      {t("edit")}
                    </button>
                    <button
                      type="button"
                      className="text-sm text-[#00C2CB]"
                      onClick={() => void duplicate(item.id)}
                    >
                      {t("duplicate")}
                    </button>
                    <button
                      type="button"
                      className="text-sm text-slate-400"
                      onClick={() => void remove(item.id)}
                    >
                      {t("delete")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            <input
              placeholder={t("produtoPlaceholder")}
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              className={fieldClass}
            />
            <input
              placeholder={t("nichoPlaceholder")}
              value={niche}
              onChange={(event) => setNiche(event.target.value)}
              className={fieldClass}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                {t("market")}
                <select
                  value={market}
                  onChange={(event) => setMarket(event.target.value)}
                  className={`${fieldClass} mt-1`}
                >
                  {MARKETS.map((code) => (
                    <option key={code || "auto"} value={code}>
                      {code || t("marketAuto")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                {t("stage")}
                <input
                  placeholder={t("stagePlaceholder")}
                  value={stage}
                  onChange={(event) => setStage(event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
            </div>
            <label className="text-sm text-slate-300">
              {t("format")}
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value)}
                className={`${fieldClass} mt-1`}
              >
                <option value="">{t("formatAny")}</option>
                {ALL_OPPORTUNITY_FORMATS.map((item) => (
                  <option key={item} value={item}>
                    {formats(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              {t("why")}
              <textarea
                placeholder={t("whyPlaceholder")}
                value={why}
                onChange={(event) => setWhy(event.target.value)}
                rows={3}
                className={`${fieldClass} mt-1`}
              />
            </label>
            <button
              type="button"
              onClick={() => void gerarCopy()}
              disabled={loading}
              className="rounded-lg bg-[#D4AF37] px-5 py-3 font-semibold text-[#0B1A2F] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("generating") : t("generate")}
            </button>

            {pack ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-[#D4AF37]">
                  {t("framework")}: {pack.framework} · {pack.language.toUpperCase()}
                </p>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-[#D4AF37]">{t("headlines")}</legend>
                  {headlines.map((line, index) => (
                    <label key={index} className="flex items-start gap-2 text-sm text-slate-100">
                      <input
                        type="radio"
                        name="headline"
                        checked={headlineIndex === index}
                        onChange={() => setHeadlineIndex(index)}
                        className="mt-3"
                      />
                      <textarea
                        value={line}
                        rows={2}
                        onChange={(event) =>
                          setHeadlines((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item,
                            ),
                          )
                        }
                        className={fieldClass}
                      />
                    </label>
                  ))}
                </fieldset>
                <label className="block text-sm text-slate-300">
                  {t("body")}
                  <textarea value={body} rows={4} onChange={(event) => setBody(event.target.value)} className={`${fieldClass} mt-1`} />
                </label>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-[#D4AF37]">{t("ctas")}</legend>
                  {ctas.map((line, index) => (
                    <label key={index} className="flex items-start gap-2 text-sm">
                      <input
                        type="radio"
                        name="cta"
                        checked={ctaIndex === index}
                        onChange={() => setCtaIndex(index)}
                        className="mt-3"
                      />
                      <input
                        value={line}
                        onChange={(event) =>
                          setCtas((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item,
                            ),
                          )
                        }
                        className={fieldClass}
                      />
                    </label>
                  ))}
                </fieldset>
                <label className="block text-sm text-slate-300">
                  {t("short")}
                  <textarea value={shortCopy} rows={4} onChange={(event) => setShortCopy(event.target.value)} className={`${fieldClass} mt-1`} />
                </label>
                <label className="block text-sm text-slate-300">
                  {t("long")}
                  <textarea value={longCopy} rows={8} onChange={(event) => setLongCopy(event.target.value)} className={`${fieldClass} mt-1`} />
                </label>

                <section className="rounded-xl border border-[#D4AF37]/30 p-4">
                  <h2 className="text-lg font-semibold text-[#D4AF37]">{t("presellTitle")}</h2>
                  <p className="mt-1 text-sm text-slate-400">{t("hostedHint")}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {PRESELL_TEMPLATES.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setTemplate(item)}
                        className={
                          template === item
                            ? "rounded-full bg-[#D4AF37] px-3 py-1.5 text-sm font-semibold text-[#0B1A2F]"
                            : "rounded-full border border-[#D4AF37]/40 px-3 py-1.5 text-sm text-slate-200"
                        }
                      >
                        {t(
                          item === "blog"
                            ? "templateBlog"
                            : item === "vsl"
                              ? "templateVsl"
                              : item === "quiz"
                                ? "templateQuiz"
                                : "templateComparison",
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3">
                    <input
                      placeholder={t("media")}
                      value={mediaUrl}
                      onChange={(event) => setMediaUrl(event.target.value)}
                      className={fieldClass}
                    />
                    <input
                      placeholder={t("checkout")}
                      value={checkoutUrl}
                      onChange={(event) => setCheckoutUrl(event.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void salvar()}
                      disabled={saving}
                      className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0B1A2F] disabled:opacity-60"
                    >
                      {saving ? t("saving") : t("save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void publicar()}
                      className="rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-sm text-slate-100"
                    >
                      {published ? t("unpublish") : t("publish")}
                    </button>
                    <button
                      type="button"
                      onClick={baixar}
                      className="rounded-lg border border-[#00C2CB]/40 px-4 py-2 text-sm text-[#00C2CB]"
                    >
                      {t("download")}
                    </button>
                  </div>
                  {published && slug ? (
                    <button
                      type="button"
                      className="mt-3 block text-left text-sm text-[#00C2CB] underline"
                      onClick={() => {
                        void navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
                        toast.success(t("copiedClipboard"));
                      }}
                    >
                      {`/p/${slug}`}
                    </button>
                  ) : null}
                  {preview ? (
                    <div className="mt-6 overflow-hidden rounded-xl border border-[#00C2CB]/20 bg-[#0B1C33]">
                      <PresellView content={preview} />
                    </div>
                  ) : null}
                </section>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
