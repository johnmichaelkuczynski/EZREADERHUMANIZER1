import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  wordCount: integer("word_count").notNull(),
  aiScore: integer("ai_score"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const rewriteJobs = pgTable("rewrite_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inputText: text("input_text").notNull(),
  styleText: text("style_text"),
  contentMixText: text("content_mix_text"),
  customInstructions: text("custom_instructions"),
  selectedPresets: jsonb("selected_presets").$type<string[]>(),
  provider: text("provider").notNull(),
  chunks: jsonb("chunks").$type<TextChunk[]>(),
  selectedChunkIds: jsonb("selected_chunk_ids").$type<string[]>(),
  mixingMode: text("mixing_mode").$type<'style' | 'content' | 'both'>(),
  outputText: text("output_text"),
  inputAiScore: integer("input_ai_score"),
  outputAiScore: integer("output_ai_score"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertRewriteJobSchema = createInsertSchema(rewriteJobs).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type RewriteJob = typeof rewriteJobs.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertRewriteJob = z.infer<typeof insertRewriteJobSchema>;

export interface TextChunk {
  id: string;
  content: string;
  startWord: number;
  endWord: number;
  aiScore?: number;
}

export interface InstructionPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  instruction: string;
}

export interface WritingSample {
  id: string;
  name: string;
  preview: string;
  content: string;
  category: string;
}

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'perplexity';
  model?: string;
}

export interface RewriteRequest {
  inputText: string;
  styleText?: string;
  contentMixText?: string;
  customInstructions?: string;
  selectedPresets?: string[];
  provider: string;
  selectedChunkIds?: string[];
  mixingMode?: 'style' | 'content' | 'both';
}

export interface RewriteResponse {
  rewrittenText: string;
  inputAiScore: number;
  outputAiScore: number;
  jobId: string;
}

// API schemas for existing functionality
export const processTextSchema = z.object({
  inputText: z.string().min(1, "Input text is required"),
  contentSource: z.string().optional().default(""),
  styleSource: z.string().optional().default(""),
  instructions: z.string().optional().default(""),
  llmProvider: z.enum(["openai", "anthropic", "perplexity", "deepseek"]),
  useContentSource: z.boolean().default(false),
  useStyleSource: z.boolean().default(false),
  reprocessOutput: z.boolean().default(false),
  examMode: z.boolean().optional().default(false),
});

export const detectAiSchema = z.object({
  text: z.string().min(1, "Text is required"),
  llmProvider: z.enum(["openai", "anthropic", "perplexity", "deepseek"]).optional(),
});

export const searchOnlineSchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

export const sendEmailSchema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  text: z.string().min(1, "Email body is required"),
});

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  conversationHistory: z.array(chatMessageSchema).default([]),
  llmProvider: z.enum(["openai", "anthropic", "perplexity", "deepseek"]),
  contextDocument: z.string().optional(),
});
