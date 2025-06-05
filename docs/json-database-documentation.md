# Sugarwish CRM - JSON Database Documentation

## Overview
This document covers JSON data structures, NoSQL database implementations, and JSON-based data handling patterns for the Sugarwish CRM system.

## JSON Data Structures

### Core Entity Schemas

#### Task JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Task",
  "properties": {
    "id": {
      "type": "integer",
      "description": "Unique task identifier"
    },
    "title": {
      "type": "string",
      "maxLength": 500,
      "description": "Task title"
    },
    "description": {
      "type": ["string", "null"],
      "description": "Task description"
    },
    "status": {
      "type": "string",
      "enum": ["pending", "in-progress", "completed", "cancelled"],
      "default": "pending"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "default": "medium"
    },
    "assignedTo": {
      "type": ["string", "null"],
      "description": "Username of assigned user"
    },
    "dueDate": {
      "type": ["string", "null"],
      "format": "date-time"
    },
    "completedAt": {
      "type": ["string", "null"],
      "format": "date-time"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "tags": {
          "type": "array",
          "items": {"type": "string"}
        },
        "estimatedHours": {"type": "number"},
        "actualHours": {"type": "number"},
        "difficulty": {
          "type": "string",
          "enum": ["easy", "medium", "hard"]
        }
      }
    }
  },
  "required": ["id", "title", "status", "priority", "createdAt"]
}
```

#### Email JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Email",
  "properties": {
    "id": {"type": "integer"},
    "to": {
      "type": "string",
      "format": "email",
      "description": "Recipient email address"
    },
    "subject": {
      "type": "string",
      "maxLength": 500
    },
    "body": {"type": "string"},
    "template": {
      "type": ["string", "null"],
      "description": "Template identifier"
    },
    "status": {
      "type": "string",
      "enum": ["pending", "sending", "sent", "failed"]
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "sentAt": {
      "type": ["string", "null"],
      "format": "date-time"
    },
    "openedAt": {
      "type": ["string", "null"],
      "format": "date-time"
    },
    "trackingData": {
      "type": "object",
      "properties": {
        "deliveryAttempts": {"type": "integer"},
        "bounceReason": {"type": "string"},
        "userAgent": {"type": "string"},
        "ipAddress": {"type": "string"},
        "clickTracking": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "url": {"type": "string"},
              "clickedAt": {"type": "string", "format": "date-time"},
              "count": {"type": "integer"}
            }
          }
        }
      }
    }
  },
  "required": ["id", "to", "subject", "body", "status", "createdAt"]
}
```

#### Report JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Report",
  "properties": {
    "id": {"type": "integer"},
    "title": {"type": "string"},
    "type": {
      "type": "string",
      "enum": ["task-performance", "email-campaign", "system-usage", "team-productivity"]
    },
    "description": {"type": ["string", "null"]},
    "status": {
      "type": "string",
      "enum": ["pending", "generating", "completed", "failed"]
    },
    "config": {
      "type": "object",
      "properties": {
        "dateRange": {
          "type": "object",
          "properties": {
            "start": {"type": "string", "format": "date"},
            "end": {"type": "string", "format": "date"}
          },
          "required": ["start", "end"]
        },
        "filters": {
          "type": "object",
          "properties": {
            "users": {"type": "array", "items": {"type": "string"}},
            "departments": {"type": "array", "items": {"type": "string"}},
            "status": {"type": "array", "items": {"type": "string"}},
            "priority": {"type": "array", "items": {"type": "string"}}
          }
        },
        "groupBy": {
          "type": "string",
          "enum": ["user", "department", "priority", "status", "date"]
        },
        "includeCharts": {"type": "boolean"},
        "exportFormat": {
          "type": "string",
          "enum": ["pdf", "excel", "csv", "json"]
        }
      },
      "required": ["dateRange"]
    },
    "data": {
      "type": "object",
      "properties": {
        "summary": {
          "type": "object",
          "properties": {
            "totalRecords": {"type": "integer"},
            "completionRate": {"type": "number"},
            "averageTime": {"type": "number"},
            "trendsDirection": {"type": "string", "enum": ["up", "down", "stable"]}
          }
        },
        "metrics": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "category": {"type": "string"},
              "value": {"type": "number"},
              "unit": {"type": "string"},
              "change": {"type": "number"},
              "changeDirection": {"type": "string", "enum": ["increase", "decrease", "neutral"]}
            }
          }
        },
        "chartData": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {"type": "string"},
              "value": {"type": "number"},
              "date": {"type": "string", "format": "date"},
              "category": {"type": "string"}
            }
          }
        },
        "details": {
          "type": "array",
          "items": {"type": "object"}
        }
      }
    },
    "createdAt": {"type": "string", "format": "date-time"},
    "generatedAt": {"type": ["string", "null"], "format": "date-time"}
  },
  "required": ["id", "title", "type", "status", "createdAt"]
}
```

## JSON Storage in PostgreSQL

### JSONB Operations
```sql
-- Insert JSON data
INSERT INTO reports (title, type, config, data) VALUES (
  'Weekly Task Report',
  'task-performance',
  '{"dateRange": {"start": "2025-06-01", "end": "2025-06-07"}, "groupBy": "user"}',
  '{"summary": {"totalRecords": 45, "completionRate": 0.87}}'
);

