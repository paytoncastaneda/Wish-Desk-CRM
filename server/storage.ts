import { users, tasks, emails, reports, documentation, type User, type Task, type Email, type Report, type Documentation, type InsertUser, type InsertTask, type InsertEmail, type InsertReport, type InsertDocumentation } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Tasks
  getAllTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTasksByStatus(status: string): Promise<Task[]>;
  getTasksByPriority(priority: string): Promise<Task[]>;

  // GitHub Repos (deprecated but kept for compatibility)
  getAllRepos(): Promise<any[]>;
  getRepo(id: number): Promise<any>;
  getRepoByRepoId(repoId: number): Promise<any>;
  createRepo(repo: any): Promise<any>;
  updateRepo(id: number, updates: any): Promise<any>;
  deleteRepo(id: number): Promise<boolean>;

  // GitHub Commits (deprecated but kept for compatibility)
  getAllCommits(): Promise<any[]>;
  getCommitsByRepo(repoId: number): Promise<any[]>;
  createCommit(commit: any): Promise<any>;

  // Emails
  getAllEmails(): Promise<Email[]>;
  getEmail(id: number): Promise<Email | undefined>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmail(id: number, updates: Partial<Email>): Promise<Email | undefined>;
  deleteEmail(id: number): Promise<boolean>;
  getEmailsByStatus(status: string): Promise<Email[]>;

  // Reports
  getAllReports(): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: number, updates: Partial<Report>): Promise<Report | undefined>;
  deleteReport(id: number): Promise<boolean>;

  // Documentation
  getAllDocumentation(): Promise<Documentation[]>;
  getDocumentation(id: number): Promise<Documentation | undefined>;
  createDocumentation(doc: InsertDocumentation): Promise<Documentation>;
  updateDocumentation(id: number, updates: Partial<InsertDocumentation>): Promise<Documentation | undefined>;
  deleteDocumentation(id: number): Promise<boolean>;
  getDocumentationByCategory(category: string): Promise<Documentation[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values({
      ...insertTask,
      status: insertTask.status || 'pending',
      priority: insertTask.priority || 1
    }).returning();
    return task;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.status, status));
  }

  async getTasksByPriority(priority: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.priority, priority));
  }

  // GitHub operations (deprecated but kept for compatibility)
  async getAllRepos(): Promise<any[]> { return []; }
  async getRepo(id: number): Promise<any> { return undefined; }
  async getRepoByRepoId(repoId: number): Promise<any> { return undefined; }
  async createRepo(repo: any): Promise<any> { return repo; }
  async updateRepo(id: number, updates: any): Promise<any> { return undefined; }
  async deleteRepo(id: number): Promise<boolean> { return false; }
  async getAllCommits(): Promise<any[]> { return []; }
  async getCommitsByRepo(repoId: number): Promise<any[]> { return []; }
  async createCommit(commit: any): Promise<any> { return commit; }

  // Email operations
  async getAllEmails(): Promise<Email[]> {
    return await db.select().from(emails).orderBy(desc(emails.createdAt));
  }

  async getEmail(id: number): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(eq(emails.id, id));
    return email || undefined;
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const [email] = await db.insert(emails).values({
      ...insertEmail,
      template: insertEmail.template || null
    }).returning();
    return email;
  }

  async updateEmail(id: number, updates: Partial<Email>): Promise<Email | undefined> {
    const [email] = await db.update(emails).set(updates).where(eq(emails.id, id)).returning();
    return email || undefined;
  }

  async deleteEmail(id: number): Promise<boolean> {
    const result = await db.delete(emails).where(eq(emails.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getEmailsByStatus(status: string): Promise<Email[]> {
    return await db.select().from(emails).where(eq(emails.status, status));
  }

  // Report operations
  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values({
      ...insertReport,
      description: insertReport.description || null,
      config: insertReport.config || null
    }).returning();
    return report;
  }

  async updateReport(id: number, updates: Partial<Report>): Promise<Report | undefined> {
    const [report] = await db.update(reports).set(updates).where(eq(reports.id, id)).returning();
    return report || undefined;
  }

  async deleteReport(id: number): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Documentation operations
  async getAllDocumentation(): Promise<Documentation[]> {
    return await db.select().from(documentation).orderBy(desc(documentation.updatedAt));
  }

  async getDocumentation(id: number): Promise<Documentation | undefined> {
    const [doc] = await db.select().from(documentation).where(eq(documentation.id, id));
    return doc || undefined;
  }

  async createDocumentation(insertDoc: InsertDocumentation): Promise<Documentation> {
    const [doc] = await db.insert(documentation).values({
      ...insertDoc,
      status: insertDoc.status || 'draft'
    }).returning();
    return doc;
  }

  async updateDocumentation(id: number, updates: Partial<InsertDocumentation>): Promise<Documentation | undefined> {
    const [doc] = await db.update(documentation).set(updates).where(eq(documentation.id, id)).returning();
    return doc || undefined;
  }

  async deleteDocumentation(id: number): Promise<boolean> {
    const result = await db.delete(documentation).where(eq(documentation.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getDocumentationByCategory(category: string): Promise<Documentation[]> {
    return await db.select().from(documentation).where(eq(documentation.category, category));
  }
}

export const storage = new DatabaseStorage();