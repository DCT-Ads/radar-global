import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const SEARCH_QUOTA = 100;
const VIDEOS_QUOTA = 1;
const CHANNELS_QUOTA = 1;
const QUERY = process.env.YOUTUBE_TEST_Q ?? "viral";

function loadDotEnv() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) {
    return;
  }
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq < 1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function describeKey(value: string | undefined) {
  if (!value?.trim()) {
    return { present: false, length: 0 };
  }
  return { present: true, length: value.trim().length };
}

async function youtubeGet(
  resource: string,
  params: Record<string, string>,
  apiKey: string,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
  url.searchParams.set("key", apiKey);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const body = (await response.json()) as Record<string, unknown>;
  return { status: response.status, body };
}

function apiErrorMessage(body: Record<string, unknown>, status: number) {
  const error = body.error as { message?: string; errors?: Array<{ reason?: string }> } | undefined;
  const reason = error?.errors?.[0]?.reason;
  if (status === 403) {
    return `403: quota excedida ou key inválida${reason ? ` (${reason})` : ""} — ${error?.message ?? "forbidden"}`;
  }
  if (status === 400) {
    return `400: parâmetro errado${reason ? ` (${reason})` : ""} — ${error?.message ?? "bad request"}`;
  }
  return `HTTP ${status}: ${error?.message ?? "YouTube API error"}`;
}

function requireOk(
  label: string,
  status: number,
  body: Record<string, unknown>,
) {
  if (status !== 200) {
    throw new Error(`${label} ${apiErrorMessage(body, status)}`);
  }
}

function asItems(body: Record<string, unknown>) {
  return Array.isArray(body.items) ? (body.items as Array<Record<string, unknown>>) : [];
}

function snippet(item: Record<string, unknown>) {
  return (item.snippet ?? {}) as Record<string, unknown>;
}

function stats(item: Record<string, unknown>) {
  return (item.statistics ?? {}) as Record<string, unknown>;
}

async function main() {
  loadDotEnv();
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const keyInfo = describeKey(apiKey);

  console.log(
    JSON.stringify(
      {
        passo0: {
          envFile: existsSync(resolve(process.cwd(), ".env")),
          YOUTUBE_API_KEY: keyInfo,
          gitignoreCoversEnv: true,
        },
      },
      null,
      2,
    ),
  );

  if (!apiKey) {
    console.error(
      [
        "YOUTUBE_API_KEY ausente ou vazia.",
        "Adicione no .env (sem aspas inventadas — cole a key do Cloud Console):",
        'YOUTUBE_API_KEY="cole_a_chave_aqui"',
        "Arquivo: .env na raiz do repo (já está no .gitignore via .env*).",
      ].join("\n"),
    );
    process.exit(1);
  }

  const search = await youtubeGet(
    "search",
    {
      part: "snippet",
      q: QUERY,
      type: "video",
      maxResults: "5",
      regionCode: "BR",
    },
    apiKey,
  );
  requireOk("search.list", search.status, search.body);
  const searchItems = asItems(search.body);
  if (!searchItems.length) {
    throw new Error("search.list retornou items vazios");
  }

  const videoIds = searchItems
    .map((item) => {
      const id = item.id as { videoId?: string } | undefined;
      return id?.videoId ?? "";
    })
    .filter(Boolean);
  if (!videoIds.length) {
    throw new Error("search.list sem videoId");
  }

  const videos = await youtubeGet(
    "videos",
    {
      part: "snippet,statistics",
      id: videoIds.join(","),
    },
    apiKey,
  );
  requireOk("videos.list", videos.status, videos.body);
  const videoItems = asItems(videos.body);
  if (!videoItems.length) {
    throw new Error("videos.list retornou items vazios");
  }

  const channelIds = [
    ...new Set(
      videoItems
        .map((item) => String(snippet(item).channelId ?? ""))
        .filter(Boolean),
    ),
  ];
  const channels = await youtubeGet(
    "channels",
    {
      part: "statistics,snippet",
      id: channelIds.join(","),
    },
    apiKey,
  );
  requireOk("channels.list", channels.status, channels.body);
  const channelItems = asItems(channels.body);
  const subscribersByChannel = new Map(
    channelItems.map((item) => [
      String(item.id ?? ""),
      String(stats(item).subscriberCount ?? ""),
    ]),
  );

  const rows = videoItems.map((item) => {
    const meta = snippet(item);
    const numbers = stats(item);
    const videoId = String(item.id ?? "");
    const title = String(meta.title ?? "");
    const channel = String(meta.channelTitle ?? "");
    const publishedAt = String(meta.publishedAt ?? "");
    const views = String(numbers.viewCount ?? "");
    const likes = String(numbers.likeCount ?? "");
    const comments = String(numbers.commentCount ?? "");
    const empty = [videoId, title, channel, publishedAt, views].filter((value) => !value);
    return {
      videoId,
      title,
      channel,
      views,
      likes,
      comments,
      publishedAt,
      subscriberCount: subscribersByChannel.get(String(meta.channelId ?? "")) ?? "",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      fieldsOk: empty.length === 0,
    };
  });

  const check = rows[0];
  if (!check?.fieldsOk) {
    throw new Error("primeiro resultado com campo obrigatório vazio");
  }

  console.log(
    JSON.stringify(
      {
        http: {
          search: search.status,
          videos: videos.status,
          channels: channels.status,
        },
        quotaCost: {
          searchList: SEARCH_QUOTA,
          videosList: VIDEOS_QUOTA,
          channelsList: CHANNELS_QUOTA,
          total: SEARCH_QUOTA + VIDEOS_QUOTA + CHANNELS_QUOTA,
        },
        results: rows,
        compararNoYoutube: {
          videoId: check.videoId,
          url: check.url,
          views: check.views,
          likes: check.likes,
          comments: check.comments,
          publishedAt: check.publishedAt,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
