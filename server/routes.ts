import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { githubService } from "./services/github";
import { emailService } from "./services/email";
import { reportsService } from "./services/reports";
import { docsService } from "./services/docs";
import { 
  insertTaskSchema, 
  insertEmailSchema, 
  insertReportSchema,
  insertDocumentSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard API routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      const repos = await storage.getGitHubRepos();
      const emailStats = await emailService.getEmailStats();
      const reports = await storage.getReports();

      const activeTasks = tasks.filter(task => task.status !== "completed").length;
      const reportsGenerated = reports.length;

      res.json({
        activeTasks,
        githubRepos: repos.length,
        emailsSent: emailStats.totalSent,
        reportsGenerated
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/recent-activity", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      const repos = await storage.getGitHubRepos();
      const emails = await storage.getEmails();

      const recentTasks = tasks
        .filter(task => task.updatedAt && task.status === "completed")
        .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
        .slice(0, 3);

      const recentRepos = repos
        .filter(repo => repo.lastSync)
        .sort((a, b) => new Date(b.lastSync!).getTime() - new Date(a.lastSync!).getTime())
        .slice(0, 2);

      const recentEmails = emails
        .filter(email => email.status === "sent")
        .sort((a, b) => new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime())
        .slice(0, 2);

      const activities = [
        ...recentTasks.map(task => ({
          type: "task",
          message: `Task "${task.title}" completed`,
          timestamp: task.updatedAt,
          icon: "check"
        })),
        ...recentRepos.map(repo => ({
          type: "github",
          message: `New repository "${repo.name}" synced from GitHub`,
          timestamp: repo.lastSync,
          icon: "github"
        })),
        ...recentEmails.map(email => ({
          type: "email",
          message: `Email "${email.subject}" sent successfully`,
          timestamp: email.sentAt,
          icon: "envelope"
        }))
      ]
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, 5);

      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  // Task Management API routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const { status, priority, search } = req.query;
      let tasks = await storage.getTasks();

      if (status && status !== "all") {
        tasks = tasks.filter(task => task.status === status);
      }

      if (priority && priority !== "all") {
        tasks = tasks.filter(task => task.priority === priority);
      }

      if (search) {
        const searchTerm = String(search).toLowerCase();
        tasks = tasks.filter(task => 
          task.title.toLowerCase().includes(searchTerm) ||
          task.description?.toLowerCase().includes(searchTerm)
        );
      }

      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);

      // Send assignment email if task is assigned
      if (task.assignedTo) {
        try {
          await emailService.sendTaskAssignmentEmail({
            to: task.assignedTo,
            taskTitle: task.title,
            taskDescription: task.description || "",
            taskPriority: task.priority,
            taskDueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"
          });
        } catch (emailError) {
          console.error("Failed to send assignment email:", emailError);
        }
      }

      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, taskData);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Send completion email if task was completed
      if (taskData.status === "completed" && task.assignedTo) {
        try {
          await emailService.sendTaskCompletionEmail({
            to: task.assignedTo,
            taskTitle: task.title,
            completedBy: task.assignedTo,
            completionDate: new Date().toLocaleDateString()
          });
        } catch (emailError) {
          console.error("Failed to send completion email:", emailError);
        }
      }

      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTask(id);

      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // GitHub Integration API routes
  app.get("/api/github/repos", async (req, res) => {
    try {
      const repos = await storage.getGitHubRepos();
      res.json(repos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  });

  app.post("/api/github/sync", async (req, res) => {
    try {
      const repos = await githubService.syncRepositories();
      res.json({ message: "Sync completed", count: repos.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to sync repositories" });
    }
  });

  app.get("/api/github/stats", async (req, res) => {
    try {
      const stats = await githubService.getRepositoryStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch GitHub stats" });
    }
  });

  app.get("/api/github/repos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const details = await githubService.getRepositoryDetails(id);

      if (!details) {
        return res.status(404).json({ error: "Repository not found" });
      }

      res.json(details);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repository details" });
    }
  });

  // Email API routes
  app.get("/api/emails", async (req, res) => {
    try {
      const emails = await storage.getEmails();
      res.json(emails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  });

  app.post("/api/emails", async (req, res) => {
    try {
      const emailData = insertEmailSchema.parse(req.body);
      const email = await emailService.sendEmail(emailData);
      res.status(201).json(email);
    } catch (error) {
      res.status(400).json({ error: "Invalid email data" });
    }
  });

  app.get("/api/emails/templates", async (req, res) => {
    try {
      const templates = emailService.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email templates" });
    }
  });

  app.get("/api/emails/stats", async (req, res) => {
    try {
      const stats = await emailService.getEmailStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email stats" });
    }
  });

  // Reports API routes
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/templates", async (req, res) => {
    try {
      const templates = reportsService.getAvailableReports();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report templates" });
    }
  });

  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { type, parameters } = req.body;
      const report = await reportsService.generateReport(type, parameters);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getReport(id);

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  app.get("/api/reports/:id/content", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const content = await reportsService.getReportContent(id);

      if (!content) {
        return res.status(404).json({ error: "Report content not found" });
      }

      res.setHeader('Content-Type', 'text/markdown');
      res.send(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report content" });
    }
  });

  // Documentation API routes
  app.get("/api/docs", async (req, res) => {
    try {
      const { category, search } = req.query;
      let documents = await storage.getDocuments();

      if (category) {
        documents = await storage.getDocumentsByCategory(String(category));
      }

      if (search) {
        documents = await docsService.searchDocuments(String(search));
      }

      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/docs", async (req, res) => {
    try {
      const docData = insertDocumentSchema.parse(req.body);
      const document = await docsService.createDocument(docData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ error: "Invalid document data" });
    }
  });

  app.get("/api/docs/categories/stats", async (req, res) => {
    try {
      const stats = await docsService.getCategoryStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category stats" });
    }
  });

  app.get("/api/docs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.get("/api/docs/:id/content", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const content = await docsService.getDocumentContent(id);

      if (!content) {
        return res.status(404).json({ error: "Document content not found" });
      }

      res.setHeader('Content-Type', 'text/markdown');
      res.send(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document content" });
    }
  });

  app.put("/api/docs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const docData = insertDocumentSchema.partial().parse(req.body);
      const document = await docsService.updateDocument(id, docData);

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      res.status(400).json({ error: "Invalid document data" });
    }
  });

  app.delete("/api/docs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await docsService.deleteDocument(id);

      if (!deleted) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