-- Query JSON fields
SELECT 
  title,
  config->>'dateRange' as date_range,
  data->'summary'->>'totalRecords' as total_records
FROM reports 
WHERE type = 'task-performance';

-- JSON path queries
SELECT * FROM reports 
WHERE config @> '{"groupBy": "user"}';

-- JSON array operations
SELECT * FROM reports 
WHERE data->'metrics' @> '[{"category": "completed"}]';

-- Update JSON fields
UPDATE reports 
SET data = jsonb_set(data, '{summary,completionRate}', '0.92')
WHERE id = 1;

-- Extract and aggregate JSON data
SELECT 
  data->'summary'->>'totalRecords' as records,
  AVG((data->'summary'->>'completionRate')::float) as avg_completion_rate
FROM reports 
WHERE type = 'task-performance'
GROUP BY data->'summary'->>'totalRecords';
```

### JSON Indexing Strategies
```sql
-- GIN indexes for JSON columns
CREATE INDEX idx_reports_config_gin ON reports USING GIN(config);
CREATE INDEX idx_reports_data_gin ON reports USING GIN(data);

-- Specific path indexes
CREATE INDEX idx_reports_date_range ON reports USING BTREE((config->'dateRange'->>'start'));
CREATE INDEX idx_reports_completion_rate ON reports USING BTREE(((data->'summary'->>'completionRate')::float));

-- Expression indexes for common queries
CREATE INDEX idx_reports_total_records ON reports USING BTREE(((data->'summary'->>'totalRecords')::int));
```

## JSON Operations in Node.js

### JSON Data Manipulation
```typescript
// Type-safe JSON operations with Zod
import { z } from 'zod';

const TaskMetadataSchema = z.object({
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional()
});

const ReportConfigSchema = z.object({
  dateRange: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  filters: z.object({
    users: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
    status: z.array(z.string()).optional(),
    priority: z.array(z.string()).optional()
  }).optional(),
  groupBy: z.enum(['user', 'department', 'priority', 'status', 'date']).optional(),
  includeCharts: z.boolean().optional(),
  exportFormat: z.enum(['pdf', 'excel', 'csv', 'json']).optional()
});

type TaskMetadata = z.infer<typeof TaskMetadataSchema>;
type ReportConfig = z.infer<typeof ReportConfigSchema>;

// JSON data processing utilities
export class JSONProcessor {
  static validateTaskMetadata(metadata: unknown): TaskMetadata {
    return TaskMetadataSchema.parse(metadata);
  }

  static validateReportConfig(config: unknown): ReportConfig {
    return ReportConfigSchema.parse(config);
  }

  static mergeTaskMetadata(existing: TaskMetadata, updates: Partial<TaskMetadata>): TaskMetadata {
    return {
      ...existing,
      ...updates,
      tags: updates.tags || existing.tags || []
    };
  }

  static calculateTaskMetrics(tasks: Array<{metadata?: TaskMetadata}>): {
    totalEstimated: number;
    totalActual: number;
    efficiency: number;
    difficultyDistribution: Record<string, number>;
  } {
    let totalEstimated = 0;
    let totalActual = 0;
    const difficultyDistribution: Record<string, number> = {};

    tasks.forEach(task => {
      if (task.metadata) {
        totalEstimated += task.metadata.estimatedHours || 0;
        totalActual += task.metadata.actualHours || 0;
        
        const difficulty = task.metadata.difficulty || 'medium';
        difficultyDistribution[difficulty] = (difficultyDistribution[difficulty] || 0) + 1;
      }
    });

    return {
      totalEstimated,
      totalActual,
      efficiency: totalEstimated > 0 ? (totalEstimated / totalActual) * 100 : 0,
      difficultyDistribution
    };
  }
}
```

### Database Operations with JSON
```typescript
// Advanced JSON queries with Drizzle
export class JSONDatabaseOperations {
  async getReportsByDateRange(startDate: string, endDate: string): Promise<Report[]> {
    return await db.select()
      .from(reports)
      .where(
        and(
          sql`${reports.config}->>'dateRange'->>'start' >= ${startDate}`,
          sql`${reports.config}->>'dateRange'->>'end' <= ${endDate}`
        )
      );
  }

