import type { Request } from "express";

function configuredOrigin(): string | null {
  const configured = process.env.PUBLIC_BASE_URL;
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

  if (process.env.NODE_ENV === "production") {
    throw new Error("PUBLIC_BASE_URL must be set in production.");
  }

  const requestedHost = req.get("host") || "";
  if (!/^[a-z0-9.-]+(?::\d+)?$/i.test(requestedHost)) {
    return "http://localhost:5000";
  }

  // Request-derived origins are only used in development. Production always
  // uses the configured public origin, independent of proxy/Host headers.
  const protocol = req.secure ? "https" : "http";
  return `${protocol}://${requestedHost}`;
}