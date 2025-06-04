import { 
  users, tasks, githubRepos, emails, reports, documents,
  type User, type InsertUser, type Task, type InsertTask,
  type GitHubRepo, type Email, type InsertEmail,
  type Report, type InsertReport, type Document, type InsertDocument
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTasksByStatus(status: string): Promise<Task[]>;
  getTasksByPriority(priority: string): Promise<Task[]>;

  // GitHub Repos
  getGitHubRepos(): Promise<GitHubRepo[]>;
  getGitHubRepo(id: number): Promise<GitHubRepo | undefined>;
  createGitHubRepo(repo: Omit<GitHubRepo, 'id'>): Promise<GitHubRepo>;
  updateGitHubRepo(id: number, repo: Partial<GitHubRepo>): Promise<GitHubRepo | undefined>;
  deleteGitHubRepo(id: number): Promise<boolean>;

  // Emails
  getEmails(): Promise<Email[]>;
  getEmail(id: number): Promise<Email | undefined>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmail(id: number, email: Partial<Email>): Promise<Email | undefined>;
  getEmailsByStatus(status: string): Promise<Email[]>;

  // Reports
  getReports(): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: number, report: Partial<Report>): Promise<Report | undefined>;
  deleteReport(id: number): Promise<boolean>;

  // Documents
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  getDocumentsByCategory(category: string): Promise<Document[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private githubRepos: Map<number, GitHubRepo>;
  private emails: Map<number, Email>;
  private reports: Map<number, Report>;
  private documents: Map<number, Document>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.githubRepos = new Map();
    this.emails = new Map();
    this.reports = new Map();
    this.documents = new Map();
    this.currentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId++;
    const now = new Date();
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;

    const updatedTask: Task = {
      ...existingTask,
      ...taskUpdate,
      updatedAt: new Date()
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
  async getGitHubRepos(): Promise<GitHubRepo[]> {
    return Array.from(this.githubRepos.values()).sort((a, b) => 
      new Date(b.lastSync || 0).getTime() - new Date(a.lastSync || 0).getTime()
    );
  }

  async getGitHubRepo(id: number): Promise<GitHubRepo | undefined> {
    return this.githubRepos.get(id);
  }

  async createGitHubRepo(repo: Omit<GitHubRepo, 'id'>): Promise<GitHubRepo> {
    const id = this.currentId++;
    const githubRepo: GitHubRepo = { ...repo, id };
    this.githubRepos.set(id, githubRepo);
    return githubRepo;
  }

  async updateGitHubRepo(id: number, repoUpdate: Partial<GitHubRepo>): Promise<GitHubRepo | undefined> {
    const existingRepo = this.githubRepos.get(id);
    if (!existingRepo) return undefined;

    const updatedRepo: GitHubRepo = { ...existingRepo, ...repoUpdate };
    this.githubRepos.set(id, updatedRepo);
    return updatedRepo;
  }

  async deleteGitHubRepo(id: number): Promise<boolean> {
    return this.githubRepos.delete(id);
  }

  // Email methods
  async getEmails(): Promise<Email[]> {
    return Array.from(this.emails.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getEmail(id: number): Promise<Email | undefined> {
    return this.emails.get(id);
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const id = this.currentId++;
    const email: Email = { 
      ...insertEmail, 
      id, 
      createdAt: new Date()
    };
    this.emails.set(id, email);
    return email;
  }

  async updateEmail(id: number, emailUpdate: Partial<Email>): Promise<Email | undefined> {
    const existingEmail = this.emails.get(id);
    if (!existingEmail) return undefined;

    const updatedEmail: Email = { ...existingEmail, ...emailUpdate };
    this.emails.set(id, updatedEmail);
    return updatedEmail;
  }

  async getEmailsByStatus(status: string): Promise<Email[]> {
    return Array.from(this.emails.values()).filter(email => email.status === status);
  }

  // Report methods
  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentId++;
    const report: Report = { 
      ...insertReport, 
      id, 
      createdAt: new Date()
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReport(id: number, reportUpdate: Partial<Report>): Promise<Report | undefined> {
    const existingReport = this.reports.get(id);
    if (!existingReport) return undefined;

    const updatedReport: Report = { ...existingReport, ...reportUpdate };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async deleteReport(id: number): Promise<boolean> {
    return this.reports.delete(id);
  }

  // Document methods
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
    );
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentId++;
    const now = new Date();
    const document: Document = { 
      ...insertDocument, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, documentUpdate: Partial<Document>): Promise<Document | undefined> {
    const existingDocument = this.documents.get(id);
    if (!existingDocument) return undefined;

    const updatedDocument: Document = {
      ...existingDocument,
      ...documentUpdate,
      updatedAt: new Date()
    };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.category === category);
  }
}

export const storage = new MemStorage();
