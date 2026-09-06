import { prisma } from "../lib/prisma";

async function fetchPage(base: string, path: string, cookie: string) {
  const page = await fetch(`${base}${path}`, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "manual",
  });
  const html = await page.text();
  return { status: page.status, html };
}

async function main() {
  const base = process.argv[2] ?? "http://localhost:3001";
  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@radar.local",
      password: "ChangeMeAdmin123!",
    }),
  });
  const cookie =
    login.headers.getSetCookie?.().join("; ") || login.headers.get("set-cookie") || "";

  const signal = await prisma.signal.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, domain: true, status: true },
  });

  const detail = signal
    ? await fetchPage(base, `/admin/signal/${signal.id}`, cookie)
    : { status: 0, html: "" };
  const missing = await fetchPage(base, "/admin/signal/does-not-exist", cookie);
  const queue = await fetchPage(base, "/admin?tab=review&status=NEW", cookie);

  console.log(
    JSON.stringify(
      {
        signal,
        detailStatus: detail.status,
        hasDomain: signal ? detail.html.includes(signal.domain ?? "") : false,
        hasStepper: detail.html.includes("NEW") && detail.html.includes("VERIFIED"),
        hasAwaiting: detail.html.includes("Aguardando enriquecimento"),
        queueHasLink: signal ? queue.html.includes(`/admin/signal/${signal.id}`) : false,
        missingStatus: missing.status,
        missingFriendly:
          missing.html.includes("não encontrado") ||
          missing.html.includes("not found") ||
          missing.html.includes("no encontrada"),
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main();
