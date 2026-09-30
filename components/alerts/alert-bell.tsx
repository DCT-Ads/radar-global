"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Notice = {
  id: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
};

export function AlertBell() {
  const t = useTranslations("alerts");
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notice[]>([]);

  async function load() {
    const res = await fetch("/api/alerts");
    if (!res.ok) return;
    const data: unknown = await res.json();
    if (!data || typeof data !== "object" || !("items" in data) || !Array.isArray(data.items)) return;
    setItems(data.items.slice(0, 6) as Notice[]);
    const unreadCount = "unread" in data && typeof data.unread === "number" ? data.unread : 0;
    setUnread(unreadCount);
  }

  useEffect(() => {
    void load();
  }, []);

  async function openItem(id: string) {
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t("bell")}
        onClick={() => {
          setOpen((value) => !value);
          void load();
        }}
        className="relative rounded-md p-2 text-[#D4AF37] hover:bg-[#D4AF37]/10"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unread > 0 ? (
          <span className="absolute right-0 top-0 min-w-4 rounded-full bg-[#D4AF37] px-1 text-center text-[10px] font-bold leading-4 text-[#0B1C33]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-[#D4AF37]/40 bg-[#12263F] p-3 text-sm text-[#F5F7FA] shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">{t("bell")}</p>
          {items.length === 0 ? <p className="mt-3 text-[#8BA3B8]">{t("empty")}</p> : null}
          <ul className="mt-2 max-h-80 space-y-2 overflow-auto">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => void openItem(item.id)}
                  className="block rounded-lg px-2 py-2 hover:bg-[#0B1C33]"
                >
                  <span className={item.readAt ? "text-[#8BA3B8]" : "font-semibold text-[#F5F7FA]"}>
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#8BA3B8]">{item.body}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/alertas" className="mt-3 inline-block text-xs font-semibold text-[#D4AF37]" onClick={() => setOpen(false)}>
            {t("seeAll")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
