import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { storage, DatabaseStorage } from "../server/storage";
import { db, pool } from "../server/db";
import { documents, rewriteJobs, visitors } from "../shared/schema";

// This opt-in integration check uses DATABASE_URL and removes only its own rows.
// No provider requests, user history output, or real user records are modified.
async function verify() {
  assert.ok(storage instanceof DatabaseStorage);
  if (process.argv[2] === "--read") {
    const job = await storage.getRewriteJob(process.argv[3], process.argv[5]);
    const document = await storage.getDocument(process.argv[4]);
    assert.equal(job?.status, "completed");
    assert.equal(job?.outputText, "Database persistence smoke test output.");
    assert.equal(document?.content, "Database persistence smoke test document.");
    console.log("PASS saved records readable in a fresh server process");
    return;
  }

  const marker = `db-verification-${randomUUID()}`;
  const owner = randomUUID();
  const otherVisitor = randomUUID();
  let documentId: string | undefined;
  let jobId: string | undefined;
  try {
    const document = await storage.createDocument({
      filename: `${marker}.txt`,
      content: "Database persistence smoke test document.",
      wordCount: 6,
    });
    documentId = document.id;
    assert.equal(document.aiScore, null);
    assert.ok(document.createdAt instanceof Date);

    const job = await storage.createRewriteJob({
      inputText: "Database persistence smoke test input.",
      provider: "openai",
      selectedPresets: ["verification"],
      chunks: [{ id: marker, content: "Test chunk", startWord: 0, endWord: 2 }],
    }, owner);
    jobId = job.id;
    assert.equal(job.status, "pending");
    assert.equal(job.outputText, null);
    assert.deepEqual(job.selectedPresets, ["verification"]);
    assert.equal(job.chunks?.[0].id, marker);
    await storage.updateRewriteJob(jobId, {
      status: "completed", outputText: "Database persistence smoke test output.",
    }, owner);
    assert.ok((await storage.listRewriteJobs(owner)).some(row => row.id === jobId));
    assert.equal(await storage.getRewriteJob(jobId, otherVisitor), undefined);
    assert.ok(!(await storage.listRewriteJobs(otherVisitor)).some(row => row.id === jobId));
    await assert.rejects(storage.updateRewriteJob(jobId, { status: "completed" }, otherVisitor));

    const child = spawnSync(process.execPath, [
      "--import", "tsx", fileURLToPath(import.meta.url), "--read", jobId, documentId, owner,
    ], { encoding: "utf8", timeout: 30000 });
    assert.equal(child.status, 0, "Fresh process must retrieve saved records");
    console.log(child.stdout.trim());

    await db.insert(visitors).values({ visitorId: marker })
      .onConflictDoNothing({ target: visitors.visitorId });
    await db.insert(visitors).values({ visitorId: marker })
      .onConflictDoNothing({ target: visitors.visitorId });
    const matches = await db.select().from(visitors).where(eq(visitors.visitorId, marker));
    assert.equal(matches.length, 1);
    assert.equal(await storage.getDocument(randomUUID()), undefined);
    assert.equal(await storage.getRewriteJob(randomUUID(), owner), undefined);
    await assert.rejects(storage.updateRewriteJob(randomUUID(), { status: "completed" }, owner));
    console.log("PASS document/job writes, updates, defaults, JSON, missing records, visitor deduplication");
  } finally {
    // IDs/marker belong exclusively to this run; preserve all preexisting data.
    if (jobId) await db.delete(rewriteJobs).where(eq(rewriteJobs.id, jobId));
    if (documentId) await db.delete(documents).where(eq(documents.id, documentId));
    await db.delete(visitors).where(eq(visitors.visitorId, marker));
  }
}

try {
  await verify();
} catch {
  console.error("Database persistence verification failed; no credentials were logged.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
