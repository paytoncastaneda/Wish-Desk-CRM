# Sugarwish CRM - Node.js Documentation

## Overview
This document covers the Node.js backend implementation for the Sugarwish CRM system, including server architecture, API design, middleware, and deployment strategies.

## Server Architecture

### Express.js Application Structure
```javascript
// server/index.ts - Main server entry point
import express from "express";
import { registerRoutes } from "./routes.js";
import { setupVite } from "./vite.js";

const app = express();
const port = process.env.PORT || 5000;

// Middleware stack
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes registration
const server = await registerRoutes(app);

// Development setup with Vite
if (process.env.NODE_ENV === 'development') {
  await setupVite(app, server);
}

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### Environment Configuration
```javascript
// Environment variables management
const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  databaseUrl: process.env.DATABASE_URL,
  pgHost: process.env.PGHOST,
  pgPort: parseInt(process.env.PGPORT || '5432'),
  pgDatabase: process.env.PGDATABASE,
  pgUser: process.env.PGUSER,
  pgPassword: process.env.PGPASSWORD,
  
  // Session configuration
  sessionSecret: process.env.SESSION_SECRET || 'sugarwish-crm-secret',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // File upload limits
  maxFileSize: '50mb',
  maxRequestSize: '100mb'
};

export default config;
```

## Database Integration

### PostgreSQL Connection with Drizzle ORM
```javascript
// server/db.ts - Database connection setup
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Connection pool configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Drizzle ORM instance
export const db = drizzle({ client: pool, schema });