  async getTasksByMetadataTags(tags: string[]): Promise<Task[]> {
    return await db.select()
      .from(tasks)
      .where(
        sql`${tasks.metadata}->'tags' ?| array[${tags.join(',')}]`
      );
  }

  async updateReportData(reportId: number, newData: any): Promise<Report | undefined> {
    const [report] = await db.update(reports)
      .set({
        data: sql`${reports.data} || ${JSON.stringify(newData)}`,
        generatedAt: new Date()
      })
      .where(eq(reports.id, reportId))
      .returning();
    
    return report;
  }

  async getEmailAnalytics(): Promise<any> {
    const results = await db.select({
      template: emails.template,
      totalSent: sql<number>`COUNT(*)`,
      opened: sql<number>`COUNT(${emails.openedAt})`,
      openRate: sql<number>`
        ROUND(
          (COUNT(${emails.openedAt})::float / COUNT(*)) * 100, 
          2
        )
      `,
      avgDeliveryTime: sql<number>`
        AVG(EXTRACT(EPOCH FROM (${emails.sentAt} - ${emails.createdAt})) / 60)
      `
    })
    .from(emails)
    .where(eq(emails.status, 'sent'))
    .groupBy(emails.template);

    return results;
  }

  async buildDynamicReport(config: ReportConfig): Promise<any> {
    const { dateRange, filters, groupBy } = config;
    
    let query = db.select();
    
    // Apply date range filter
    if (dateRange) {
      query = query.where(
        and(
          gte(tasks.createdAt, new Date(dateRange.start)),
          lte(tasks.createdAt, new Date(dateRange.end))
        )
      );
    }
    
    // Apply additional filters
    if (filters?.status?.length) {
      query = query.where(inArray(tasks.status, filters.status));
    }
    
    if (filters?.priority?.length) {
      query = query.where(inArray(tasks.priority, filters.priority));
    }
    
    // Group by specified field
    if (groupBy) {
      const groupField = tasks[groupBy as keyof typeof tasks];
      if (groupField) {
        query = query.groupBy(groupField);
      }
    }
    
    return await query.from(tasks);
  }
}
```

## NoSQL Alternative Implementation

### MongoDB-Style Document Structure
```javascript
// Alternative NoSQL implementation using JSON documents
export class DocumentStore {
  constructor() {
    this.collections = new Map();
  }

  // Task document structure
  createTaskDocument(taskData) {
    return {
      _id: this.generateId(),
      _type: 'task',
      _created: new Date().toISOString(),
      _updated: new Date().toISOString(),
      _version: 1,
      
      // Core task data
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      assignedTo: taskData.assignedTo,
      dueDate: taskData.dueDate,
      completedAt: null,
      
      // Metadata and tracking
      metadata: {
        tags: taskData.tags || [],
        estimatedHours: taskData.estimatedHours,
        actualHours: taskData.actualHours,
        difficulty: taskData.difficulty,
        category: taskData.category,
        source: taskData.source || 'manual'
      },
      
      // Audit trail
      auditLog: [{
        action: 'created',
        timestamp: new Date().toISOString(),
        user: taskData.createdBy,
        changes: {}
      }],
      
      // Relationships
      relationships: {
        parentTask: taskData.parentTask,
        dependencies: taskData.dependencies || [],
        relatedEmails: [],
        relatedDocuments: []
      }
    };
  }

  // Email document structure
  createEmailDocument(emailData) {
    return {
      _id: this.generateId(),
      _type: 'email',
      _created: new Date().toISOString(),
      _updated: new Date().toISOString(),
      _version: 1,
      
      // Email data
      to: emailData.to,
      cc: emailData.cc || [],
      bcc: emailData.bcc || [],
      subject: emailData.subject,
      body: emailData.body,
      template: emailData.template,
      
      // Status and tracking
      status: 'pending',
      sentAt: null,
      deliveredAt: null,
      openedAt: null,
      
      // Rich tracking data
      tracking: {
        deliveryAttempts: 0,
        bounces: [],
        opens: [],
        clicks: [],
        unsubscribed: false,
        userAgent: null,
        ipAddress: null
      },
      
      // Attachments
      attachments: emailData.attachments || [],
      
      // Relationships
      relationships: {
        taskId: emailData.taskId,
        campaignId: emailData.campaignId,
        userId: emailData.userId
      }
    };
  }

