import { httpsUrl } from "@/lib/copy/pack";
import {
  isFileVideo,
  presellLabels,
  vimeoId,
  youtubeId,
  type PresellContent,
} from "@/lib/presell/document";

function Media({ url, empty }: { url: string; empty: string }) {
  if (!url) {
    return (
      <div className="my-5 rounded-xl border border-dashed border-[#D4AF37] px-6 py-8 text-center text-sm text-[#8BA3B8]">
        {empty}
      </div>
    );
  }
  const youtube = youtubeId(url);
  if (youtube) {
    return (
      <div className="relative my-5 aspect-video overflow-hidden rounded-xl">
        <iframe
          src={`https://www.youtube.com/embed/${youtube}`}
          title="video"
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  const vimeo = vimeoId(url);
  if (vimeo) {
    return (
      <div className="relative my-5 aspect-video overflow-hidden rounded-xl">
        <iframe
          src={`https://player.vimeo.com/video/${vimeo}`}
          title="video"
          className="absolute inset-0 h-full w-full border-0"
          allowFullScreen
        />
      </div>
    );
  }
  if (isFileVideo(url)) {
    return <video controls src={url} className="my-5 w-full rounded-xl" />;
  }
  return <img src={url} alt="" className="my-5 w-full rounded-xl" />;
}

function Cta({ label, href }: { label: string; href: string }) {
  const className =
    "mt-7 inline-flex rounded-lg bg-[#D4AF37] px-4 py-3 text-sm font-bold text-[#0B1C33]";
  if (href) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }
  return <span className={className}>{label}</span>;
}

export function PresellView({ content }: { content: PresellContent }) {
  const labels = presellLabels(content.language);
  const media = <Media url={httpsUrl(content.mediaUrl)} empty={labels.media} />;
  const cta = <Cta label={content.cta} href={httpsUrl(content.checkoutUrl)} />;

  return (
    <article className="mx-auto max-w-2xl px-5 py-10 text-[#F5F7FA]">
      {content.template === "vsl" ? (
        <>
          <p className="text-xs uppercase tracking-wide text-[#D4AF37]">{content.niche}</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight">{content.headline}</h1>
          {media}
          <p className="whitespace-pre-wrap leading-relaxed">{content.longCopy}</p>
          {cta}
        </>
      ) : null}

      {content.template === "quiz" ? (
        <>
          <p className="text-xs uppercase tracking-wide text-[#D4AF37]">{labels.quiz}</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight">{content.headline}</h1>
          <p className="mt-4 leading-relaxed">{content.body}</p>
          <details className="mt-4 rounded-xl border border-[#D4AF37]/35 p-4">
            <summary className="cursor-pointer font-semibold text-[#D4AF37]">{labels.yes}</summary>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed">{content.longCopy}</p>
            {cta}
          </details>
          <p className="mt-3 text-sm text-[#8BA3B8]">{labels.no}</p>
        </>
      ) : null}

      {content.template === "comparison" ? (
        <>
          <h1 className="font-serif text-3xl leading-tight">{content.headline}</h1>
          <div className="mt-5 grid gap-3">
            <section className="rounded-xl border border-[#00C2CB]/25 p-4">
              <h2 className="text-sm font-semibold text-[#D4AF37]">{labels.market}</h2>
              <p className="mt-2 leading-relaxed">{content.whyRising || content.shortCopy}</p>
            </section>
            <section className="rounded-xl border border-[#D4AF37]/35 p-4">
              <h2 className="text-sm font-semibold text-[#D4AF37]">{labels.offer}</h2>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">{content.longCopy}</p>
            </section>
          </div>
          {media}
          {cta}
        </>
      ) : null}

      {content.template === "blog" ? (
        <>
          <p className="text-xs uppercase tracking-wide text-[#D4AF37]">{content.niche}</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight">{content.headline}</h1>
          {content.whyRising ? (
            <>
              <h2 className="mt-6 text-base font-semibold text-[#D4AF37]">{labels.why}</h2>
              <p className="mt-2 leading-relaxed">{content.whyRising}</p>
            </>
          ) : null}
          <p className="mt-4 whitespace-pre-wrap leading-relaxed">{content.longCopy || content.body}</p>
          {media}
          {cta}
        </>
      ) : null}

      <p className="mt-10 text-xs leading-relaxed text-[#8BA3B8]">{labels.footer}</p>
    </article>
  );
}
