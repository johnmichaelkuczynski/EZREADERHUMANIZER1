import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import express from "express";
import { eq } from "drizzle-orm";
import { db, pool } from "../server/db";
import { storage } from "../server/storage";
import { rewriteJobs } from "../shared/schema";
import { registerRoutes } from "../server/routes";

// Isolated API process: no production cookies or paid provider requests.
process.env.SESSION_SECRET = randomUUID() + randomUUID();
const app = express();
app.use(express.json());
const server = await registerRoutes(app);
await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
assert.ok(address && typeof address === "object");
const base = `http://127.0.0.1:${address.port}`;
const owner = randomUUID();
const stranger = randomUUID();
const ids: string[] = [];
function cookie(visitor: string) {
  const signature = createHmac("sha256", process.env.SESSION_SECRET!).update(visitor).digest("base64url");
  return `ez_visitor_id=${visitor}.${signature}`;
}
try {
  const first = await storage.createRewriteJob({
    inputText: "Private owner fixture", provider: "openai", outputText: "Owner output",
  }, owner);
  ids.push(first.id);
  const second = await storage.createRewriteJob({
    inputText: "Private stranger fixture", provider: "openai",
  }, stranger);
  ids.push(second.id);

  const own = await fetch(`${base}/api/gpt-bypass/job/${first.id}`, { headers: { Cookie: cookie(owner) } });
  assert.equal(own.status, 200);
  assert.equal((await own.json()).outputText, "Owner output");
  assert.match(own.headers.get("cache-control")!, /no-store/);
  const ownerList = await fetch(`${base}/api/gpt-bypass/jobs`, { headers: { Cookie: cookie(owner) } });
  const rows = await ownerList.json();
  assert.ok(rows.some((row: { id: string }) => row.id === first.id));
  assert.ok(!rows.some((row: { id: string }) => row.id === second.id));

  for (const credentials of [cookie(stranger), cookie(owner) + "tampered", ""]) {
    const headers = credentials ? { Cookie: credentials } : undefined;
    const denied = await fetch(`${base}/api/gpt-bypass/job/${first.id}`, { headers });
    assert.equal(denied.status, 404);
    const listing = await fetch(`${base}/api/gpt-bypass/jobs`, { headers });
    const visible = await listing.json();
    assert.ok(!visible.some((row: { id: string }) => row.id === first.id));
    const rewrite = await fetch(`${base}/api/gpt-bypass/rewrite`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ inputText: "Must not invoke a provider", reRewrite: true, jobId: first.id }),
    });
    assert.equal(rewrite.status, 404);
  }
  const minted = await fetch(`${base}/api/gpt-bypass/jobs`);
  assert.equal(minted.status, 200);
  assert.match(minted.headers.get("set-cookie")!, /ez_visitor_id=/);
  assert.match(minted.headers.get("set-cookie")!, /HttpOnly/);
  console.log("PASS owner access and isolated history");
  console.log("PASS foreign, forged, and missing cookies cannot read or re-rewrite another visitor's job");
} finally {
  for (const id of ids) await db.delete(rewriteJobs).where(eq(rewriteJobs.id, id));
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
  await pool.end();
}
