"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MANUAL_PLATFORMS,
  platformLabel,
  type ManualPlatform,
} from "@/lib/signals/persist-manual";

type ManualRow = {
  id: string;
  source: string;
  domain: string | null;
  url: string | null;
  keyword: string | null;
  niche: string | null;
  status: string;
  rawData: unknown;
};

const emptyForm = {
  id: "",
  platform: "hotmart" as ManualPlatform,
  productName: "",
  vendor: "",
  url: "",
  domain: "",
  keyword: "",
  niche: "",
  launchDate: "",
  notes: "",
  publish: true,
};

function rawString(raw: unknown, key: string) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return "";
  }
  const value = (raw as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

export function ManualLaunchForm() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState<ManualRow[]>([]);
  const [saving, setSaving] = useState(false);

  async function loadRows() {
    const response = await fetch("/api/admin/manual-launches");
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as { rows?: ManualRow[] };
    setRows(data.rows ?? []);
  }

  useEffect(() => {
    void loadRows();
  }, []);

  function fillFrom(row: ManualRow) {
    setForm({
      id: row.id,
      platform: (MANUAL_PLATFORMS.includes(row.source as ManualPlatform)
        ? row.source
        : "hotmart") as ManualPlatform,
      productName: rawString(row.rawData, "product_name") || row.domain || "",
      vendor: rawString(row.rawData, "vendor"),
      url: row.url ?? "",
      domain: row.domain ?? "",
      keyword: row.keyword ?? "",
      niche: row.niche ?? "",
      launchDate: rawString(row.rawData, "launch_date"),
      notes: rawString(row.rawData, "notes"),
      publish: true,
    });
  }

  async function onSave() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/manual-launches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: form.id || undefined,
        }),
      });
      const data = (await response.json()) as { error?: string; status?: string };
      if (!response.ok) {
        toast.error(t("manualSaveError"));
        return;
      }
      toast.success(
        data.status === "VERIFIED" ? t("manualSavePublished") : t("manualSaveOk"),
      );
      setForm(emptyForm);
      await loadRows();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-[#1E3A5F] bg-[#12263F]/40">
      <CardHeader>
        <CardTitle className="text-base text-[#D4AF37]">{t("manualTitle")}</CardTitle>
        <p className="text-sm text-[#8BA3B8]">{t("manualHint")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="manual-platform">{t("manualPlatform")}</Label>
            <select
              id="manual-platform"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={form.platform}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  platform: event.target.value as ManualPlatform,
                }))
              }
            >
              {MANUAL_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platformLabel(platform)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-name">{t("manualProduct")}</Label>
            <Input
              id="manual-name"
              value={form.productName}
              onChange={(event) =>
                setForm((current) => ({ ...current, productName: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-vendor">{t("manualVendor")}</Label>
            <Input
              id="manual-vendor"
              value={form.vendor}
              onChange={(event) =>
                setForm((current) => ({ ...current, vendor: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-url">{t("manualUrl")}</Label>
            <Input
              id="manual-url"
              value={form.url}
              onChange={(event) =>
                setForm((current) => ({ ...current, url: event.target.value }))
              }
              placeholder="https://"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-domain">{t("manualDomain")}</Label>
            <Input
              id="manual-domain"
              value={form.domain}
              onChange={(event) =>
                setForm((current) => ({ ...current, domain: event.target.value }))
              }
              placeholder={t("manualDomainHint")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-keyword">{t("colKeyword")}</Label>
            <Input
              id="manual-keyword"
              value={form.keyword}
              onChange={(event) =>
                setForm((current) => ({ ...current, keyword: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-niche">{t("colNiche")}</Label>
            <Input
              id="manual-niche"
              value={form.niche}
              onChange={(event) =>
                setForm((current) => ({ ...current, niche: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-date">{t("manualDate")}</Label>
            <Input
              id="manual-date"
              type="date"
              value={form.launchDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, launchDate: event.target.value }))
              }
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="manual-notes">{t("manualNotes")}</Label>
          <textarea
            id="manual-notes"
            className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[#8BA3B8]">
          <input
            type="checkbox"
            checked={form.publish}
            onChange={(event) =>
              setForm((current) => ({ ...current, publish: event.target.checked }))
            }
          />
          {t("manualPublish")}
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void onSave()} disabled={saving}>
            {saving ? t("manualSaving") : form.id ? t("manualUpdate") : t("manualSave")}
          </Button>
          {form.id ? (
            <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>
              {t("manualNew")}
            </Button>
          ) : null}
        </div>
        {rows.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-[#8BA3B8]">{t("manualRecent")}</p>
            <ul className="space-y-1 text-sm">
              {rows.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-[#F5F7FA]">
                    {rawString(row.rawData, "product_name") || row.domain} · {row.source} ·{" "}
                    {row.status}
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={() => fillFrom(row)}>
                    {t("manualEdit")}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
