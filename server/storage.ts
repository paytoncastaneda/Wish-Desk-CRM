import { users, tasks, emails, reports, documentation, swcrmOutreachTemplates, opportunities, swcrmTasks, taskViews, swUsers, swCompany, type User, type Task, type Email, type Report, type Documentation, type InsertUser, type InsertTask, type InsertEmail, type InsertReport, type InsertDocumentation, type SwcrmOutreachTemplate, type InsertSwcrmOutreachTemplate, type Opportunity, type InsertOpportunity, type SwcrmTask, type InsertSwcrmTask, type TaskView, type InsertTaskView, type SwUser, type SwCompany } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // SWCRM Tasks (New comprehensive system)
  getAllSwcrmTasks(filters?: any): Promise<SwcrmTask[]>;
  getSwcrmTask(id: number): Promise<SwcrmTask | undefined>;
  createSwcrmTask(task: InsertSwcrmTask): Promise<SwcrmTask>;
  updateSwcrmTask(id: number, updates: Partial<InsertSwcrmTask>): Promise<SwcrmTask | undefined>;
  deleteSwcrmTask(id: number): Promise<boolean>;
  getSwcrmTasksByFilters(filters: any): Promise<SwcrmTask[]>;
  duplicateTaskForRecurrence(taskId: number): Promise<SwcrmTask | undefined>;

  // Task Views
  getAllTaskViews(userId: number): Promise<TaskView[]>;
  getTaskView(id: number): Promise<TaskView | undefined>;
  createTaskView(view: InsertTaskView): Promise<TaskView>;
  updateTaskView(id: number, updates: Partial<InsertTaskView>): Promise<TaskView | undefined>;
  deleteTaskView(id: number): Promise<boolean>;

  // Sugarwish Users and Companies
  getAllSwUsers(): Promise<SwUser[]>;
  getSwUser(id: number): Promise<SwUser | undefined>;
  getAllSwCompanies(): Promise<SwCompany[]>;
  getSwCompany(id: number): Promise<SwCompany | undefined>;

  // Tasks (Legacy - backward compatibility)
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

  // Email Templates
  getAllEmailTemplates(): Promise<SwcrmOutreachTemplate[]>;
  getEmailTemplate(id: number): Promise<SwcrmOutreachTemplate | undefined>;
  createEmailTemplate(template: InsertSwcrmOutreachTemplate): Promise<SwcrmOutreachTemplate>;
  updateEmailTemplate(id: number, updates: Partial<SwcrmOutreachTemplate>): Promise<SwcrmOutreachTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;

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

  // Opportunities
  getAllOpportunities(): Promise<Opportunity[]>;
  getOpportunity(id: number): Promise<Opportunity | undefined>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  updateOpportunity(id: number, updates: Partial<InsertOpportunity>): Promise<Opportunity | undefined>;
  deleteOpportunity(id: number): Promise<boolean>;
  getOpportunitiesByUser(userId: number): Promise<Opportunity[]>;
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

  // SWCRM Task operations (New comprehensive system)
  async getAllSwcrmTasks(filters?: any): Promise<SwcrmTask[]> {
    const whereConditions = [];
    
    if (filters?.status) {
      whereConditions.push(eq(swcrmTasks.status, filters.status as string));
    }
    if (filters?.priority) {
      whereConditions.push(eq(swcrmTasks.priority, parseInt(filters.priority as string)));
    }
    if (filters?.taskOwner) {
      whereConditions.push(eq(swcrmTasks.taskOwner, parseInt(filters.taskOwner as string)));
    }
    if (filters?.category) {
      whereConditions.push(eq(swcrmTasks.category, filters.category as string));
    }
    
    let query = db.select().from(swcrmTasks);
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    return await query.orderBy(desc(swcrmTasks.createdAt));
  }

  async getSwcrmTask(id: number): Promise<SwcrmTask | undefined> {
    const [task] = await db.select().from(swcrmTasks).where(eq(swcrmTasks.taskId, id));
    return task || undefined;
  }

  async createSwcrmTask(insertTask: InsertSwcrmTask): Promise<SwcrmTask> {
    const [task] = await db.insert(swcrmTasks).values(insertTask).returning();
    return task;
  }

  async updateSwcrmTask(id: number, updates: Partial<InsertSwcrmTask>): Promise<SwcrmTask | undefined> {
    const [task] = await db.update(swcrmTasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(swcrmTasks.taskId, id))
      .returning();
    return task || undefined;
  }

  async deleteSwcrmTask(id: number): Promise<boolean> {
    const result = await db.delete(swcrmTasks).where(eq(swcrmTasks.taskId, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getSwcrmTasksByFilters(filters: any): Promise<SwcrmTask[]> {
    return this.getAllSwcrmTasks(filters);
  }

  async duplicateTaskForRecurrence(taskId: number): Promise<SwcrmTask | undefined> {
    const originalTask = await this.getSwcrmTask(taskId);
    if (!originalTask || !originalTask.isRecurring) return undefined;

    // Calculate next due date based on recurrence pattern
    let nextDueDate = originalTask.dateDue;
    if (nextDueDate && originalTask.recurrencePattern && originalTask.recurrenceInterval) {
      const date = new Date(nextDueDate);
      switch (originalTask.recurrencePattern) {
        case 'daily':
          date.setDate(date.getDate() + originalTask.recurrenceInterval);
          break;
        case 'weekly':
          date.setDate(date.getDate() + (originalTask.recurrenceInterval * 7));
          break;
        case 'monthly':
          date.setMonth(date.getMonth() + originalTask.recurrenceInterval);
          break;
      }
      nextDueDate = date;
    }

    const newTask: InsertSwcrmTask = {
      taskOwner: originalTask.taskOwner,
      taskCreatedBy: originalTask.taskCreatedBy,
      taskName: originalTask.taskName,
      category: originalTask.category,
      taskDetails: originalTask.taskDetails,
      dateDue: nextDueDate,
      expirationDate: originalTask.expirationDate,
      priority: originalTask.priority,
      status: 'Not Started',
      linkedSwUserId: originalTask.linkedSwUserId,
      linkedSwCompanyId: originalTask.linkedSwCompanyId,
      linkedSwCrmProposalId: originalTask.linkedSwCrmProposalId,
      linkedSwCrmOpportunityId: originalTask.linkedSwCrmOpportunityId,
      linkedSwCrmNotesId: originalTask.linkedSwCrmNotesId,
      linkedSwCrmPromotionsId: originalTask.linkedSwCrmPromotionsId,
      assignToSidekick: originalTask.assignToSidekick,
      isRecurring: originalTask.isRecurring,
      recurrencePattern: originalTask.recurrencePattern,
      recurrenceInterval: originalTask.recurrenceInterval,
    };

    return await this.createSwcrmTask(newTask);
  }

  async duplicateSwcrmTask(id: number): Promise<SwcrmTask> {
    return await this.duplicateTaskForRecurrence(id) as SwcrmTask;
  }

  // Task Views operations
  async getAllTaskViews(userId: number): Promise<TaskView[]> {
    return await db.select().from(taskViews)
      .where(or(eq(taskViews.createdBy, userId), eq(taskViews.isGlobal, true)))
      .orderBy(desc(taskViews.createdAt));
  }

  async getTaskView(id: number): Promise<TaskView | undefined> {
    const [view] = await db.select().from(taskViews).where(eq(taskViews.id, id));
    return view || undefined;
  }

  async createTaskView(insertView: InsertTaskView): Promise<TaskView> {
    const [view] = await db.insert(taskViews).values(insertView).returning();
    return view;
  }

  async updateTaskView(id: number, updates: Partial<InsertTaskView>): Promise<TaskView | undefined> {
    const [view] = await db.update(taskViews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(taskViews.id, id))
      .returning();
    return view || undefined;
  }

  async deleteTaskView(id: number): Promise<boolean> {
    const result = await db.delete(taskViews).where(eq(taskViews.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Sugarwish Users and Companies
  async getAllSwUsers(): Promise<SwUser[]> {
    return await db.select().from(swUsers).orderBy(desc(swUsers.createdAt));
  }

  async getSwUser(id: number): Promise<SwUser | undefined> {
    const [user] = await db.select().from(swUsers).where(eq(swUsers.id, id));
    return user || undefined;
  }

  async getAllSwCompanies(): Promise<SwCompany[]> {
    return await db.select().from(swCompany).orderBy(desc(swCompany.createdAt));
  }

  async getSwCompany(id: number): Promise<SwCompany | undefined> {
    const [company] = await db.select().from(swCompany).where(eq(swCompany.id, id));
    return company || undefined;
  }

  // Task operations (Legacy - backward compatibility)
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

  // Email Templates
  async getAllEmailTemplates(): Promise<SwcrmOutreachTemplate[]> {
    return await db.select().from(swcrmOutreachTemplates).where(eq(swcrmOutreachTemplates.isActive, true));
  }

  async getEmailTemplate(id: number): Promise<SwcrmOutreachTemplate | undefined> {
    const [template] = await db.select().from(swcrmOutreachTemplates).where(eq(swcrmOutreachTemplates.id, id));
    return template || undefined;
  }

  async createEmailTemplate(insertTemplate: InsertSwcrmOutreachTemplate): Promise<SwcrmOutreachTemplate> {
    const [template] = await db.insert(swcrmOutreachTemplates).values(insertTemplate).returning();
    return template;
  }

  async updateEmailTemplate(id: number, updates: Partial<SwcrmOutreachTemplate>): Promise<SwcrmOutreachTemplate | undefined> {
    const [template] = await db
      .update(swcrmOutreachTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(swcrmOutreachTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    await db
      .update(swcrmOutreachTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(swcrmOutreachTemplates.id, id));
    return true;
  }

  // Opportunities operations
  async getAllOpportunities(): Promise<Opportunity[]> {
    return await db.select().from(opportunities);
  }

  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    const result = await db.select().from(opportunities).where(eq(opportunities.id, id));
    return result[0];
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const result = await db.insert(opportunities).values(insertOpportunity).returning();
    return result[0];
  }

  async updateOpportunity(id: number, updates: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const result = await db.update(opportunities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(opportunities.id, id))
      .returning();
    return result[0];
  }

  async deleteOpportunity(id: number): Promise<boolean> {
    try {
      await db.delete(opportunities).where(eq(opportunities.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      return false;
    }
  }

  async getOpportunitiesByUser(userId: number): Promise<Opportunity[]> {
    return await db.select().from(opportunities).where(eq(opportunities.assignedUserId, userId));
  }
}

export const storage = new DatabaseStorage();