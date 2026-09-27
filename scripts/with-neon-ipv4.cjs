const { execFileSync, spawn } = require("node:child_process");
const { resolve } = require("node:path");

require("dotenv").config({ path: resolve(process.cwd(), ".env") });
require("dotenv").config({ path: resolve(process.cwd(), ".env.local"), override: true });

function neonEndpoint(hostname) {
  return hostname.replace(/-pooler\..*$/i, "").replace(/\..*$/, "");
}

function resolveIpv4(hostname) {
  const out = execFileSync("nslookup", [hostname, "8.8.8.8"], {
    encoding: "utf8",
    timeout: 8000,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const ips = [...String(out).matchAll(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/g)]
    .map((match) => match[1])
    .filter((ip) => ip !== "8.8.8.8" && !ip.startsWith("127."));
  if (!ips[0]) {
    throw new Error("no_ipv4");
  }
  return ips[0];
}

function rewriteNeonUrl(raw) {
  if (!raw || process.env.DATABASE_FORCE_IPV4 === "0") {
    return raw;
  }
  const parsed = new URL(raw);
  if (!parsed.hostname.includes("neon.tech")) {
    return raw;
  }
  const endpoint = neonEndpoint(parsed.hostname);
  parsed.hostname = resolveIpv4(parsed.hostname);
  if (!parsed.searchParams.has("connect_timeout")) {
    parsed.searchParams.set("connect_timeout", "15");
  }
  parsed.searchParams.set("sslmode", "require");
  parsed.searchParams.set("sslaccept", "accept_invalid_certs");
  parsed.searchParams.set("channel_binding", "disable");
  if (endpoint.startsWith("ep-") && !parsed.searchParams.get("options")?.includes("endpoint=")) {
    parsed.searchParams.set("options", `endpoint=${endpoint}`);
  }
  return parsed.toString();
}

if (process.platform === "win32" || process.env.DATABASE_FORCE_IPV4 === "1") {
  try {
    const nextUrl = rewriteNeonUrl(process.env.DATABASE_URL);
    if (nextUrl) {
      process.env.RADAR_DATABASE_URL = nextUrl;
      process.env.DATABASE_URL = nextUrl;
      console.log("[neon-ipv4] banco via IPv4 (DNS do Windows)");
    }
  } catch {
    console.warn("[neon-ipv4] nao conseguiu resolver IPv4; usando URL original");
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: node scripts/with-neon-ipv4.cjs <command> [...args]");
  process.exit(1);
}

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env: process.env,
  windowsHide: true,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
