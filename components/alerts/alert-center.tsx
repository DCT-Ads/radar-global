"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";

type Notice = {
  id: string;
  title: string;
  body: string;
  href: string;
  kind: string;
  readAt: string | null;
  createdAt: string;
};

type Settings = {
  premium: boolean;
  stageAlerts: boolean;
  digestEnabled: boolean;
  digestHour: number;
  timezone: string;
  channel: "EMAIL" | "WHATSAPP" | "BOTH" | "NONE";
  sensitivity: "ALL" | "HOT_ONLY";
  whatsappPhone: string;
  whatsappOptIn: boolean;
};

const ZONES = ["America/Sao_Paulo", "America/New_York", "Europe/Madrid", "Europe/London"];
const fieldClass =
  "mt-1 w-full rounded-lg border border-[#D4AF37]/30 bg-[#0B1A2F] px-3 py-2 text-sm text-[#F5F7FA] focus:border-[#D4AF37] focus:outline-none";

export function AlertCenter() {
  const t = useTranslations("alerts");
  const [items, setItems] = useState<Notice[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [inboxRes, settingsRes] = await Promise.all([fetch("/api/alerts"), fetch("/api/alerts/settings")]);
    if (inboxRes.ok) {
      const data: unknown = await inboxRes.json();
      if (data && typeof data === "object" && "items" in data && Array.isArray(data.items)) {
        setItems(data.items as Notice[]);
      }
    }
    if (settingsRes.ok) {
      setSettings((await settingsRes.json()) as Settings);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function markAll() {
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await load();
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/alerts/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("save");
      setSettings((await res.json()) as Settings);
      toast.success(t("saved"));
    } catch {
      toast.error(t("title"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#D4AF37]">{t("title")}</h1>
        <p className="mt-1 text-sm text-[#8BA3B8]">{t("subtitle")}</p>
      </div>

      <section className="rounded-2xl border border-[#D4AF37]/35 bg-[#12263F] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#D4AF37]">{t("inbox")}</h2>
          <button type="button" onClick={() => void markAll()} className="text-xs text-[#00C2CB]">
            {t("markRead")}
          </button>
        </div>
        {items.length === 0 ? <p className="mt-4 text-sm text-[#8BA3B8]">{t("empty")}</p> : null}
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-[#00C2CB]/20 bg-[#0B1C33] p-3">
              <Link href={item.href} className="font-semibold text-[#F5F7FA] hover:text-[#D4AF37]">
                {item.title}
              </Link>
              <p className="mt-1 text-sm leading-relaxed text-[#8BA3B8]">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {settings ? (
        <section className="rounded-2xl border border-[#D4AF37]/35 bg-[#12263F] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#D4AF37]">{t("settings")}</h2>
          <label className="mt-4 flex items-center gap-2 text-sm text-[#F5F7FA]">
            <input
              type="checkbox"
              checked={settings.stageAlerts}
              onChange={(event) => setSettings({ ...settings, stageAlerts: event.target.checked })}
            />
            {t("stageAlerts")}
          </label>
          <label className="mt-4 block text-sm text-[#8BA3B8]">
            {t("channel")}
            <select
              className={fieldClass}
              value={settings.premium ? settings.channel : settings.channel === "NONE" ? "NONE" : "EMAIL"}
              onChange={(event) =>
                setSettings({ ...settings, channel: event.target.value as Settings["channel"] })
              }
            >
              <option value="EMAIL">{t("channelEmail")}</option>
              <option value="NONE">{t("channelNone")}</option>
              {settings.premium ? <option value="WHATSAPP">{t("channelWhatsapp")}</option> : null}
              {settings.premium ? <option value="BOTH">{t("channelBoth")}</option> : null}
            </select>
          </label>

          <div className={settings.premium ? "mt-4 space-y-4" : "mt-4 space-y-4 opacity-60"}>
            {!settings.premium ? <p className="text-sm text-[#D4AF37]">{t("premiumNote")}</p> : null}
            <label className="flex items-center gap-2 text-sm text-[#F5F7FA]">
              <input
                type="checkbox"
                disabled={!settings.premium}
                checked={settings.digestEnabled}
                onChange={(event) => setSettings({ ...settings, digestEnabled: event.target.checked })}
              />
              {t("digest")}
            </label>
            <label className="block text-sm text-[#8BA3B8]">
              {t("hour")}
              <select
                disabled={!settings.premium}
                className={fieldClass}
                value={settings.digestHour}
                onChange={(event) => setSettings({ ...settings, digestHour: Number(event.target.value) })}
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-[#8BA3B8]">
              {t("timezone")}
              <select
                disabled={!settings.premium}
                className={fieldClass}
                value={settings.timezone}
                onChange={(event) => setSettings({ ...settings, timezone: event.target.value })}
              >
                {ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-[#8BA3B8]">
              {t("sensitivity")}
              <select
                disabled={!settings.premium}
                className={fieldClass}
                value={settings.sensitivity}
                onChange={(event) =>
                  setSettings({ ...settings, sensitivity: event.target.value as Settings["sensitivity"] })
                }
              >
                <option value="ALL">{t("sensitivityAll")}</option>
                <option value="HOT_ONLY">{t("sensitivityHot")}</option>
              </select>
            </label>
            <label className="block text-sm text-[#8BA3B8]">
              {t("phone")}
              <input
                disabled={!settings.premium}
                value={settings.whatsappPhone}
                placeholder="+5511999999999"
                onChange={(event) => setSettings({ ...settings, whatsappPhone: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-[#F5F7FA]">
              <input
                type="checkbox"
                disabled={!settings.premium}
                checked={settings.whatsappOptIn}
                onChange={(event) => setSettings({ ...settings, whatsappOptIn: event.target.checked })}
              />
              {t("optIn")}
            </label>
            <p className="text-xs leading-relaxed text-[#8BA3B8]">{t("whatsappNote")}</p>
          </div>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="mt-5 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0B1C33] disabled:opacity-60"
          >
            {t("save")}
          </button>
        </section>
      ) : null}
    </div>
  );
}
