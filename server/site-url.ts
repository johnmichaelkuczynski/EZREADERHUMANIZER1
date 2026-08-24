import type { Request } from "express";

function configuredOrigin(): string | null {
  const configured = process.env.PUBLIC_SITE_URL;
  if (!configured) return null;

  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function getSiteOrigin(req: Request): string {
  const configured = configuredOrigin();
  if (configured) return configured;

  const requestedHost = req.get("host") || "";
  const hostname = requestedHost.split(":")[0].toLowerCase();
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const isReplitHost = hostname.endsWith(".replit.dev") || hostname.endsWith(".replit.app");

  if (!isLocal && !isReplitHost) {
    return "https://localhost.invalid";
  }

  const protocol = isLocal && req.protocol === "http" ? "http" : "https";
  return `${protocol}://${requestedHost}`;
}