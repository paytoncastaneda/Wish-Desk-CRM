# Sugarwish CRM - PostgreSQL Documentation

## Overview
This document covers the PostgreSQL database implementation for the Sugarwish CRM system, including schema design, query optimization, migrations, and performance tuning.

## Database Architecture

### Connection Configuration
```javascript
// Database connection setup with Neon PostgreSQL
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Maximum number of connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Connection timeout
});

export const db = drizzle({ client: pool, schema });
```

### Environment Variables
```bash
# PostgreSQL Configuration
DATABASE_URL=postgresql://username:password@hostname:5432/database
PGHOST=hostname
PGPORT=5432
PGDATABASE=sugarwish_crm
PGUSER=username
PGPASSWORD=secure_password
```

## Schema Design

### Core Tables Structure

#### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

#### Tasks Table
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  assigned_to VARCHAR(255),
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high'))
);

-- Performance indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_composite ON tasks(status, priority, created_at);
```

#### Emails Table
```sql
CREATE TABLE emails (
  id SERIAL PRIMARY KEY,
  to_address VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  template VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  
  CONSTRAINT emails_status_check CHECK (status IN ('pending', 'sending', 'sent', 'failed'))
);

-- Email tracking indexes
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_sent_at ON emails(sent_at);
CREATE INDEX idx_emails_to_address ON emails(to_address);
CREATE INDEX idx_emails_template ON emails(template);
```

#### Reports Table
```sql
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  data JSONB,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  generated_at TIMESTAMP,
  
  CONSTRAINT reports_status_check CHECK (status IN ('pending', 'generating', 'completed', 'failed'))
);

-- JSONB and performance indexes
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_data_gin ON reports USING GIN(data);
CREATE INDEX idx_reports_config_gin ON reports USING GIN(config);
```

#### Documentation Table
```sql
CREATE TABLE documentation (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  category VARCHAR(100) NOT NULL,
  author VARCHAR(255) NOT NULL,
  file_path VARCHAR(1000),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  
  CONSTRAINT documentation_status_check CHECK (status IN ('draft', 'review', 'published', 'archived'))
);

-- Full-text search and categorization
CREATE INDEX idx_documentation_category ON documentation(category);
CREATE INDEX idx_documentation_status ON documentation(status);
CREATE INDEX idx_documentation_author ON documentation(author);
CREATE INDEX idx_documentation_fts ON documentation USING GIN(to_tsvector('english', title || ' ' || content));
```

## Drizzle ORM Schema Definition

### Schema File Structure
```typescript
// shared/schema.ts
import { pgTable, serial, varchar, text, timestamp, boolean, jsonb, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true)
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("pending"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  statusCheck: check("tasks_status_check", 
    sql`${table.status} IN ('pending', 'in-progress', 'completed', 'cancelled')`),
  priorityCheck: check("tasks_priority_check", 
    sql`${table.priority} IN ('low', 'medium', 'high')`)
}));

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  to: varchar("to_address", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  template: varchar("template", { length: 100 }),
  status: varchar("status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at")
}, (table) => ({
  statusCheck: check("emails_status_check", 
    sql`${table.status} IN ('pending', 'sending', 'sent', 'failed')`)
}));

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("pending"),
  data: jsonb("data"),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
  generatedAt: timestamp("generated_at")
}, (table) => ({
  statusCheck: check("reports_status_check", 
    sql`${table.status} IN ('pending', 'generating', 'completed', 'failed')`)
}));

export const documentation = pgTable("documentation", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 50 }).default("draft"),
  category: varchar("category", { length: 100 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at")
}, (table) => ({
  statusCheck: check("documentation_status_check", 
    sql`${table.status} IN ('draft', 'review', 'published', 'archived')`)
}));
```

## Database Operations

### CRUD Operations with Drizzle
```typescript
import { db } from "./db";
import { tasks, emails, reports, documentation } from "@shared/schema";
import { eq, and, or, desc, asc, count, sum, avg } from "drizzle-orm";

export class DatabaseStorage {
  // Task operations
  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

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

  // Batch operations
  async createMultipleTasks(tasksList: InsertTask[]): Promise<Task[]> {
    return await db.insert(tasks).values(tasksList).returning();
  }

  async bulkUpdateTasks(ids: number[], updates: Partial<InsertTask>): Promise<Task[]> {
    return await db.update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(inArray(tasks.id, ids))
      .returning();
  }
}
```

### Advanced Queries

#### Analytics Queries
```typescript
// Dashboard statistics with aggregations
async getDashboardStats(): Promise<DashboardStats> {
  const [taskStats] = await db.select({
    total: count(),
    pending: count().where(eq(tasks.status, 'pending')),
    inProgress: count().where(eq(tasks.status, 'in-progress')),
    completed: count().where(eq(tasks.status, 'completed'))
  }).from(tasks);

  const [emailStats] = await db.select({
    total: count(),
    sent: count().where(eq(emails.status, 'sent')),
    pending: count().where(eq(emails.status, 'pending')),
    openRate: avg(
      sql<number>`CASE WHEN ${emails.openedAt} IS NOT NULL THEN 1 ELSE 0 END`
    )
  }).from(emails);

  return {
    activeTasks: taskStats.pending + taskStats.inProgress,
    emailsSent: emailStats.sent,
    emailOpenRate: Math.round((emailStats.openRate || 0) * 100),
    totalDocuments: await db.select({ count: count() }).from(documentation)
  };
}

