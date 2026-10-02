"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type FavoriteStarProps = {
  launchId: string;
  favorited: boolean;
  labels: { add: string; remove: string; added: string; removed: string };
};

export function FavoriteStar({ launchId, favorited, labels }: FavoriteStarProps) {
  const router = useRouter();
  const [on, setOn] = useState(favorited);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setOn(favorited);
  }, [favorited]);

  async function toggle() {
    if (pending) {
      return;
    }
    const previous = on;
    setPending(true);
    setOn(!previous);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ launchId }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setOn(previous);
        return;
      }
      const next =
        data && typeof data === "object" && "favorited" in data
          ? Boolean(data.favorited)
          : previous;
      setOn(next);
      if (next && !previous) toast.success(labels.added);
      if (!next && previous) toast.success(labels.removed);
      router.refresh();
    } catch {
      setOn(previous);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? labels.remove : labels.add}
      title={on ? labels.remove : labels.add}
      disabled={pending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggle();
      }}
      className="rounded-md p-1.5 text-[#D4AF37] transition hover:bg-[#D4AF37]/15 disabled:opacity-50"
    >
      <Star className="h-5 w-5" fill={on ? "currentColor" : "none"} strokeWidth={1.75} />
    </button>
  );
}
