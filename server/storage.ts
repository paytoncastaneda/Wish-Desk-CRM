import { 
  users, tasks, githubRepos, githubCommits, emails, reports, documentation,
  type User, type InsertUser, type Task, type InsertTask,
  type GithubRepo, type InsertGithubRepo, type GithubCommit, type InsertGithubCommit,
  type Email, type InsertEmail, type Report, type InsertReport,
  type Documentation, type InsertDocumentation
} from "@shared/schema";

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

  // GitHub Repos
  getAllRepos(): Promise<GithubRepo[]>;
  getRepo(id: number): Promise<GithubRepo | undefined>;
  getRepoByRepoId(repoId: number): Promise<GithubRepo | undefined>;
  createRepo(repo: InsertGithubRepo): Promise<GithubRepo>;
  updateRepo(id: number, updates: Partial<InsertGithubRepo>): Promise<GithubRepo | undefined>;
  deleteRepo(id: number): Promise<boolean>;

  // GitHub Commits
  getAllCommits(): Promise<GithubCommit[]>;
  getCommitsByRepo(repoId: number): Promise<GithubCommit[]>;
  createCommit(commit: InsertGithubCommit): Promise<GithubCommit>;

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private githubRepos: Map<number, GithubRepo>;
  private githubCommits: Map<number, GithubCommit>;
  private emails: Map<number, Email>;
  private reports: Map<number, Report>;
  private documentation: Map<number, Documentation>;
  
  private currentUserId: number;
  private currentTaskId: number;
  private currentRepoId: number;
  private currentCommitId: number;
  private currentEmailId: number;
  private currentReportId: number;
  private currentDocId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.githubRepos = new Map();
    this.githubCommits = new Map();
    this.emails = new Map();
    this.reports = new Map();
    this.documentation = new Map();
    
    this.currentUserId = 1;
    this.currentTaskId = 1;
    this.currentRepoId = 1;
    this.currentCommitId = 1;
    this.currentEmailId = 1;
    this.currentReportId = 1;
    this.currentDocId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Task methods
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: new Date(),
      completedAt: null
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask: Task = { 
      ...task, 
      ...updates,
      completedAt: updates.status === 'completed' ? new Date() : task.completedAt
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  async getTasksByPriority(priority: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.priority === priority);
  }

  // GitHub Repo methods
  async getAllRepos(): Promise<GithubRepo[]> {
    return Array.from(this.githubRepos.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getRepo(id: number): Promise<GithubRepo | undefined> {
    return this.githubRepos.get(id);
  }

  async getRepoByRepoId(repoId: number): Promise<GithubRepo | undefined> {
    return Array.from(this.githubRepos.values()).find(repo => repo.repoId === repoId);
  }

  async createRepo(insertRepo: InsertGithubRepo): Promise<GithubRepo> {
    const id = this.currentRepoId++;
    const repo: GithubRepo = { 
      ...insertRepo, 
      id, 
      lastSyncAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.githubRepos.set(id, repo);
    return repo;
  }

  async updateRepo(id: number, updates: Partial<InsertGithubRepo>): Promise<GithubRepo | undefined> {
    const repo = this.githubRepos.get(id);
    if (!repo) return undefined;
    
    const updatedRepo: GithubRepo = { 
      ...repo, 
      ...updates,
      updatedAt: new Date()
    };
    this.githubRepos.set(id, updatedRepo);
    return updatedRepo;
  }

  async deleteRepo(id: number): Promise<boolean> {
    return this.githubRepos.delete(id);
  }

  // GitHub Commit methods
  async getAllCommits(): Promise<GithubCommit[]> {
    return Array.from(this.githubCommits.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getCommitsByRepo(repoId: number): Promise<GithubCommit[]> {
    return Array.from(this.githubCommits.values())
      .filter(commit => commit.repoId === repoId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createCommit(insertCommit: InsertGithubCommit): Promise<GithubCommit> {
    const id = this.currentCommitId++;
    const commit: GithubCommit = { 
      ...insertCommit, 
      id, 
      createdAt: new Date()
    };
    this.githubCommits.set(id, commit);
    return commit;
  }

  // Email methods
  async getAllEmails(): Promise<Email[]> {
    return Array.from(this.emails.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getEmail(id: number): Promise<Email | undefined> {
    return this.emails.get(id);
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const id = this.currentEmailId++;
    const email: Email = { 
      ...insertEmail, 
      id, 
      status: "pending",
      sentAt: null,
      openedAt: null,
      createdAt: new Date()
    };
    this.emails.set(id, email);
    return email;
  }

  async updateEmail(id: number, updates: Partial<Email>): Promise<Email | undefined> {
    const email = this.emails.get(id);
    if (!email) return undefined;
    
    const updatedEmail: Email = { ...email, ...updates };
    this.emails.set(id, updatedEmail);
    return updatedEmail;
  }

  async deleteEmail(id: number): Promise<boolean> {
    return this.emails.delete(id);
  }

  async getEmailsByStatus(status: string): Promise<Email[]> {
    return Array.from(this.emails.values()).filter(email => email.status === status);
  }

  // Report methods
  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const report: Report = { 
      ...insertReport, 
      id, 
      status: "pending",
      data: null,
      generatedAt: null,
      createdAt: new Date()
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReport(id: number, updates: Partial<Report>): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const updatedReport: Report = { ...report, ...updates };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async deleteReport(id: number): Promise<boolean> {
    return this.reports.delete(id);
  }

  // Documentation methods
  async getAllDocumentation(): Promise<Documentation[]> {
    return Array.from(this.documentation.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getDocumentation(id: number): Promise<Documentation | undefined> {
    return this.documentation.get(id);
  }

  async createDocumentation(insertDoc: InsertDocumentation): Promise<Documentation> {
    const id = this.currentDocId++;
    const doc: Documentation = { 
      ...insertDoc, 
      id, 
      filePath: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.documentation.set(id, doc);
    return doc;
  }

  async updateDocumentation(id: number, updates: Partial<InsertDocumentation>): Promise<Documentation | undefined> {
    const doc = this.documentation.get(id);
    if (!doc) return undefined;
    
    const updatedDoc: Documentation = { 
      ...doc, 
      ...updates,
      updatedAt: new Date()
    };
    this.documentation.set(id, updatedDoc);
    return updatedDoc;
  }

  async deleteDocumentation(id: number): Promise<boolean> {
    return this.documentation.delete(id);
  }

  async getDocumentationByCategory(category: string): Promise<Documentation[]> {
    return Array.from(this.documentation.values())
      .filter(doc => doc.category === category)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

import { users, tasks, emails, reports, documentation, type User, type Task, type Email, type Report, type Documentation, type InsertUser, type InsertTask, type InsertEmail, type InsertReport, type InsertDocumentation } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
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

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values({
      ...insertTask,
      description: insertTask.description || null,
      status: insertTask.status || 'pending',
      priority: insertTask.priority || 'medium'
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

  // Deprecated GitHub methods - keeping for compatibility
  async getAllRepos(): Promise<any[]> { return []; }
  async getRepo(id: number): Promise<any> { return undefined; }
  async getRepoByRepoId(repoId: number): Promise<any> { return undefined; }
  async createRepo(repo: any): Promise<any> { return repo; }
  async updateRepo(id: number, updates: any): Promise<any> { return undefined; }
  async deleteRepo(id: number): Promise<boolean> { return false; }
  async getAllCommits(): Promise<any[]> { return []; }
  async getCommitsByRepo(repoId: number): Promise<any[]> { return []; }
  async createCommit(commit: any): Promise<any> { return commit; }

  async getAllEmails(): Promise<Email[]> {
    return await db.select().from(emails);
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

  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports);
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

  async getAllDocumentation(): Promise<Documentation[]> {
    return await db.select().from(documentation);
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
