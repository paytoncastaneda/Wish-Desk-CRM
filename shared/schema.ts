import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").notNull().default("user"), // 'admin', 'sales_rep', 'user'
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  taskName: text("task_name").notNull(),
  taskOwner: integer("task_owner").references(() => users.id),
  category: text("category"),
  dateDue: timestamp("date_due"),
  expirationDate: timestamp("expiration_date"),
  priority: integer("priority").default(1),
  status: text("status").notNull().default("pending"),
  taskDetails: text("task_details"),
  assignToSidekick: boolean("assign_to_sidekick").default(false),
  
  // Future linking fields for relationships
  linkedSwUserId: integer("linked_sw_user_id").references(() => users.id),
  linkedSwCompanyId: integer("linked_sw_company_id"), // Future table
  linkedSwCrmProposalId: integer("linked_swcrm_proposal_id"), // Future table
  linkedSwCrmOpportunityId: integer("linked_swcrm_opportunity_id"), // Future table
  linkedSwCrmNotesId: integer("linked_swcrm_notes_id"), // Future table
  linkedSwCrmPromotionsId: integer("linked_swcrm_promotions_id"), // Future table
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const githubRepos = pgTable("github_repos", {
  id: serial("id").primaryKey(),
  repoId: integer("repo_id").notNull().unique(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  description: text("description"),
  language: text("language"),
  stars: integer("stars").default(0),
  forks: integer("forks").default(0),
  isPrivate: boolean("is_private").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const githubCommits = pgTable("github_commits", {
  id: serial("id").primaryKey(),
  repoId: integer("repo_id").notNull(),
  sha: text("sha").notNull().unique(),
  message: text("message").notNull(),
  author: text("author").notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  template: text("template"),
  status: text("status").notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  config: jsonb("config"),
  data: jsonb("data"),
  generatedAt: timestamp("generated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documentation = pgTable("documentation", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  author: text("author").notNull(),
  status: text("status").notNull().default("draft"),
  filePath: text("file_path"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  taskName: true,
  taskOwner: true,
  category: true,
  dateDue: true,
  expirationDate: true,
  priority: true,
  status: true,
  taskDetails: true,
  assignToSidekick: true,
  linkedSwUserId: true,
  linkedSwCompanyId: true,
  linkedSwCrmProposalId: true,
  linkedSwCrmOpportunityId: true,
  linkedSwCrmNotesId: true,
  linkedSwCrmPromotionsId: true,
});

export const insertGithubRepoSchema = createInsertSchema(githubRepos).pick({
  repoId: true,
  name: true,
  fullName: true,
  description: true,
  language: true,
  stars: true,
  forks: true,
  isPrivate: true,
});

export const insertGithubCommitSchema = createInsertSchema(githubCommits).pick({
  repoId: true,
  sha: true,
  message: true,
  author: true,
  date: true,
});

export const insertEmailSchema = createInsertSchema(emails).pick({
  to: true,
  subject: true,
  body: true,
  template: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  title: true,
  type: true,
  description: true,
  config: true,
});

export const insertDocumentationSchema = createInsertSchema(documentation).pick({
  title: true,
  category: true,
  content: true,
  author: true,
  status: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertGithubRepo = z.infer<typeof insertGithubRepoSchema>;
export type GithubRepo = typeof githubRepos.$inferSelect;

export type InsertGithubCommit = z.infer<typeof insertGithubCommitSchema>;
export type GithubCommit = typeof githubCommits.$inferSelect;

export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertDocumentation = z.infer<typeof insertDocumentationSchema>;
export type Documentation = typeof documentation.$inferSelect;
