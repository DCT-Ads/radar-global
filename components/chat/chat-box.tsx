"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function ChatBox() {
  const t = useTranslations("chat");
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!prompt.trim()) {
      return;
    }
    setLoading(true);
    setReply("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data: unknown = await res.json();
      const providerMessage =
        data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : "";
      if (!res.ok) {
        setReply(
          res.status === 503
            ? t("missingKey")
            : res.status === 401 || res.status === 403
              ? t("unauthorized")
              : res.status === 429
                ? t("rateLimited")
                : providerMessage || t("error"),
        );
        return;
      }
      const text =
        data && typeof data === "object" && "reply" in data && typeof data.reply === "string"
          ? data.reply
          : "";
      setReply(text || t("error"));
    } catch {
      setReply(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3">
      <h2 className="text-lg font-semibold text-[#D4AF37]">{t("title")}</h2>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder={t("placeholder")}
        className="rounded-md border border-[#D4AF37]/30 bg-[#0B1A2F] p-2 text-slate-100 placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
        rows={3}
      />

      <button
        onClick={() => void handleSend()}
        disabled={loading}
        className="rounded-md bg-[#D4AF37] px-4 py-2 font-semibold text-[#0B1A2F] disabled:opacity-50"
      >
        {loading ? t("loading") : t("send")}
      </button>

      {reply ? (
        <p className="whitespace-pre-wrap border-t border-[#D4AF37]/20 pt-3 text-slate-100">
          {reply}
        </p>
      ) : null}
    </div>
  );
}
