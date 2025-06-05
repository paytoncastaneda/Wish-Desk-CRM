import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users, tasks, emails, reports, documentation, taskCategories, rolePermissions, auditLogs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { authenticate, requireRole, requirePermission, auditLog, type AuthenticatedRequest } from "./middleware/auth";
import { githubService } from "./services/github";
import { emailService } from "./services/email";
import { reportsService } from "./services/reports";
import { documentationService } from "./services/documentation";
import { insertTaskSchema, insertEmailSchema, insertReportSchema, insertDocumentationSchema, insertTaskCategorySchema, insertUserSchema, insertRolePermissionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      const repos = await storage.getAllRepos();
      const emails = await storage.getAllEmails();
      const reports = await storage.getAllReports();

      const activeTasks = tasks.filter(task => task.status !== 'completed').length;
      const emailsSent = emails.filter(email => email.status === 'sent').length;
      const reportsGenerated = reports.filter(report => report.status === 'completed').length;

      const documentation = await storage.getAllDocumentation();
      
      res.json({
        activeTasks,
        emailsSent,
        reportsGenerated,
        documentation: documentation.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Users API - Sales Representatives
  app.get("/api/users/sales-reps", async (req, res) => {
    try {
      const salesReps = await db.select().from(users).where(eq(users.role, 'sales_rep'));
      res.json(salesReps);
    } catch (error) {
      console.error("Error fetching sales reps:", error);
      res.status(500).json({ error: "Failed to fetch sales representatives" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const allUsers = await db.select().from(users).where(eq(users.isActive, true));
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Task analytics
  app.get("/api/dashboard/task-analytics", async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      const completedTasks = tasks.filter(task => task.status === 'completed');
      
      // Group by day for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const taskData = last7Days.map(date => {
        const dayTasks = completedTasks.filter(task => 
          task.completedAt && task.completedAt.toISOString().split('T')[0] === date
        );
        return {
          date,
          completed: dayTasks.length
        };
      });

      res.json(taskData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task analytics" });
    }
  });

  // Email analytics
  app.get("/api/dashboard/email-analytics", async (req, res) => {
    try {
      const emails = await storage.getAllEmails();
      
      // Group by week for the last 4 weeks
      const last4Weeks = Array.from({ length: 4 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7));
        return {
          week: `Week ${4 - i}`,
          startDate: new Date(date.getTime() - (6 * 24 * 60 * 60 * 1000)),
          endDate: date
        };
      });

      const emailData = last4Weeks.map(week => {
        const weekEmails = emails.filter(email => 
          email.createdAt >= week.startDate && email.createdAt <= week.endDate
        );
        return {
          week: week.week,
          emails: weekEmails.length
        };
      });

      res.json(emailData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email analytics" });
    }
  });

  // Tasks CRUD
  app.get("/api/tasks", async (req, res) => {
    try {
      const { status, priority } = req.query;
      let tasks = await storage.getAllTasks();
      
      if (status && status !== 'all') {
        tasks = tasks.filter(task => task.status === status);
      }
      if (priority && priority !== 'all') {
        tasks = tasks.filter(task => task.priority === priority);
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, validatedData);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTask(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });



  // Email management
  app.get("/api/emails", async (req, res) => {
    try {
      const emails = await storage.getAllEmails();
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  app.post("/api/emails", async (req, res) => {
    try {
      const validatedData = insertEmailSchema.parse(req.body);
      const email = await storage.createEmail(validatedData);
      
      // Send email
      await emailService.sendEmail(email.id);
      
      res.status(201).json(email);
    } catch (error) {
      res.status(400).json({ message: "Failed to create email" });
    }
  });

  app.get("/api/emails/stats", async (req, res) => {
    try {
      const emails = await storage.getAllEmails();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const sentToday = emails.filter(email => 
        email.sentAt && email.sentAt >= today
      ).length;
      
      const totalSent = emails.filter(email => email.status === 'sent').length;
      const totalOpened = emails.filter(email => email.openedAt).length;
      const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
      
      const pending = emails.filter(email => email.status === 'pending').length;

      res.json({
        sentToday,
        openRate,
        pending
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email stats" });
    }
  });

  // Reports
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      
      // Generate report
      reportsService.generateReport(report.id);
      
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "Failed to create report" });
    }
  });

  app.get("/api/reports/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getReport(id);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      const fileBuffer = await reportsService.exportReport(id, req.query.format as string);
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${report.title}.${req.query.format || 'pdf'}"`);
      res.send(fileBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to download report" });
    }
  });

  // Documentation
  app.get("/api/documentation", async (req, res) => {
    try {
      const { category } = req.query;
      let docs = await storage.getAllDocumentation();
      
      if (category) {
        docs = await storage.getDocumentationByCategory(category as string);
      }
      
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documentation" });
    }
  });

  app.post("/api/documentation", async (req, res) => {
    try {
      const validatedData = insertDocumentationSchema.parse(req.body);
      const doc = await storage.createDocumentation(validatedData);
      
      // Generate markdown file
      await documentationService.generateMarkdownFile(doc.id);
      
      res.status(201).json(doc);
    } catch (error) {
      res.status(400).json({ message: "Failed to create documentation" });
    }
  });

  app.put("/api/documentation/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDocumentationSchema.partial().parse(req.body);
      const doc = await storage.updateDocumentation(id, validatedData);
      
      if (!doc) {
        return res.status(404).json({ message: "Documentation not found" });
      }
      
      // Update markdown file
      await documentationService.generateMarkdownFile(doc.id);
      
      res.json(doc);
    } catch (error) {
      res.status(400).json({ message: "Failed to update documentation" });
    }
  });

  app.get("/api/documentation/categories", async (req, res) => {
    try {
      const docs = await storage.getAllDocumentation();
      const categories = docs.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documentation categories" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
