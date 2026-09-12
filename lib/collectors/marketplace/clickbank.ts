import { fetchHtml, isUrlAllowedByRobots, RobotsBlockedError } from "./http";
import { emptyResult, type MarketplaceCollectResult } from "./types";

const PUBLIC_MARKETPLACE = "https://www.clickbank.com/marketplace";

export async function collectClickbank(): Promise<MarketplaceCollectResult> {
  try {
    const res = await fetchHtml(PUBLIC_MARKETPLACE);
    const finalHost = new URL(res.url).hostname;
    const login = /session has expired|please log in to continue/i.test(res.html);
    const robotsOk = await isUrlAllowedByRobots(res.url);

    if (!robotsOk) {
      const message = `robots: ${finalHost} bloqueia ${new URL(res.url).pathname}`;
      console.error(`[clickbank] ${message}`);
      return emptyResult("clickbank", {
        errors: [message],
        httpStatus: res.status,
        finalUrl: res.url,
        emptyReason: message,
      });
    }

    if (login || finalHost.includes("accounts.clickbank.com")) {
      const message = login
        ? "login: marketplace redireciona para accounts.clickbank.com e pede sessão"
        : `redirect: destino ${res.url} sem catálogo público no HTML`;
      console.error(`[clickbank] ${message}`);
      return emptyResult("clickbank", {
        errors: [message],
        httpStatus: res.status,
        finalUrl: res.url,
        emptyReason: message,
      });
    }

    const message = "clickbank: HTML sem listagem pública de produtos";
    console.error(`[clickbank] ${message}`);
    return emptyResult("clickbank", {
      errors: [message],
      httpStatus: res.status,
      finalUrl: res.url,
      emptyReason: message,
    });
  } catch (error) {
    const message =
      error instanceof RobotsBlockedError
        ? `robots: ${error.message}`
        : error instanceof Error
          ? error.message
          : "clickbank falhou";
    console.error(`[clickbank] erro: ${message}`);
    return emptyResult("clickbank", {
      errors: [message],
      emptyReason: message,
    });
  }
}
