import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users, tasks, emails, reports, documentation, taskCategories, rolePermissions, auditLogs, swcrmOutreachTemplates, swcrmTemplateUsage } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { authenticate, requireRole, requirePermission, auditLog, type AuthenticatedRequest } from "./middleware/auth";
import { githubService } from "./services/github";
import { emailService } from "./services/email";
import { reportsService } from "./services/reports";
import { documentationService } from "./services/documentation";
import { insertTaskSchema, insertEmailSchema, insertReportSchema, insertDocumentationSchema, insertTaskCategorySchema, insertUserSchema, insertRolePermissionSchema, insertSwcrmOutreachTemplateSchema, insertSwcrmTemplateUsageSchema } from "@shared/schema";

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

  // Admin Hub API Routes - Task Categories
  app.get("/api/admin/task-categories", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const categories = await db.select().from(taskCategories);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching task categories:", error);
      res.status(500).json({ error: "Failed to fetch task categories" });
    }
  });

  app.post("/api/admin/task-categories", authenticate, requireRole("admin"), auditLog("create", "task_category"), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertTaskCategorySchema.parse({
        ...req.body,
        createdBy: req.user?.id
      });
      
      const [category] = await db.insert(taskCategories).values(validatedData).returning();
      res.json(category);
    } catch (error) {
      console.error("Error creating task category:", error);
      res.status(500).json({ error: "Failed to create task category" });
    }
  });

  app.put("/api/admin/task-categories/:id", authenticate, requireRole("admin"), auditLog("update", "task_category"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTaskCategorySchema.partial().parse(req.body);
      
      const [category] = await db
        .update(taskCategories)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(taskCategories.id, id))
        .returning();
      
      res.json(category);
    } catch (error) {
      console.error("Error updating task category:", error);
      res.status(500).json({ error: "Failed to update task category" });
    }
  });

  app.delete("/api/admin/task-categories/:id", authenticate, requireRole("admin"), auditLog("delete", "task_category"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(taskCategories).where(eq(taskCategories.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task category:", error);
      res.status(500).json({ error: "Failed to delete task category" });
    }
  });

  // Admin Hub API Routes - User Management
  app.get("/api/admin/users", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }).from(users);
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", authenticate, requireRole("admin"), auditLog("create", "user"), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const [user] = await db.insert(users).values(validatedData).returning({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", authenticate, requireRole("admin"), auditLog("update", "user"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertUserSchema.partial().parse(req.body);
      
      const [user] = await db
        .update(users)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Admin Hub API Routes - Role Permissions
  app.get("/api/admin/role-permissions", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const permissions = await db.select().from(rolePermissions);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ error: "Failed to fetch role permissions" });
    }
  });

  app.put("/api/admin/role-permissions/:role/:resource", authenticate, requireRole("admin"), auditLog("update", "role_permission"), async (req, res) => {
    try {
      const { role, resource } = req.params;
      const validatedData = insertRolePermissionSchema.parse({ ...req.body, role, resource });
      
      const [permission] = await db
        .insert(rolePermissions)
        .values(validatedData)
        .onConflictDoUpdate({
          target: [rolePermissions.role, rolePermissions.resource],
          set: { 
            actions: validatedData.actions,
            conditions: validatedData.conditions,
            updatedAt: new Date()
          }
        })
        .returning();
      
      res.json(permission);
    } catch (error) {
      console.error("Error updating role permission:", error);
      res.status(500).json({ error: "Failed to update role permission" });
    }
  });

  // Admin Hub API Routes - Audit Logs
  app.get("/api/admin/audit-logs", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const logs = await db
        .select()
        .from(auditLogs)
        .orderBy(auditLogs.createdAt)
        .limit(100);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Email Template API Routes
  app.get("/api/email-templates", authenticate, async (req, res) => {
    try {
      const templates = await db.select().from(swcrmOutreachTemplates).where(eq(swcrmOutreachTemplates.isActive, true));
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ error: "Failed to fetch email templates" });
    }
  });

  app.post("/api/email-templates", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const templateData = {
        name: req.body.name,
        subject: req.body.subject,
        htmlContent: req.body.htmlContent,
        assignedUserId: req.body.assignedUserId || null,
        category: req.body.category || 'general',
        isGlobal: req.body.isGlobal || false,
        createdBy: req.user?.id || 1,
        isActive: true
      };
      
      const [template] = await db.insert(swcrmOutreachTemplates).values(templateData).returning();
      res.json(template);
    } catch (error) {
      console.error("Error creating email template:", error);
      res.status(500).json({ error: "Failed to create email template" });
    }
  });

  app.put("/api/email-templates/:id", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const templateData = {
        name: req.body.name,
        subject: req.body.subject,
        htmlContent: req.body.htmlContent,
        assignedUserId: req.body.assignedUserId || null,
        category: req.body.category || 'general',
        isGlobal: req.body.isGlobal || false,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true
      };
      
      const [template] = await db
        .update(swcrmOutreachTemplates)
        .set({ ...templateData, updatedAt: new Date() })
        .where(eq(swcrmOutreachTemplates.id, id))
        .returning();
      
      res.json(template);
    } catch (error) {
      console.error("Error updating email template:", error);
      res.status(500).json({ error: "Failed to update email template" });
    }
  });

  app.delete("/api/email-templates/:id", authenticate, requirePermission("templates", "delete"), auditLog("delete", "email_template"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db
        .update(swcrmOutreachTemplates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(swcrmOutreachTemplates.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting email template:", error);
      res.status(500).json({ error: "Failed to delete email template" });
    }
  });

  // Email stats endpoint
  app.get("/api/emails/stats", authenticate, async (req, res) => {
    try {
      const stats = {
        sentToday: 0,
        openRate: 85,
        pending: 0,
        total: 0
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching email stats:", error);
      res.status(500).json({ error: "Failed to fetch email stats" });
    }
  });

  // Enhanced Email sending with template tracking
  app.post("/api/emails/send", authenticate, requirePermission("emails", "create"), auditLog("send", "email"), async (req: AuthenticatedRequest, res) => {
    try {
      const { to, subject, body, templateId } = req.body;
      
      // Create email record
      const [email] = await db.insert(emails).values({
        to,
        subject,
        body,
        templateId,
        status: "sent",
        sentAt: new Date()
      }).returning();

      // Track template usage if template was used
      if (templateId) {
        await db.insert(swcrmTemplateUsage).values({
          templateId,
          usedBy: req.user?.id,
          recipientEmail: to
        });
      }

      // Here you would integrate with your actual email service
      console.log("Email sent:", { to, subject });
      
      res.json(email);
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Gift Concierge Dashboard API Routes
  app.get("/api/gc/sales-performance", authenticate, requireRole("gc"), async (req: AuthenticatedRequest, res) => {
    try {
      // Sample data - these would be replaced with actual SQL queries
      const salesData = {
        mtd: 45000,
        lastMonth: 52000,
        twoMonthsAgo: 48000,
        activeTasks: 12,
        emailsSent: 34,
        taskCompletionRate: 85
      };
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching GC sales performance:", error);
      res.status(500).json({ error: "Failed to fetch sales performance" });
    }
  });

  app.get("/api/gc/team-comparison", authenticate, requireRole("gc"), async (req, res) => {
    try {
      // Sample team data - would be replaced with actual queries
      const teamData = [
        { name: "Sarah Johnson", sales: 65000, change: "+15%" },
        { name: "Mike Chen", sales: 58000, change: "+12%" },
        { name: "Lisa Davis", sales: 52000, change: "+8%" },
        { name: "Current User", sales: 45000, change: "+12%" },
        { name: "Tom Wilson", sales: 42000, change: "+5%" }
      ];
      res.json(teamData);
    } catch (error) {
      console.error("Error fetching team comparison:", error);
      res.status(500).json({ error: "Failed to fetch team comparison" });
    }
  });

  app.get("/api/gc/domains", authenticate, requireRole("gc"), async (req, res) => {
    try {
      const filter = req.query.filter || "lifetime";
      // Sample domain data - would be replaced with actual queries
      const domainsData = [
        { domain: "techcorp.com", companyCount: 15, revenue: 125000 },
        { domain: "innovate.org", companyCount: 12, revenue: 98000 },
        { domain: "globalinc.net", companyCount: 8, revenue: 76000 },
        { domain: "startup.io", companyCount: 6, revenue: 45000 },
        { domain: "enterprise.biz", companyCount: 4, revenue: 32000 }
      ];
      res.json(domainsData);
    } catch (error) {
      console.error("Error fetching domains:", error);
      res.status(500).json({ error: "Failed to fetch domains" });
    }
  });

  app.get("/api/gc/opportunities", authenticate, requireRole("gc"), async (req, res) => {
    try {
      // Sample opportunities data - would be replaced with actual Insightly integration
      const opportunitiesData = [
        {
          id: 1,
          name: "TechCorp Q1 Package",
          value: 15000,
          shipDate: "2024-02-15",
          lastActivity: "2024-01-20",
          nextActivity: "2024-01-25",
          insightlyUrl: "https://sugarwish.insight.ly/opportunities/12345"
        },
        {
          id: 2,
          name: "Global Inc Holiday Campaign",
          value: 8500,
          shipDate: "2024-02-28",
          lastActivity: "2024-01-18",
          nextActivity: "2024-01-30",
          insightlyUrl: "https://sugarwish.insight.ly/opportunities/12346"
        }
      ];
      res.json(opportunitiesData);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ error: "Failed to fetch opportunities" });
    }
  });

  app.get("/api/gc/sales-details/:period", authenticate, requireRole("gc"), async (req, res) => {
    try {
      const period = req.params.period;
      // Sample detailed sales data - would be replaced with actual queries
      const salesDetails = [
        { company: "TechCorp Solutions", amount: 12500, date: "2024-01-15" },
        { company: "Innovate Labs", amount: 8750, date: "2024-01-12" },
        { company: "Global Enterprises", amount: 15200, date: "2024-01-08" },
        { company: "Startup Inc", amount: 6800, date: "2024-01-05" }
      ];
      res.json(salesDetails);
    } catch (error) {
      console.error("Error fetching sales details:", error);
      res.status(500).json({ error: "Failed to fetch sales details" });
    }
  });

  app.get("/api/gc/domain-details/:domain", authenticate, requireRole("gc"), async (req, res) => {
    try {
      const domain = req.params.domain;
      // Sample domain organization data - would be replaced with actual queries
      const domainDetails = {
        organizations: [
          {
            name: "TechCorp Solutions",
            lastOrderDate: "2024-01-15",
            lastCreditDate: "2024-01-10",
            lifetimeRevenue: 125000,
            mtdRevenue: 25000,
            recentActivity: "Inbound inquiry about Q1 packages"
          },
          {
            name: "TechCorp Marketing",
            lastOrderDate: "2023-12-20",
            lastCreditDate: "2023-12-18",
            lifetimeRevenue: 85000,
            mtdRevenue: 15000,
            recentActivity: "Follow-up call scheduled"
          }
        ]
      };
      res.json(domainDetails);
    } catch (error) {
      console.error("Error fetching domain details:", error);
      res.status(500).json({ error: "Failed to fetch domain details" });
    }
  });

  // AI-assisted template generation
  app.post("/api/email-templates/generate", authenticate, async (req, res) => {
    try {
      const { description, tone, purpose } = req.body;
      
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `Create a professional HTML email template for Sugarwish (a gift company) based on this description: "${description}". 

      Tone: ${tone || 'professional and friendly'}
      Purpose: ${purpose || 'general outreach'}

      Requirements:
      - Use Sugarwish brand colors (gold #D4AF37, brown #8B4513)
      - Include placeholders like {{customer_name}}, {{gc_name}}, {{company_name}}
      - Professional email structure with header, content, and footer
      - Mobile-responsive design
      - Include a call-to-action button
      - Maximum width 600px
      - Clean, modern design

      Return only the HTML code without any explanations.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
      });

      const htmlContent = response.choices[0].message.content;
      res.json({ htmlContent });
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  // Email template categories management for Admin Hub
  app.get("/api/admin/email-template-categories", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const categories = [
        { id: 1, name: "general", description: "General purpose templates", isActive: true },
        { id: 2, name: "welcome", description: "Welcome emails for new customers", isActive: true },
        { id: 3, name: "follow-up", description: "Follow-up and check-in emails", isActive: true },
        { id: 4, name: "proposal", description: "Business proposals and offers", isActive: true },
        { id: 5, name: "holiday", description: "Holiday and seasonal campaigns", isActive: true }
      ];
      res.json(categories);
    } catch (error) {
      console.error("Error fetching email template categories:", error);
      res.status(500).json({ error: "Failed to fetch email template categories" });
    }
  });

  app.post("/api/admin/email-template-categories", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const { name, description } = req.body;
      const category = {
        id: Date.now(),
        name: name.toLowerCase(),
        description,
        isActive: true
      };
      res.json(category);
    } catch (error) {
      console.error("Error creating email template category:", error);
      res.status(500).json({ error: "Failed to create email template category" });
    }
  });

  app.put("/api/admin/email-template-categories/:id", authenticate, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description, isActive } = req.body;
      const category = {
        id,
        name: name.toLowerCase(),
        description,
        isActive
      };
      res.json(category);
    } catch (error) {
      console.error("Error updating email template category:", error);
      res.status(500).json({ error: "Failed to update email template category" });
    }
  });

  // Opportunities CRUD operations
  app.get("/api/opportunities", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const opportunities = await storage.getAllOpportunities();
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ error: "Failed to fetch opportunities" });
    }
  });

  app.get("/api/opportunities/:id", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const opportunity = await storage.getOpportunity(id);
      
      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      
      res.json(opportunity);
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      res.status(500).json({ error: "Failed to fetch opportunity" });
    }
  });

  app.post("/api/opportunities", authenticate, requirePermission("opportunities", "create"), auditLog("create", "opportunity"), async (req: AuthenticatedRequest, res) => {
    try {
      const opportunityData = req.body;
      const opportunity = await storage.createOpportunity(opportunityData);
      res.status(201).json(opportunity);
    } catch (error) {
      console.error("Error creating opportunity:", error);
      res.status(500).json({ error: "Failed to create opportunity" });
    }
  });

  app.put("/api/opportunities/:id", authenticate, requirePermission("opportunities", "update"), auditLog("update", "opportunity"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const opportunity = await storage.updateOpportunity(id, updates);
      
      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      
      res.json(opportunity);
    } catch (error) {
      console.error("Error updating opportunity:", error);
      res.status(500).json({ error: "Failed to update opportunity" });
    }
  });

  app.delete("/api/opportunities/:id", authenticate, requirePermission("opportunities", "delete"), auditLog("delete", "opportunity"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOpportunity(id);
      
      if (!success) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      res.status(500).json({ error: "Failed to delete opportunity" });
    }
  });

  // Get companies for opportunity creation
  app.get("/api/companies", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      // Return sample companies for now - this would connect to the sw_company table
      const companies = [
        { id: 1, name: "Sample Company A" },
        { id: 2, name: "Sample Company B" },
        { id: 3, name: "Sample Company C" }
      ];
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  // Get all users for assignment dropdown
  app.get("/api/users", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      // Get users with gc role or admin role for assignment
      const users = [
        { id: 1, username: "admin", firstName: "Admin", lastName: "User", role: "admin" },
        { id: 2, username: "gc1", firstName: "GC", lastName: "One", role: "gc" },
        { id: 3, username: "gc2", firstName: "GC", lastName: "Two", role: "gc" }
      ];
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get current user info
  app.get("/api/user", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Task breakdown endpoint for Active Tasks drill-down
  app.get("/api/tasks/breakdown", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get tasks for the current user that are "Not Started"  
      const userTasks = await storage.getAllTasks();
      const filteredTasks = userTasks.filter(task => 
        task.taskOwner === userId && task.status === "Not Started"
      );

      const breakdown = {
        overdue: 0,
        dueToday: 0,
        dueTomorrow: 0,
        dueFuture: 0
      };

      filteredTasks.forEach(task => {
        if (!task.dateDue) {
          breakdown.dueFuture++;
          return;
        }

        const dueDate = new Date(task.dateDue);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
          breakdown.overdue++;
        } else if (dueDate.getTime() === today.getTime()) {
          breakdown.dueToday++;
        } else if (dueDate.getTime() === tomorrow.getTime()) {
          breakdown.dueTomorrow++;
        } else {
          breakdown.dueFuture++;
        }
      });

      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching task breakdown:", error);
      res.status(500).json({ error: "Failed to fetch task breakdown" });
    }
  });

  // Email breakdown endpoint for Emails Sent drill-down
  app.get("/api/emails/breakdown", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get all emails sent by the current user
      const userEmails = await storage.getAllEmails();
      
      const breakdown = {
        sentYesterday: 0,
        sentToday: 0,
        recentEmails: []
      };

      // Count emails by date and get recent emails
      const recentEmails = [];
      
      userEmails.forEach(email => {
        if (!email.sentAt) return;
        
        const sentDate = new Date(email.sentAt);
        sentDate.setHours(0, 0, 0, 0);

        if (sentDate.getTime() === yesterday.getTime()) {
          breakdown.sentYesterday++;
        } else if (sentDate.getTime() === today.getTime()) {
          breakdown.sentToday++;
        }
        
        recentEmails.push(email);
      });

      // Get 5 most recent emails
      const sortedEmails = recentEmails
        .filter(email => email.sentAt)
        .sort((a, b) => new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime())
        .slice(0, 5);

      breakdown.recentEmails = sortedEmails.map(email => ({
        id: email.id,
        recipient: email.to,
        subject: email.subject,
        sentAt: email.sentAt,
        status: email.status
      }));

      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching email breakdown:", error);
      res.status(500).json({ error: "Failed to fetch email breakdown" });
    }
  });

  // Opportunities breakdown endpoint for Opportunities drill-down
  app.get("/api/opportunities/breakdown", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      // Get all opportunities for the current user
      const userOpportunities = await storage.getOpportunitiesByUser(userId);

      // Calculate close rate for this month
      const thisMonthOpportunities = userOpportunities.filter(opp => {
        if (!opp.actualCloseDate) return false;
        const closeDate = new Date(opp.actualCloseDate);
        return closeDate >= startOfMonth && closeDate <= endOfMonth;
      });

      const wonThisMonth = thisMonthOpportunities.filter(opp => opp.status === 'won').length;
      const totalClosedThisMonth = thisMonthOpportunities.length;
      const closeRate = totalClosedThisMonth > 0 ? Math.round((wonThisMonth / totalClosedThisMonth) * 100) : 0;

      // Categorize open opportunities
      const openOpportunities = userOpportunities.filter(opp => opp.status === 'open');
      
      const breakdown = {
        closeRate,
        overdueOpportunities: 0,
        currentMonthOpportunities: 0,
        futureOpportunities: 0
      };

      openOpportunities.forEach(opp => {
        if (!opp.estimatedShipDate) {
          breakdown.futureOpportunities++;
          return;
        }

        const shipDate = new Date(opp.estimatedShipDate);
        
        if (shipDate < today) {
          breakdown.overdueOpportunities++;
        } else if (shipDate >= startOfMonth && shipDate <= endOfMonth) {
          breakdown.currentMonthOpportunities++;
        } else if (shipDate >= startOfNextMonth) {
          breakdown.futureOpportunities++;
        }
      });

      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching opportunities breakdown:", error);
      res.status(500).json({ error: "Failed to fetch opportunities breakdown" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
