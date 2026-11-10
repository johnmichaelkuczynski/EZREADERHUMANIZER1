import type {
  Document, InsertDocument, RewriteJob, InsertRewriteJob
} from "@shared/schema";
import { db } from "./db";
import { and, desc, eq } from "drizzle-orm";
import { documents, rewriteJobs } from "@shared/schema";

export interface IStorage {
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  
  // Rewrite job operations
  createRewriteJob(job: InsertRewriteJob, visitorId: string): Promise<RewriteJob>;
  getRewriteJob(id: string, visitorId: string): Promise<RewriteJob | undefined>;
  updateRewriteJob(id: string, updates: Partial<RewriteJob>, visitorId: string): Promise<RewriteJob>;
  listRewriteJobs(visitorId: string): Promise<RewriteJob[]>;
}

export class DatabaseStorage implements IStorage {
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createRewriteJob(insertJob: InsertRewriteJob, visitorId: string): Promise<RewriteJob> {
    if (!visitorId) throw new Error("Visitor identity is required.");
    const [job] = await db.insert(rewriteJobs).values({ ...insertJob, visitorId }).returning();
    return job;
  }

  async getRewriteJob(id: string, visitorId: string): Promise<RewriteJob | undefined> {
    if (!visitorId) throw new Error("Visitor identity is required.");
    const [job] = await db.select().from(rewriteJobs).where(and(
      eq(rewriteJobs.id, id), eq(rewriteJobs.visitorId, visitorId),
    ));
    return job;
  }

  async updateRewriteJob(id: string, updates: Partial<RewriteJob>, visitorId: string): Promise<RewriteJob> {
    if (!visitorId) throw new Error("Visitor identity is required.");
    const [job] = await db.update(rewriteJobs).set({ ...updates, id, visitorId })
      .where(and(eq(rewriteJobs.id, id), eq(rewriteJobs.visitorId, visitorId))).returning();
    if (!job) {
      throw new Error(`Rewrite job with id ${id} not found`);
    }
    return job;
  }

  async listRewriteJobs(visitorId: string): Promise<RewriteJob[]> {
    if (!visitorId) throw new Error("Visitor identity is required.");
    return db.select().from(rewriteJobs).where(eq(rewriteJobs.visitorId, visitorId))
      .orderBy(desc(rewriteJobs.createdAt));
  }
}

// Database errors propagate to the API; never pretend data was saved in memory.
export const storage: IStorage = new DatabaseStorage();
