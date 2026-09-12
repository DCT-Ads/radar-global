"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

const FORMATS = [
  { value: "Anúncio de vendas", labelKey: "formatAd" },
  { value: "Roteiro TikTok / Reels", labelKey: "formatReels" },
  { value: "VSL (Vídeo de Vendas)", labelKey: "formatVsl" },
  { value: "Headline / Título", labelKey: "formatHeadline" },
] as const;

const fieldClass =
  "rounded-lg border border-[#D4AF37]/30 bg-[#0B1A2F] px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none";

export function CopyGenerator() {
  const t = useTranslations("copy");
  const [produto, setProduto] = useState("");
  const [nicho, setNicho] = useState("");
  const [formato, setFormato] = useState<(typeof FORMATS)[number]["value"]>("Anúncio de vendas");
  const [copy, setCopy] = useState("");
  const [loading, setLoading] = useState(false);

  async function gerarCopy() {
    if (!produto.trim() || !nicho.trim()) {
      toast.error(t("missingFields"));
      return;
    }
    setCopy("");
    setLoading(true);
    try {
      const res = await fetch("/api/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto: produto.trim(),
          nicho: nicho.trim(),
          formato,
        }),
      });
      const data: unknown = await res.json();
      const message =
        data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error
          : t("genericError");
      if (!res.ok) {
        throw new Error(message);
      }
      const text =
        data && typeof data === "object" && "copy" in data && typeof data.copy === "string"
          ? data.copy
          : "";
      if (!text) {
        throw new Error(t("genericError"));
      }
      setCopy(text);
      toast.success(t("generated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  async function copiar() {
    await navigator.clipboard.writeText(copy);
    toast.success(t("copiedClipboard"));
  }

  return (
    <div className="min-h-full rounded-2xl bg-gradient-to-br from-[#0B1A2F] to-[#12263F] p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-[#D4AF37]">{t("title")}</h1>
        <p className="mt-2 text-slate-300">{t("subtitle")}</p>

        <div className="mt-8 flex flex-col gap-4">
          <input
            placeholder={t("produtoPlaceholder")}
            value={produto}
            onChange={(event) => setProduto(event.target.value)}
            className={fieldClass}
          />
          <input
            placeholder={t("nichoPlaceholder")}
            value={nicho}
            onChange={(event) => setNicho(event.target.value)}
            className={fieldClass}
          />
          <select
            value={formato}
            onChange={(event) =>
              setFormato(event.target.value as (typeof FORMATS)[number]["value"])
            }
            className={fieldClass}
          >
            {FORMATS.map((item) => (
              <option key={item.value} value={item.value}>
                {t(item.labelKey)}
              </option>
            ))}
          </select>

          <button
            onClick={() => void gerarCopy()}
            disabled={loading}
            className="rounded-lg bg-[#D4AF37] px-5 py-3 font-semibold text-[#0B1A2F] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t("generating") : t("generate")}
          </button>
        </div>

        {copy ? (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#D4AF37]">{t("resultTitle")}</h2>
              <button
                onClick={() => void copiar()}
                className="rounded-md border border-[#D4AF37]/40 px-4 py-1.5 text-sm text-slate-200 transition hover:bg-[#D4AF37]/10"
              >
                {t("copy")}
              </button>
            </div>
            <div className="whitespace-pre-wrap rounded-lg border border-[#D4AF37]/20 bg-[#0B1A2F]/60 p-5 leading-relaxed text-slate-100">
              {copy}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