// Time-based analytics with date functions
async getTaskCompletionTrends(days: number = 7): Promise<TaskTrend[]> {
  return await db.select({
    date: sql<string>`DATE(${tasks.completedAt})`,
    completed: count()
  })
  .from(tasks)
  .where(
    and(
      eq(tasks.status, 'completed'),
      gte(tasks.completedAt, sql`NOW() - INTERVAL '${days} days'`)
    )
  )
  .groupBy(sql`DATE(${tasks.completedAt})`)
  .orderBy(sql`DATE(${tasks.completedAt})`);
}
```

#### Full-Text Search
```typescript
// Full-text search in documentation
async searchDocumentation(searchTerm: string): Promise<Documentation[]> {
  return await db.select()
    .from(documentation)
    .where(
      sql`to_tsvector('english', ${documentation.title} || ' ' || ${documentation.content}) 
          @@ plainto_tsquery('english', ${searchTerm})`
    )
    .orderBy(
      sql`ts_rank(
        to_tsvector('english', ${documentation.title} || ' ' || ${documentation.content}),
        plainto_tsquery('english', ${searchTerm})
      ) DESC`
    );
}

// Complex filtering with JSON operations
async getReportsByConfig(configFilter: any): Promise<Report[]> {
  return await db.select()
    .from(reports)
    .where(
      sql`${reports.config} @> ${JSON.stringify(configFilter)}`
    );
}
```

### Transaction Management
```typescript
// Database transactions for data consistency
async createTaskWithEmail(taskData: InsertTask, emailData: InsertEmail): Promise<{
  task: Task;
  email: Email;
}> {
  return await db.transaction(async (tx) => {
    const [task] = await tx.insert(tasks).values(taskData).returning();
    
    const [email] = await tx.insert(emails).values({
      ...emailData,
      subject: `New Task Created: ${task.title}`
    }).returning();
    
    return { task, email };
  });
}

// Rollback on error
async transferTaskOwnership(taskId: number, fromUser: string, toUser: string): Promise<void> {
  await db.transaction(async (tx) => {
    // Verify current owner
    const [currentTask] = await tx.select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.assignedTo, fromUser)));
    
    if (!currentTask) {
      throw new Error('Task not found or user not authorized');
    }
    
    // Update task ownership
    await tx.update(tasks)
      .set({ assignedTo: toUser, updatedAt: new Date() })
      .where(eq(tasks.id, taskId));
    
    // Log the transfer
    await tx.insert(auditLog).values({
      action: 'task_transfer',
      resourceId: taskId,
      fromUser,
      toUser,
      timestamp: new Date()
    });
  });
}
```

## Performance Optimization

### Index Strategies
```sql
-- Composite indexes for common queries
CREATE INDEX idx_tasks_status_priority ON tasks(status, priority);
CREATE INDEX idx_tasks_assigned_due ON tasks(assigned_to, due_date);
CREATE INDEX idx_emails_status_sent ON emails(status, sent_at);

-- Partial indexes for specific conditions
CREATE INDEX idx_active_tasks ON tasks(created_at) WHERE status IN ('pending', 'in-progress');
CREATE INDEX idx_recent_emails ON emails(sent_at) WHERE sent_at > NOW() - INTERVAL '30 days';

-- GIN indexes for JSON columns
CREATE INDEX idx_reports_data_gin ON reports USING GIN(data);
CREATE INDEX idx_reports_config_gin ON reports USING GIN(config);

-- Full-text search indexes
CREATE INDEX idx_documentation_search ON documentation 
USING GIN(to_tsvector('english', title || ' ' || content));
```

### Query Optimization
```typescript
// Pagination with efficient counting
async getTasksWithPagination(page: number, limit: number, filters?: TaskFilters): Promise<{
  tasks: Task[];
  total: number;
  hasMore: boolean;
}> {
  const offset = (page - 1) * limit;
  
  // Use window functions for efficient pagination
  const results = await db.select({
    task: tasks,
    totalCount: sql<number>`COUNT(*) OVER()`
  })
  .from(tasks)
  .where(buildFilterConditions(filters))
  .orderBy(desc(tasks.createdAt))
  .limit(limit)
  .offset(offset);
  
  const tasks = results.map(r => r.task);
  const total = results[0]?.totalCount || 0;
  
  return {
    tasks,
    total,
    hasMore: offset + limit < total
  };
}

