import { fileURLToPath } from "node:url";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required. Supply your Neon connection string securely.");
  process.exit(1);
}

let url;
try {
  url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error();
} catch {
  console.error("DATABASE_URL must be a complete PostgreSQL connection string.");
  process.exit(1);
}

const pool = new Pool({ connectionString, connectionTimeoutMillis: 15000 });
try {
  await migrate(drizzle(pool), {
    migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)),
  });
  console.log("Database migrations applied successfully.");
} catch (error) {
  // Never print the connection string, credentials, or driver error object.
  const code = typeof error?.code === "string" && /^[A-Z0-9_]+$/.test(error.code)
    ? error.code : "MIGRATION_FAILED";
  console.error(`Database migration failed (${code}). No credentials were logged.`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
