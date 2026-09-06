async function main() {
  const base = process.argv[2] ?? "http://localhost:3000";
  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "teste@dev.com",
      password: "senha123",
    }),
  });

  const setCookie = login.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.join("; ") || login.headers.get("set-cookie") || "";
  const loginJson = (await login.json()) as {
    user?: { email?: string; name?: string; role?: string };
    error?: string;
  };

  async function probe(path: string) {
    const res = await fetch(`${base}${path}`, {
      headers: cookie ? { Cookie: cookie } : {},
      redirect: "manual",
    });
    let html = "";
    let finalUrl = path;
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location") ?? "";
      const follow = await fetch(new URL(loc, base), {
        headers: cookie ? { Cookie: cookie } : {},
        redirect: "follow",
      });
      html = await follow.text();
      finalUrl = follow.url;
    } else {
      html = await res.text();
    }

    const decoded = html.replace(/<[^>]+>/g, " ");
    const around =
      decoded.match(/gasinvestmentforum[\s\S]{0,160}/i)?.[0] ?? null;

    return {
      requested: path,
      status: res.status,
      finalUrl,
      relEn: decoded.match(/\d+\s+hours?\s+ago/)?.[0] ?? null,
      relPt: decoded.match(/há\s+\d+\s+horas?/)?.[0] ?? null,
      relEs: decoded.match(/hace\s+\d+\s+horas?/)?.[0] ?? null,
      around,
    };
  }

  const [en, pt, es] = await Promise.all([
    probe("/en/dashboard"),
    probe("/dashboard"),
    probe("/es/dashboard"),
  ]);

  console.log(
    JSON.stringify(
      {
        loginStatus: login.status,
        email: loginJson.user?.email ?? loginJson.error ?? null,
        role: loginJson.user?.role ?? null,
        hasCookie: Boolean(cookie),
        en,
        pt,
        es,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
