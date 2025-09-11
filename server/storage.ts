import { 
  type User, type InsertUser, 
  type Document, type InsertDocument,
  type RewriteJob, type InsertRewriteJob
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, documents, rewriteJobs } from "@shared/schema";
import { randomUUID } from "crypto";

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
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      createdAt: new Date(),
    };
    
    try {
      const [newDocument] = await db.insert(documents).values(document).returning();
      return newDocument;
    } catch (error) {
      console.error('Database error creating document:', error);
      throw error;
    }
  }

  async getDocument(id: string): Promise<Document | undefined> {
    try {
      const [document] = await db.select().from(documents).where(eq(documents.id, id));
      return document;
    } catch (error) {
      console.error('Database error getting document:', error);
      return undefined;
    }
  }

  async createRewriteJob(insertJob: InsertRewriteJob): Promise<RewriteJob> {
    const id = randomUUID();
    const job: RewriteJob = {
      ...insertJob,
      id,
      createdAt: new Date(),
    };
    
    try {
      const [newJob] = await db.insert(rewriteJobs).values(job).returning();
      return newJob;
    } catch (error) {
      console.error('Database error creating rewrite job:', error);
      throw error;
    }
  }

  async getRewriteJob(id: string): Promise<RewriteJob | undefined> {
    try {
      const [job] = await db.select().from(rewriteJobs).where(eq(rewriteJobs.id, id));
      return job;
    } catch (error) {
      console.error('Database error getting rewrite job:', error);
      return undefined;
    }
  }

  async updateRewriteJob(id: string, updates: Partial<RewriteJob>): Promise<RewriteJob> {
    try {
      const [updatedJob] = await db
        .update(rewriteJobs)
        .set(updates)
        .where(eq(rewriteJobs.id, id))
        .returning();
      
      if (!updatedJob) {
        throw new Error(`Rewrite job with id ${id} not found`);
      }
      
      return updatedJob;
    } catch (error) {
      console.error('Database error updating rewrite job:', error);
      throw error;
    }
  }

  async listRewriteJobs(): Promise<RewriteJob[]> {
    try {
      const jobs = await db.select().from(rewriteJobs).orderBy(rewriteJobs.createdAt);
      return jobs.reverse(); // Most recent first
    } catch (error) {
      console.error('Database error listing rewrite jobs:', error);
      return [];
    }
  }
}

export class MemStorage implements IStorage {
  private documents: Map<string, Document>;
  private rewriteJobs: Map<string, RewriteJob>;

  constructor() {
    this.documents = new Map();
    this.rewriteJobs = new Map();
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      createdAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createRewriteJob(insertJob: InsertRewriteJob): Promise<RewriteJob> {
    const id = randomUUID();
    const job: RewriteJob = {
      ...insertJob,
      id,
      createdAt: new Date(),
    };
    this.rewriteJobs.set(id, job);
    return job;
  }

  async getRewriteJob(id: string): Promise<RewriteJob | undefined> {
    return this.rewriteJobs.get(id);
  }

  async updateRewriteJob(id: string, updates: Partial<RewriteJob>): Promise<RewriteJob> {
    const existingJob = this.rewriteJobs.get(id);
    if (!existingJob) {
      throw new Error(`Rewrite job with id ${id} not found`);
    }
    
    const updatedJob = { ...existingJob, ...updates };
    this.rewriteJobs.set(id, updatedJob);
    return updatedJob;
  }

  async listRewriteJobs(): Promise<RewriteJob[]> {
    return Array.from(this.rewriteJobs.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }
}

export const storage = new MemStorage();
