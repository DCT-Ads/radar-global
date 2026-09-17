"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MuncheyeCard } from "@/components/admin/muncheye-card";
import {
  PLATFORM_IDS,
  PLATFORM_LABELS,
  PLATFORMS,
  type PlatformField,
  type PlatformId,
} from "@/lib/integrations/platforms";
import type { MuncheyeCardStats } from "@/lib/collectors/marketplace/run-muncheye";

type PublicConfig = {
  platform: PlatformId;
  nickname: string;
  connected: boolean;
  validated: boolean;
  fromEnv: boolean;
  has: Record<string, boolean>;
  hints: Record<string, string>;
};

function fieldLabel(
  t: ReturnType<typeof useTranslations<"admin">>,
  field: PlatformField,
) {
  switch (field) {
    case "apiKey":
      return t("fieldApiKey");
    case "clientId":
      return t("fieldClientId");
    case "clientSecret":
      return t("fieldClientSecret");
    case "basicToken":
      return t("fieldBasicToken");
    case "devApiKey":
      return t("fieldDevApiKey");
    case "clerkApiKey":
      return t("fieldClerkApiKey");
    case "apiToken":
      return t("fieldApiToken");
    case "publicKey":
      return t("fieldPublicKey");
  }
}

export function IntegrationTab({ muncheyeStats }: { muncheyeStats: MuncheyeCardStats }) {
  const t = useTranslations("admin");
  const [platform, setPlatform] = useState<PlatformId>("digistore24");
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [nickname, setNickname] = useState("");
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const cfg = PLATFORMS[platform];

  const emptyCreds = useMemo(
    () => Object.fromEntries(cfg.fields.map((field) => [field, ""])),
    [cfg.fields],
  );

  async function load(nextPlatform: PlatformId) {
    const response = await fetch(`/api/admin/integracoes/${nextPlatform}`);
    if (!response.ok) {
      toast.error(t("integrationsLoadError"));
      return;
    }
    const data = (await response.json()) as PublicConfig;
    setConfig(data);
    setNickname(data.nickname ?? "");
    setCreds(
      Object.fromEntries(
        PLATFORMS[nextPlatform].fields.map((field) => [field, ""]),
      ),
    );
    setShow({});
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load public config when the platform tab changes
    void load(platform);
  }, [platform]);

  function toastForError(error: string | undefined, fallback: string) {
    if (error === "KEY_REQUIRED") {
      toast.error(t("integrationsKeyRequired"));
      return;
    }
    if (error === "LIVE_UNAVAILABLE") {
      toast.error(t("integrationsLiveUnavailable"));
      return;
    }
    if (error === "INVALID") {
      toast.error(t("integrationsInvalid"));
      return;
    }
    toast.error(fallback);
  }

  async function onSave() {
    const missing = cfg.fields.filter((field) => {
      const optional = cfg.optionalFields?.includes(field);
      return !optional && !creds[field]?.trim() && !config?.has[field];
    });
    if (missing.length > 0) {
      toast.error(t("integrationsKeyRequired"));
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/integracoes/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creds, nickname, auth: cfg.auth }),
      });
      const data = (await response.json()) as PublicConfig & { error?: string };
      if (!response.ok) {
        toastForError(data.error, t("integrationsSaveError"));
        return;
      }
      setConfig(data);
      setCreds(emptyCreds);
      setNickname(data.nickname ?? "");
      toast.success(t("integrationsSaveOk"));
    } finally {
      setSaving(false);
    }
  }

  async function onValidate() {
    const missing = cfg.fields.filter((field) => {
      const optional = cfg.optionalFields?.includes(field);
      return !optional && !creds[field]?.trim() && !config?.has[field];
    });
    if (missing.length > 0) {
      toast.error(t("integrationsKeyRequired"));
      return;
    }
    setTesting(true);
    try {
      const response = await fetch(`/api/admin/integracoes/${platform}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth: cfg.auth, creds, nickname }),
      });
      const data = (await response.json()) as PublicConfig & {
        ok?: boolean;
        error?: string;
        status?: string;
      };
      if (!response.ok || !data.ok) {
        toastForError(data.error, t("integrationsTestError"));
        return;
      }
      setConfig(data);
      setCreds(emptyCreds);
      setNickname(data.nickname ?? "");
      if (data.error === "LIVE_UNAVAILABLE") {
        toast.success(t("integrationsSaveOk"));
        toast.error(t("integrationsLiveUnavailable"));
      } else {
        toast.success(t("integrationsTestOk"));
      }
    } finally {
      setTesting(false);
    }
  }

  const connected = Boolean(config?.connected);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MuncheyeCard stats={muncheyeStats} />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {PLATFORM_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setPlatform(id)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm",
              platform === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground",
            )}
          >
            {PLATFORM_LABELS[id]}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base text-primary">
              {PLATFORM_LABELS[platform]}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("integrationsDigistoreHint")}
            </p>
          </div>
          <Badge variant={connected ? "default" : "outline"}>
            {config?.validated
              ? t("integrationsValidated")
              : connected
                ? t("integrationsConnected")
                : t("integrationsDisconnected")}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {config?.fromEnv ? (
            <p className="text-xs text-muted-foreground">{t("integrationsFromEnv")}</p>
          ) : null}

          {cfg.fields.map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={`${platform}-${field}`}>{fieldLabel(t, field)}</Label>
              {config?.has[field] && config.hints[field] ? (
                <p className="text-xs text-muted-foreground">
                  {t("integrationsKeySaved", { hint: config.hints[field] })}
                </p>
              ) : null}
              <div className="flex gap-2">
                <Input
                  id={`${platform}-${field}`}
                  type={show[field] ? "text" : "password"}
                  autoComplete="off"
                  value={creds[field] ?? ""}
                  onChange={(event) =>
                    setCreds((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                  placeholder={config?.hints[field] ?? ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setShow((current) => ({
                      ...current,
                      [field]: !current[field],
                    }))
                  }
                  aria-label={
                    show[field] ? t("integrationsHideKey") : t("integrationsShowKey")
                  }
                >
                  {show[field] ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor={`${platform}-nickname`}>{t("integrationsNickname")}</Label>
            <Input
              id={`${platform}-nickname`}
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder={t("integrationsNicknamePlaceholder")}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void onSave()} disabled={saving}>
              {saving ? t("integrationsSaving") : t("integrationsSave")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void onValidate()}
              disabled={testing}
            >
              {testing ? t("integrationsValidating") : t("integrationsValidate")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