  // Query operations
  async findDocuments(collection, query = {}) {
    const docs = this.collections.get(collection) || [];
    
    return docs.filter(doc => {
      return Object.entries(query).every(([key, value]) => {
        if (key.includes('.')) {
          // Handle nested queries
          return this.getNestedValue(doc, key) === value;
        }
        return doc[key] === value;
      });
    });
  }

  async findWithComplexQuery(collection, queryBuilder) {
    const docs = this.collections.get(collection) || [];
    return docs.filter(queryBuilder);
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Aggregation operations
  async aggregateDocuments(collection, pipeline) {
    let docs = this.collections.get(collection) || [];
    
    for (const stage of pipeline) {
      if (stage.$match) {
        docs = docs.filter(doc => this.matchesQuery(doc, stage.$match));
      }
      
      if (stage.$group) {
        docs = this.groupDocuments(docs, stage.$group);
      }
      
      if (stage.$sort) {
        docs = this.sortDocuments(docs, stage.$sort);
      }
      
      if (stage.$limit) {
        docs = docs.slice(0, stage.$limit);
      }
    }
    
    return docs;
  }

  groupDocuments(docs, groupConfig) {
    const groups = new Map();
    
    docs.forEach(doc => {
      const groupKey = this.evaluateExpression(doc, groupConfig._id);
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          _id: groupKey,
          count: 0,
          docs: []
        });
      }
      
      const group = groups.get(groupKey);
      group.count++;
      group.docs.push(doc);
      
      // Calculate aggregated fields
      Object.entries(groupConfig).forEach(([field, expression]) => {
        if (field !== '_id') {
          if (expression.$sum) {
            group[field] = (group[field] || 0) + this.evaluateExpression(doc, expression.$sum);
          }
          if (expression.$avg) {
            group[field] = this.calculateAverage(group.docs, expression.$avg);
          }
        }
      });
    });
    
    return Array.from(groups.values());
  }
}
```

### JSON File-Based Storage
```javascript
// File-based JSON storage for development/small deployments
export class FileJSONStorage {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async saveCollection(collectionName, data) {
    const filePath = path.join(this.dataDir, `${collectionName}.json`);
    const jsonData = {
      _metadata: {
        collection: collectionName,
        lastUpdated: new Date().toISOString(),
        version: '1.0',
        count: data.length
      },
      documents: data
    };
    
    await fs.promises.writeFile(filePath, JSON.stringify(jsonData, null, 2));
  }

