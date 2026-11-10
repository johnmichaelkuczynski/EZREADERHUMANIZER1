import type {
  Document, InsertDocument, RewriteJob, InsertRewriteJob
} from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";
import { documents, rewriteJobs } from "@shared/schema";

export interface IStorage {
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  
  // Rewrite job operations
  createRewriteJob(job: InsertRewriteJob): Promise<RewriteJob>;
  getRewriteJob(id: string): Promise<RewriteJob | undefined>;
  updateRewriteJob(id: string, updates: Partial<RewriteJob>): Promise<RewriteJob>;
  listRewriteJobs(): Promise<RewriteJob[]>;
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

  async createRewriteJob(insertJob: InsertRewriteJob): Promise<RewriteJob> {
    const [job] = await db.insert(rewriteJobs).values(insertJob).returning();
    return job;
  }

  async getRewriteJob(id: string): Promise<RewriteJob | undefined> {
    const [job] = await db.select().from(rewriteJobs).where(eq(rewriteJobs.id, id));
    return job;
  }

  async updateRewriteJob(id: string, updates: Partial<RewriteJob>): Promise<RewriteJob> {
    const [job] = await db.update(rewriteJobs).set(updates)
      .where(eq(rewriteJobs.id, id)).returning();
    if (!job) {
      throw new Error(`Rewrite job with id ${id} not found`);
    }
    return job;
  }

  async listRewriteJobs(): Promise<RewriteJob[]> {
    return db.select().from(rewriteJobs).orderBy(desc(rewriteJobs.createdAt));
  }
}

// Database errors propagate to the API; never pretend data was saved in memory.
export const storage: IStorage = new DatabaseStorage();