// Optimized aggregation queries
async getTaskStatsByUser(): Promise<UserTaskStats[]> {
  return await db.select({
    assignedTo: tasks.assignedTo,
    total: count(),
    completed: count().where(eq(tasks.status, 'completed')),
    pending: count().where(eq(tasks.status, 'pending')),
    avgCompletionTime: avg(
      sql<number>`EXTRACT(EPOCH FROM (${tasks.completedAt} - ${tasks.createdAt})) / 3600`
    ).where(eq(tasks.status, 'completed'))
  })
  .from(tasks)
  .where(isNotNull(tasks.assignedTo))
  .groupBy(tasks.assignedTo)
  .orderBy(desc(count()));
}
```

### Connection Pooling
```typescript
// Advanced connection pool configuration
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                     // Maximum pool size
  min: 5,                      // Minimum pool size
  idleTimeoutMillis: 30000,    // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Connection timeout
  allowExitOnIdle: true,       // Allow process to exit when idle
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

// Connection health monitoring
export const monitorConnections = () => {
  setInterval(() => {
    console.log('Pool stats:', {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    });
  }, 30000);
};
```

## Database Migrations

### Migration Scripts
```sql
-- Migration: 001_initial_schema.sql
BEGIN;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  assigned_to VARCHAR(255),
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

COMMIT;
```

```sql
-- Migration: 002_add_email_tracking.sql
BEGIN;

ALTER TABLE emails ADD COLUMN opened_at TIMESTAMP;
ALTER TABLE emails ADD COLUMN template VARCHAR(100);

CREATE INDEX idx_emails_opened_at ON emails(opened_at);
CREATE INDEX idx_emails_template ON emails(template);

COMMIT;
```

### Drizzle Migration Configuration
```typescript
// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

## Backup and Recovery

### Automated Backups
```bash
#!/bin/bash
# backup-script.sh

# Environment variables
export PGPASSWORD=$PGPASSWORD
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="sugarwish_crm_backup_$DATE.sql"

# Create backup
pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
  --verbose --clean --no-acl --no-owner \
  --file="$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Point-in-Time Recovery
```sql
-- Create restore point
SELECT pg_create_restore_point('before_major_update');

-- Recovery commands (if needed)
-- This would be run during database recovery process
SELECT pg_switch_wal();
```

## Monitoring and Maintenance

### Database Health Checks
```typescript
// Health monitoring functions
export const checkDatabaseHealth = async (): Promise<HealthStatus> => {
  try {
    const start = Date.now();
    
    // Test basic connectivity
    const result = await pool.query('SELECT NOW(), version()');
    const responseTime = Date.now() - start;
    
    // Check active connections
    const connectionsResult = await pool.query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    
    // Check table sizes
    const tableSizes = await pool.query(`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(tablename::regclass) DESC
    `);
    
    return {
      healthy: true,
      responseTime,
      serverVersion: result.rows[0].version,
      connections: connectionsResult.rows[0],
      tableSizes: tableSizes.rows,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};
```

### Performance Monitoring
```sql
-- Query performance monitoring
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  min_time,
  max_time,
  stddev_time
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Table statistics
SELECT 
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables;
```

## Security Implementation

### Row-Level Security
```sql
-- Enable RLS on sensitive tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY task_access_policy ON tasks
  FOR ALL TO authenticated_users
  USING (assigned_to = current_user OR 'admin' = ANY(current_user_roles()));

-- Create policy for managers
CREATE POLICY task_manager_policy ON tasks
  FOR ALL TO authenticated_users
  USING ('manager' = ANY(current_user_roles()));
```

### Data Encryption
```sql
-- Encrypt sensitive columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt user passwords
INSERT INTO users (username, email, password_hash) 
VALUES ('user1', 'user@example.com', crypt('password', gen_salt('bf', 8)));

-- Verify password
SELECT * FROM users 
WHERE username = 'user1' 
AND password_hash = crypt('password', password_hash);
```

## AWS EC2 Integration Preparation

### Database Connection for EC2
```typescript
// Production configuration for EC2 deployment
const productionConfig = {
  // Connection string for EC2-hosted PostgreSQL
  connectionString: process.env.DATABASE_URL,
  
  // SSL configuration for secure connections
  ssl: {
    require: true,
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
    key: fs.readFileSync('/path/to/client-key.key').toString(),
    cert: fs.readFileSync('/path/to/client-cert.crt').toString(),
  },
  
  // Connection pooling for high availability
  max: 50,
  min: 10,
  acquire: 30000,
  idle: 10000
};
```

### Data Migration Strategy
```typescript
// Migration utilities for EC2 transition
export class MigrationService {
  async exportData(): Promise<void> {
    const tables = ['users', 'tasks', 'emails', 'reports', 'documentation'];
    
    for (const table of tables) {
      const data = await db.select().from(table);
      await fs.writeFile(
        `./migration-data/${table}.json`,
        JSON.stringify(data, null, 2)
      );
    }
  }
  
  async importData(): Promise<void> {
    // Implementation for importing data to EC2 PostgreSQL instance
    // This would be used during the migration to AWS EC2
  }
}
```

This comprehensive PostgreSQL documentation covers schema design, query optimization, performance tuning, and migration strategies for the Sugarwish CRM system.