// Connection health check
export const checkDatabaseHealth = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    return { healthy: true, timestamp: result.rows[0].now };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { healthy: false, error: error.message };
  }
};
```

### Data Access Layer (Repository Pattern)
```javascript
// server/storage.ts - Database operations
import { users, tasks, emails, reports, documentation } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Task operations
  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
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
    const [task] = await db.update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Advanced querying with filters
  async getTasksWithFilters(filters: TaskFilters): Promise<Task[]> {
    let query = db.select().from(tasks);
    
    const conditions = [];
    if (filters.status) conditions.push(eq(tasks.status, filters.status));
    if (filters.priority) conditions.push(eq(tasks.priority, filters.priority));
    if (filters.assignedTo) conditions.push(eq(tasks.assignedTo, filters.assignedTo));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(tasks.createdAt));
  }
}
```

## API Design & Routes

### RESTful API Structure
```javascript
// server/routes.ts - API endpoint definitions
import { Router } from "express";
import { storage } from "./storage.js";
import { insertTaskSchema, insertEmailSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard analytics endpoints
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const [tasks, emails, reports, documentation] = await Promise.all([
        storage.getAllTasks(),
        storage.getAllEmails(),
        storage.getAllReports(),
        storage.getAllDocumentation()
      ]);

      const stats = {
        activeTasks: tasks.filter(task => task.status !== 'completed').length,
        emailsSent: emails.filter(email => email.status === 'sent').length,
        reportsGenerated: reports.filter(report => report.status === 'completed').length,
        documentation: documentation.length
      };

      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Task management endpoints
  app.get("/api/tasks", async (req, res) => {
    try {
      const { status, priority, assignedTo, search } = req.query;
      const filters = { status, priority, assignedTo, search } as TaskFilters;
      
      const tasks = await storage.getTasksWithFilters(filters);
      res.json(tasks);
    } catch (error) {
      console.error("Tasks fetch error:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Task creation error:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Email management endpoints
  app.post("/api/emails", async (req, res) => {
    try {
      const validatedData = insertEmailSchema.parse(req.body);
      const email = await storage.createEmail(validatedData);
      
      // Send email asynchronously
      emailService.sendEmail(email.id).catch(err => 
        console.error("Email sending failed:", err)
      );
      
      res.status(201).json(email);
    } catch (error) {
      console.error("Email creation error:", error);
      res.status(400).json({ message: "Failed to create email" });
    }
  });

  return server;
}
```

### Request/Response Middleware
```javascript
// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation failed', 
      details: err.message 
    });
  }
  
  if (err.name === 'DatabaseError') {
    return res.status(500).json({ 
      message: 'Database operation failed' 
    });
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

## Services & Business Logic

### Email Service
```javascript
// server/services/email.ts
class EmailService {
  async sendEmail(emailId: number): Promise<void> {
    try {
      const email = await storage.getEmail(emailId);
      if (!email) throw new Error('Email not found');

      // Update status to sending
      await storage.updateEmail(emailId, { status: 'sending' });

      // Simulate email sending (replace with actual email service)
      await this.processEmailSending(email);

      // Update status to sent
      await storage.updateEmail(emailId, { 
        status: 'sent', 
        sentAt: new Date() 
      });

      console.log(`Email ${emailId} sent successfully`);
    } catch (error) {
      console.error(`Email sending failed for ${emailId}:`, error);
      await storage.updateEmail(emailId, { status: 'failed' });
      throw error;
    }
  }

  private async processEmailSending(email: Email): Promise<void> {
    // Email sending logic would go here
    // Integration with SendGrid, AWS SES, etc.
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to Sugarwish!',
        body: 'Thank you for joining Sugarwish...',
        category: 'system',
        usage: 0
      },
      {
        id: 'notification',
        name: 'Notification Email', 
        subject: 'Important Update',
        body: 'We have an important update...',
        category: 'system',
        usage: 0
      }
    ];
  }
}

export const emailService = new EmailService();
```

### Report Generation Service
```javascript
// server/services/reports.ts
class ReportsService {
  async generateReport(reportId: number): Promise<void> {
    try {
      const report = await storage.getReport(reportId);
      if (!report) throw new Error('Report not found');

      // Update status to generating
      await storage.updateReport(reportId, { status: 'generating' });

      // Generate report data based on type
      const reportData = await this.generateReportData(report.type);

      // Update with generated data
      await storage.updateReport(reportId, {
        status: 'completed',
        data: reportData,
        generatedAt: new Date()
      });

      console.log(`Report ${reportId} generated successfully`);
    } catch (error) {
      console.error(`Report generation failed for ${reportId}:`, error);
      await storage.updateReport(reportId, { status: 'failed' });
      throw error;
    }
  }

  private async generateReportData(type: string): Promise<any> {
    switch (type) {
      case 'task-performance':
        return await this.generateTaskPerformanceData();
      case 'email-campaign':
        return await this.generateEmailCampaignData();
      case 'system-usage':
        return await this.generateSystemUsageData();
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  private async generateTaskPerformanceData(): Promise<any> {
    const tasks = await storage.getAllTasks();
    const completedTasks = tasks.filter(task => task.status === 'completed');
    
    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      averageCompletionTime: this.calculateAverageCompletionTime(completedTasks),
      tasksByPriority: this.groupTasksByPriority(tasks),
      tasksByStatus: this.groupTasksByStatus(tasks)
    };
  }

  private calculateAverageCompletionTime(completedTasks: Task[]): number {
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => {
      if (task.completedAt && task.createdAt) {
        return sum + (task.completedAt.getTime() - task.createdAt.getTime());
      }
      return sum;
    }, 0);
    
    return totalTime / completedTasks.length / (1000 * 60 * 60); // Convert to hours
  }
}

export const reportsService = new ReportsService();
```

## Performance & Optimization

### Caching Strategies
```javascript
// In-memory caching for frequently accessed data
class CacheService {
  private cache = new Map<string, { data: any; expiry: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cacheService = new CacheService();

// Usage in routes
app.get("/api/dashboard/stats", async (req, res) => {
  const cacheKey = 'dashboard:stats';
  let stats = cacheService.get(cacheKey);
  
  if (!stats) {
    stats = await generateDashboardStats();
    cacheService.set(cacheKey, stats, 2 * 60 * 1000); // 2 minutes
  }
  
  res.json(stats);
});
```

### Database Query Optimization
```javascript
// Batch operations for better performance
export class OptimizedDatabaseStorage extends DatabaseStorage {
  async createMultipleTasks(tasksList: InsertTask[]): Promise<Task[]> {
    return await db.insert(tasks).values(tasksList).returning();
  }

  async getTasksWithPagination(page: number, limit: number): Promise<{
    tasks: Task[];
    total: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;
    
    const [taskResults, countResult] = await Promise.all([
      db.select().from(tasks)
        .orderBy(desc(tasks.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(tasks)
    ]);
    
    const total = countResult[0].count;
    
    return {
      tasks: taskResults,
      total,
      hasMore: offset + limit < total
    };
  }

  // Database connection pooling
  async executeTransaction<T>(
    operation: (tx: Transaction) => Promise<T>
  ): Promise<T> {
    return await db.transaction(operation);
  }
}
```

## Security Implementation

### Input Validation & Sanitization
```javascript
import validator from 'validator';
import { z } from 'zod';

// Input sanitization middleware
const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = validator.escape(req.body[key].trim());
      }
    }
  }
  next();
};

// Schema-based validation
const validateTaskInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = insertTaskSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ 
      message: 'Invalid input data',
      errors: error.errors
    });
  }
};

// Rate limiting
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', apiLimiter);
```

### Session Management
```javascript
import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';

const PgSession = ConnectPgSimple(session);

app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'user_sessions'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Protected routes
app.use('/api/tasks', requireAuth);
app.use('/api/emails', requireAuth);
app.use('/api/reports', requireAuth);
```

## Testing & Quality Assurance

### Unit Testing with Jest
```javascript
// tests/services/email.test.js
import { emailService } from '../server/services/email';
import { storage } from '../server/storage';

jest.mock('../server/storage');

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should send email successfully', async () => {
    const mockEmail = {
      id: 1,
      to: 'test@example.com',
      subject: 'Test Email',
      body: 'Test Body',
      status: 'pending'
    };

    storage.getEmail.mockResolvedValue(mockEmail);
    storage.updateEmail.mockResolvedValue(mockEmail);

    await emailService.sendEmail(1);

    expect(storage.updateEmail).toHaveBeenCalledWith(1, { 
      status: 'sent', 
      sentAt: expect.any(Date) 
    });
  });

  test('should handle email sending failure', async () => {
    storage.getEmail.mockResolvedValue(null);

    await expect(emailService.sendEmail(999)).rejects.toThrow('Email not found');
  });
});
```

### Integration Testing
```javascript
// tests/routes/tasks.test.js
import request from 'supertest';
import { app } from '../server/index';

describe('Tasks API', () => {
  test('GET /api/tasks should return tasks list', async () => {
    const response = await request(app)
      .get('/api/tasks')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/tasks should create new task', async () => {
    const taskData = {
      title: 'Test Task',
      description: 'Test Description',
      priority: 'medium',
      status: 'pending'
    };

    const response = await request(app)
      .post('/api/tasks')
      .send(taskData)
      .expect(201);

    expect(response.body.title).toBe(taskData.title);
    expect(response.body.id).toBeDefined();
  });

  test('PUT /api/tasks/:id should update task', async () => {
    const updateData = { status: 'completed' };

    const response = await request(app)
      .put('/api/tasks/1')
      .send(updateData)
      .expect(200);

    expect(response.body.status).toBe('completed');
  });
});
```

## Deployment & Production

### Production Configuration
```javascript
// Production environment setup
if (process.env.NODE_ENV === 'production') {
  // Enable trust proxy for load balancers
  app.set('trust proxy', 1);
  
  // Compression middleware
  app.use(compression());
  
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  }));
  
  // Static file serving
  app.use(express.static('dist', { 
    maxAge: '1y',
    etag: true
  }));
}
```

### Health Checks & Monitoring
```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth.healthy ? 'healthy' : 'unhealthy',
        server: 'healthy'
      },
      version: process.env.npm_package_version || '1.0.0'
    };
    
    res.status(dbHealth.healthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    console.log('HTTP server closed');
    
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});
```

### Process Management
```bash
# Package.json scripts
{
  "scripts": {
    "start": "node dist/server/index.js",
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "tsc && vite build",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

This comprehensive Node.js documentation covers server architecture, database integration, API design, security, testing, and deployment for the Sugarwish CRM system.