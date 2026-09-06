async function main() {
  const base = process.argv[2] ?? "http://localhost:3000";
  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@radar.local",
      password: "ChangeMeAdmin123!",
    }),
  });

  const setCookie = login.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.join("; ") || login.headers.get("set-cookie") || "";
  const loginBody = await login.text();

  const headers = cookie ? { Cookie: cookie } : {};
  const page = await fetch(`${base}/admin?tab=review&status=NEW`, {
    headers,
    redirect: "manual",
  });
  const upcomingPage = await fetch(
    `${base}/admin?tab=review&status=NEW&sat=UPCOMING`,
    { headers, redirect: "manual" },
  );

  const html = await page.text();
  const upcomingHtml = await upcomingPage.text();
  const chipMatches = [
    ...html.matchAll(
      /(NEW|ENRICHING|CANDIDATE|VERIFIED|DISCARDED)\s*\((\d+)\)/g,
    ),
  ];
  const countMatch = chipMatches.find((m) => m[1] === "NEW");

  console.log(
    JSON.stringify(
      {
        loginStatus: login.status,
        loginBody: loginBody.slice(0, 200),
        pageStatus: page.status,
        location: page.headers.get("location"),
        hasNew: html.includes("NEW"),
        hasNicheQuery: html.includes("niche="),
        hasStatusFilter: html.includes("status=NEW"),
        newCountLabel: countMatch?.[2] ?? null,
        statusChips: Object.fromEntries(chipMatches.map((m) => [m[1], m[2]])),
        tableRows: (html.match(/<tr/g) ?? []).length,
        hasDomainSample:
          html.includes(".software") ||
          html.includes("keto") ||
          html.includes("crypto"),
        badgeSaturated: (html.match(/Saturado<\/span>/g) ?? []).length,
        badgeModerate: (html.match(/Moderado<\/span>/g) ?? []).length,
        badgeHot: (html.match(/>Hot<\/span>/g) ?? []).length,
        sampleConfidence: (html.match(/>5[0-9]</g) ?? []).slice(0, 8),
        upcomingStatus: upcomingPage.status,
        upcomingRows: (upcomingHtml.match(/<tr/g) ?? []).length,
        upcomingBlue: (upcomingHtml.match(/Ainda vai lançar<\/span>/g) ?? []).length,
        upcomingSample:
          upcomingHtml.includes("vpnzeus") ||
          upcomingHtml.includes("tradingprofessor") ||
          upcomingHtml.includes("whoisds"),
        chipsClickable: html.includes("sat=UPCOMING") && html.includes("sat=SATURATED"),
        saturationCol: html.includes("Saturação") || html.includes("Saturation"),
        isReviewQueue:
          html.includes("Fila de revisão") || html.includes("Review queue"),
        htmlLen: html.length,
        newContext: html.includes("NEW")
          ? html.slice(Math.max(0, html.indexOf("NEW") - 20), html.indexOf("NEW") + 80)
          : null,
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
