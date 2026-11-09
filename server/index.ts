import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.set("trust proxy", 1);

if (process.env.NODE_ENV === "production") {
  const requiredEnvironment = ["PUBLIC_BASE_URL", "SESSION_SECRET"];
  const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);
  if (missingEnvironment.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missingEnvironment.join(", ")}`,
    );
  }

  if ((process.env.SESSION_SECRET || "").length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters in production.");
  }

  try {
    const publicBaseUrl = new URL(process.env.PUBLIC_BASE_URL!);
    if (publicBaseUrl.protocol !== "https:" || publicBaseUrl.username || publicBaseUrl.password) {
      throw new Error("PUBLIC_BASE_URL must be an HTTPS URL without embedded credentials.");
    }
  } catch {
    throw new Error("PUBLIC_BASE_URL must be a valid public HTTPS URL.");
  }
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/settings') {
    res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the platform-provided port in production while keeping the
  // development workflow's existing 5000 default.
  const port = Number.parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