  async loadCollection(collectionName) {
    const filePath = path.join(this.dataDir, `${collectionName}.json`);
    
    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      return jsonData.documents || [];
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // Collection doesn't exist yet
      }
      throw error;
    }
  }

  async appendToCollection(collectionName, document) {
    const collection = await this.loadCollection(collectionName);
    collection.push({
      ...document,
      _id: document._id || this.generateId(),
      _created: new Date().toISOString()
    });
    await this.saveCollection(collectionName, collection);
    return collection[collection.length - 1];
  }

  async updateDocument(collectionName, documentId, updates) {
    const collection = await this.loadCollection(collectionName);
    const docIndex = collection.findIndex(doc => doc._id === documentId);
    
    if (docIndex === -1) {
      throw new Error(`Document ${documentId} not found in ${collectionName}`);
    }
    
    collection[docIndex] = {
      ...collection[docIndex],
      ...updates,
      _updated: new Date().toISOString(),
      _version: (collection[docIndex]._version || 1) + 1
    };
    
    await this.saveCollection(collectionName, collection);
    return collection[docIndex];
  }

  async queryCollection(collectionName, queryFn) {
    const collection = await this.loadCollection(collectionName);
    return collection.filter(queryFn);
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## JSON API Response Formats

### Standardized API Responses
```typescript
// API response wrapper
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
    cacheHit?: boolean;
  };
}

// Response builders
export class APIResponseBuilder {
  static success<T>(data: T, pagination?: any, metadata?: any): APIResponse<T> {
    return {
      success: true,
      data,
      ...(pagination && { pagination }),
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        version: '1.0',
        ...metadata
      }
    };
  }

  static error(code: string, message: string, details?: any): APIResponse<never> {
    return {
      success: false,
      error: {
        code,
        message,
        details
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        version: '1.0'
      }
    };
  }

  static paginated<T>(
    data: T[], 
    page: number, 
    limit: number, 
    total: number
  ): APIResponse<T[]> {
    const pages = Math.ceil(total / limit);
    
    return this.success(data, {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1
    });
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }
}

// Usage in routes
app.get('/api/tasks', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const tasks = await storage.getAllTasks();
    const total = tasks.length;
    const startIndex = (page - 1) * limit;
    const paginatedTasks = tasks.slice(startIndex, startIndex + limit);
    
    res.json(APIResponseBuilder.paginated(paginatedTasks, page, limit, total));
  } catch (error) {
    res.status(500).json(APIResponseBuilder.error(
      'INTERNAL_ERROR',
      'Failed to fetch tasks',
      { originalError: error.message }
    ));
  }
});
```

### Real-time JSON Data Streaming
```typescript
// WebSocket JSON data streaming
export class JSONDataStreamer {
  private connections = new Set<WebSocket>();

  addConnection(ws: WebSocket) {
    this.connections.add(ws);
    
    ws.on('close', () => {
      this.connections.delete(ws);
    });
    
    // Send initial data
    this.sendToClient(ws, {
      type: 'connection_established',
      timestamp: new Date().toISOString(),
      clientId: this.generateClientId()
    });
  }

  broadcastTaskUpdate(task: Task) {
    const message = {
      type: 'task_updated',
      timestamp: new Date().toISOString(),
      data: task
    };
    
    this.broadcast(message);
  }

  broadcastEmailStatus(email: Email) {
    const message = {
      type: 'email_status_changed',
      timestamp: new Date().toISOString(),
      data: {
        id: email.id,
        status: email.status,
        sentAt: email.sentAt,
        openedAt: email.openedAt
      }
    };
    
    this.broadcast(message);
  }

  broadcastReportProgress(reportId: number, progress: number) {
    const message = {
      type: 'report_progress',
      timestamp: new Date().toISOString(),
      data: {
        reportId,
        progress,
        status: progress === 100 ? 'completed' : 'generating'
      }
    };
    
    this.broadcast(message);
  }

  private broadcast(message: any) {
    const jsonMessage = JSON.stringify(message);
    
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(jsonMessage);
      }
    });
  }

  private sendToClient(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }
}
```

## JSON Data Migration and Export

### Export Utilities
```typescript
// JSON export utilities for data migration
export class JSONExporter {
  async exportAllData(): Promise<{
    tasks: Task[];
    emails: Email[];
    reports: Report[];
    documentation: Documentation[];
    metadata: ExportMetadata;
  }> {
    const [tasks, emails, reports, documentation] = await Promise.all([
      storage.getAllTasks(),
      storage.getAllEmails(),
      storage.getAllReports(),
      storage.getAllDocumentation()
    ]);

    return {
      tasks,
      emails,
      reports,
      documentation,
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        totalRecords: tasks.length + emails.length + reports.length + documentation.length,
        schema: 'sugarwish_crm',
        exportedBy: 'system'
      }
    };
  }

  async exportToFile(filePath: string, format: 'json' | 'ndjson' = 'json'): Promise<void> {
    const data = await this.exportAllData();
    
    if (format === 'json') {
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    } else if (format === 'ndjson') {
      const lines = [
        ...data.tasks.map(task => JSON.stringify({ type: 'task', data: task })),
        ...data.emails.map(email => JSON.stringify({ type: 'email', data: email })),
        ...data.reports.map(report => JSON.stringify({ type: 'report', data: report })),
        ...data.documentation.map(doc => JSON.stringify({ type: 'documentation', data: doc }))
      ];
      
      await fs.promises.writeFile(filePath, lines.join('\n'));
    }
  }

  async exportFilteredData(filters: {
    startDate?: string;
    endDate?: string;
    types?: string[];
    userIds?: string[];
  }): Promise<any> {
    // Implementation for filtered export
    const data = await this.exportAllData();
    
    // Apply filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      data.tasks = data.tasks.filter(task => new Date(task.createdAt) >= startDate);
      data.emails = data.emails.filter(email => new Date(email.createdAt) >= startDate);
    }
    
    if (filters.types?.length) {
      if (!filters.types.includes('tasks')) data.tasks = [];
      if (!filters.types.includes('emails')) data.emails = [];
      if (!filters.types.includes('reports')) data.reports = [];
      if (!filters.types.includes('documentation')) data.documentation = [];
    }
    
    return data;
  }
}

interface ExportMetadata {
  exportDate: string;
  version: string;
  totalRecords: number;
  schema: string;
  exportedBy: string;
}
```

This comprehensive JSON database documentation covers data structures, PostgreSQL JSON operations, NoSQL alternatives, API responses, and data migration utilities for the Sugarwish CRM system.