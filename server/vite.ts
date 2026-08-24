import express, { type Express, type Request } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { getSiteOrigin } from "./site-url";

const viteLogger = createLogger();

interface PageSeo {
  title: string;
  description: string;
  robots: string;
  bodyHtml: string;
}

const INDEX_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const NO_INDEX_ROBOTS = "noindex, nofollow, noarchive";
const PAGE_SEO: Record<string, PageSeo> = {
  "/": {
    title: "EZ Reader — AI Document Rewriter, Humanizer & Study Tool",
    description: "Rewrite, humanize, summarize, analyze, and study text, PDFs, Word documents, images, and audio with EZ Reader's all-in-one AI document workspace.",
    robots: INDEX_ROBOTS,
    bodyHtml: `<div id="server-seo-content" class="container mx-auto px-4 py-8">
      <h1>EZ Reader: AI document rewriter, humanizer, and study tool</h1>
      <p>Rewrite, humanize, summarize, analyze, and study text, PDFs, Word documents, images, and audio in one AI document workspace.</p>
      <h2>Writing, file processing, and study support</h2>
      <p>Improve clarity and tone, process uploaded files, extract text, transcribe audio, discuss source material, and get homework or study support.</p>
    </div>`,
  },
  "/gpt-bypass": {
    title: "AI Text Humanizer & Rewriter — EZ Reader",
    description: "Humanize and rewrite AI-generated text with customizable writing samples, tone controls, instruction presets, file uploads, and multiple AI providers.",
    robots: INDEX_ROBOTS,
    bodyHtml: `<div id="server-seo-content" class="container mx-auto px-4 py-8">
      <h1>AI text humanizer and rewriter</h1>
      <p>Rewrite AI-generated drafts with customizable writing samples, tone controls, instruction presets, file uploads, and multiple AI providers.</p>
      <h2>Natural writing with more control</h2>
      <p>Improve clarity, sentence variety, structure, and tone while preserving the meaning of your source text.</p>
    </div>`,
  },
  "/settings": {
    title: "Settings — EZ Reader",
    description: "Private API provider settings for EZ Reader.",
    robots: NO_INDEX_ROBOTS,
    bodyHtml: `<div id="server-seo-content"></div>`,
  },
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function applyServerSeo(template: string, pathname: string, origin: string): string {
  const seo = PAGE_SEO[pathname] || {
    title: "Page Not Found — EZ Reader",
    description: "The requested page could not be found.",
    robots: NO_INDEX_ROBOTS,
    bodyHtml: `<div id="server-seo-content"></div>`,
  };
  const canonicalUrl = `${origin}${pathname === "/" ? "/" : pathname}`;
  const imageUrl = `${origin}/og-image.png`;
  const escapedTitle = escapeHtml(seo.title);
  const escapedDescription = escapeHtml(seo.description);
  const escapedCanonical = escapeHtml(canonicalUrl);
  const escapedImage = escapeHtml(imageUrl);
  const isIndexable = seo.robots === INDEX_ROBOTS;

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapedTitle}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapedDescription}" />`)
    .replace(/<meta name="robots" content="[^"]*" \/>/, `<meta name="robots" content="${seo.robots}" />`)
    .replace(/<meta name="googlebot" content="[^"]*" \/>/, `<meta name="googlebot" content="${seo.robots}" />`)
    .replace(/<meta name="bingbot" content="[^"]*" \/>/, `<meta name="bingbot" content="${seo.robots}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapedTitle}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapedDescription}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapedCanonical}" />`)
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${escapedImage}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapedTitle}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapedDescription}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${escapedImage}" />`);

  const pageLinks = [
    `<link rel="canonical" href="${escapedCanonical}" />`,
    `<link rel="alternate" hreflang="en" href="${escapedCanonical}" />`,
    `<link rel="alternate" hreflang="x-default" href="${escapedCanonical}" />`,
  ].join("\n    ");

  const structuredData = isIndexable
    ? `<script id="page-structured-data" type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": pathname === "/" ? "SoftwareApplication" : "WebApplication",
        name: pathname === "/" ? "EZ Reader" : "EZ Reader AI Text Humanizer",
        applicationCategory: pathname === "/" ? "EducationalApplication" : "UtilitiesApplication",
        operatingSystem: "Web",
        description: seo.description,
        url: canonicalUrl,
      }).replaceAll("<", "\\u003c")}</script>`
    : "";

  html = html.replace("</head>", `    ${pageLinks}\n    ${structuredData}\n  </head>`);
  html = html.replace(
    /<div id="server-seo-content"[\s\S]*?<\/div>/,
    seo.bodyHtml,
  );
  return html;
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    const pathname = new URL(url, "http://localhost").pathname;
    const knownRoutes = new Set(["/", "/gpt-bypass", "/settings"]);

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = applyServerSeo(template, pathname, getSiteOrigin(req));
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      if (!knownRoutes.has(pathname)) {
        res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      }
      res.status(knownRoutes.has(pathname) ? 200 : 404).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath, { index: false }));

  // fall through to index.html if the file doesn't exist
  app.use("*", async (req, res, next) => {
    const knownRoutes = new Set(["/", "/gpt-bypass", "/settings"]);
    try {
      if (!knownRoutes.has(req.path)) {
        res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      }
      const template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");
      const page = applyServerSeo(template, req.path, getSiteOrigin(req));
      res
        .status(knownRoutes.has(req.path) ? 200 : 404)
        .type("text/html")
        .send(page);
    } catch (error) {
      next(error);
    }
  });
}
