# Sugarwish CRM - MySQL Documentation

## Overview
This document covers MySQL database implementation strategies for the Sugarwish CRM system, including migration planning from PostgreSQL, schema design, and AWS EC2 integration.

## MySQL vs PostgreSQL Comparison

### Key Differences for CRM Implementation
```sql
-- PostgreSQL (Current)
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- MySQL (Migration Target)
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Data Type Mappings
| PostgreSQL | MySQL | Notes |
|------------|-------|--------|
| SERIAL | INT AUTO_INCREMENT | Auto-incrementing primary keys |
| JSONB | JSON | JSON storage with indexing |
| TIMESTAMP | TIMESTAMP | Date/time handling |
| TEXT | LONGTEXT | Large text fields |
| BOOLEAN | TINYINT(1) | Boolean values |
| VARCHAR(n) | VARCHAR(n) | String fields |

## MySQL Schema Design

### Database Configuration
```sql
-- Create database with proper charset
CREATE DATABASE sugarwish_crm 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE sugarwish_crm;

-- Set SQL mode for strict data validation
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
```

### Core Tables Structure

#### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  is_active TINYINT(1) DEFAULT 1,
  
  INDEX idx_users_username (username),
  INDEX idx_users_email (email),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Tasks Table
```sql
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description LONGTEXT,
  status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  assigned_to VARCHAR(255),
  due_date TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_priority (priority),
  INDEX idx_tasks_assigned_to (assigned_to),
  INDEX idx_tasks_due_date (due_date),
  INDEX idx_tasks_created_at (created_at),
  INDEX idx_tasks_composite (status, priority, created_at),
  
  FOREIGN KEY fk_tasks_user (assigned_to) REFERENCES users(username) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Emails Table
```sql
CREATE TABLE emails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  to_address VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body LONGTEXT NOT NULL,
  template VARCHAR(100),
  status ENUM('pending', 'sending', 'sent', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  opened_at TIMESTAMP NULL,
  
  INDEX idx_emails_status (status),
  INDEX idx_emails_sent_at (sent_at),
  INDEX idx_emails_to_address (to_address),
  INDEX idx_emails_template (template),
  
  FULLTEXT idx_emails_content (subject, body)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Reports Table
```sql
CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description LONGTEXT,
  status ENUM('pending', 'generating', 'completed', 'failed') DEFAULT 'pending',
  data JSON,
  config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_at TIMESTAMP NULL,
  
  INDEX idx_reports_type (type),
  INDEX idx_reports_status (status),
  INDEX idx_reports_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- JSON indexing for MySQL 5.7+
ALTER TABLE reports ADD INDEX idx_reports_data_type ((CAST(data->>'$.type' AS CHAR(50))));
ALTER TABLE reports ADD INDEX idx_reports_config_range ((CAST(config->>'$.dateRange' AS CHAR(100))));
```

#### Documentation Table
```sql
CREATE TABLE documentation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content LONGTEXT NOT NULL,
  status ENUM('draft', 'review', 'published', 'archived') DEFAULT 'draft',
  category VARCHAR(100) NOT NULL,
  author VARCHAR(255) NOT NULL,
  file_path VARCHAR(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  
  INDEX idx_documentation_category (category),
  INDEX idx_documentation_status (status),
  INDEX idx_documentation_author (author),
  INDEX idx_documentation_published (published_at),
  
  FULLTEXT idx_documentation_search (title, content),
  
  FOREIGN KEY fk_documentation_author (author) REFERENCES users(username) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Node.js MySQL Integration

### Connection Setup with mysql2
```javascript
// server/mysql-db.ts
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '@shared/mysql-schema';

// Connection pool configuration
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  
  // Connection pool settings
  connectionLimit: 20,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false,
  
  // Character set
  charset: 'utf8mb4'
});

export const mysqlDb = drizzle(pool, { schema });

// Connection health check
export const checkMySQLHealth = async () => {
  try {
    const [rows] = await pool.execute('SELECT 1 as health_check, NOW() as timestamp');
    return { healthy: true, timestamp: rows[0].timestamp };
  } catch (error) {
    console.error('MySQL health check failed:', error);
    return { healthy: false, error: error.message };
  }
};
```

### Drizzle Schema for MySQL
```typescript
// shared/mysql-schema.ts
import { mysqlTable, int, varchar, text, timestamp, tinyint, json, mysqlEnum } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  lastLogin: timestamp("last_login"),
  isActive: tinyint("is_active").default(1)
});

export const tasks = mysqlTable("tasks", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in-progress", "completed", "cancelled"]).default("pending"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});

export const emails = mysqlTable("emails", {
  id: int("id").primaryKey().autoincrement(),
  toAddress: varchar("to_address", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  template: varchar("template", { length: 100 }),
  status: mysqlEnum("status", ["pending", "sending", "sent", "failed"]).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at")
});

export const reports = mysqlTable("reports", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 500 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "generating", "completed", "failed"]).default("pending"),
  data: json("data"),
  config: json("config"),
  createdAt: timestamp("created_at").defaultNow(),
  generatedAt: timestamp("generated_at")
});

export const documentation = mysqlTable("documentation", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["draft", "review", "published", "archived"]).default("draft"),
  category: varchar("category", { length: 100 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  publishedAt: timestamp("published_at")
});
```

## MySQL-Specific Operations

### Advanced Queries
```typescript
// MySQL-optimized database operations
export class MySQLStorage implements IStorage {
  async getTasksWithAnalytics(): Promise<TaskAnalytics> {
    const [results] = await mysqlDb.execute(sql`
      SELECT 
        status,
        priority,
        COUNT(*) as count,
        AVG(TIMESTAMPDIFF(HOUR, created_at, COALESCE(completed_at, NOW()))) as avg_hours
      FROM tasks 
      GROUP BY status, priority
      ORDER BY status, priority
    `);
    
    return results;
  }

  async searchDocumentationFullText(searchTerm: string): Promise<Documentation[]> {
    return await mysqlDb.select()
      .from(documentation)
      .where(sql`MATCH(title, content) AGAINST(${searchTerm} IN NATURAL LANGUAGE MODE)`)
      .orderBy(sql`MATCH(title, content) AGAINST(${searchTerm} IN NATURAL LANGUAGE MODE) DESC`);
  }

  async getEmailStatistics(): Promise<EmailStats> {
    const [stats] = await mysqlDb.execute(sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
        ROUND(
          (SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) / 
           NULLIF(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END), 0)) * 100, 2
        ) as open_rate
      FROM emails
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    return stats[0];
  }

  // JSON operations in MySQL
  async getReportsByDateRange(startDate: string, endDate: string): Promise<Report[]> {
    return await mysqlDb.select()
      .from(reports)
      .where(sql`
        JSON_EXTRACT(config, '$.dateRange.start') >= ${startDate} 
        AND JSON_EXTRACT(config, '$.dateRange.end') <= ${endDate}
      `);
  }
}
```

### Transaction Management
```typescript
// MySQL transaction handling
export const executeWithTransaction = async <T>(
  operation: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Usage example
const createTaskWithNotification = async (taskData: InsertTask, emailData: InsertEmail) => {
  return await executeWithTransaction(async (connection) => {
    // Insert task
    const [taskResult] = await connection.execute(
      'INSERT INTO tasks (title, description, status, priority, assigned_to) VALUES (?, ?, ?, ?, ?)',
      [taskData.title, taskData.description, taskData.status, taskData.priority, taskData.assignedTo]
    );
    
    const taskId = taskResult.insertId;
    
    // Insert notification email
    await connection.execute(
      'INSERT INTO emails (to_address, subject, body, template) VALUES (?, ?, ?, ?)',
      [emailData.toAddress, `New Task: ${taskData.title}`, emailData.body, 'task_notification']
    );
    
    return { taskId, success: true };
  });
};
```

## Migration Strategy

### PostgreSQL to MySQL Migration
```javascript
// Migration utility
class PostgreSQLToMySQLMigrator {
  async migrateSchema(): Promise<void> {
    const mappings = {
      'SERIAL': 'INT AUTO_INCREMENT',
      'JSONB': 'JSON',
      'TEXT': 'LONGTEXT',
      'BOOLEAN': 'TINYINT(1)',
      'TIMESTAMP DEFAULT NOW()': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    };
    
    // Read PostgreSQL schema
    const pgSchema = await this.extractPostgreSQLSchema();
    
    // Convert to MySQL
    const mysqlSchema = this.convertSchema(pgSchema, mappings);
    
    // Execute MySQL schema creation
    await this.executeMySQLSchema(mysqlSchema);
  }

  async migrateData(): Promise<void> {
    const tables = ['users', 'tasks', 'emails', 'reports', 'documentation'];
    
    for (const table of tables) {
      console.log(`Migrating table: ${table}`);
      
      // Extract data from PostgreSQL
      const data = await this.extractTableData(table);
      
      // Transform data for MySQL compatibility
      const transformedData = this.transformDataForMySQL(data, table);
      
      // Insert into MySQL
      await this.insertIntoMySQL(table, transformedData);
      
      console.log(`Completed migration of ${table}: ${data.length} records`);
    }
  }

  private transformDataForMySQL(data: any[], tableName: string): any[] {
    return data.map(row => {
      // Handle boolean conversion
      Object.keys(row).forEach(key => {
        if (typeof row[key] === 'boolean') {
          row[key] = row[key] ? 1 : 0;
        }
        
        // Handle JSON conversion
        if (typeof row[key] === 'object' && row[key] !== null) {
          row[key] = JSON.stringify(row[key]);
        }
      });
      
      return row;
    });
  }
}
```

### Data Validation During Migration
```javascript
// Migration validation
class MigrationValidator {
  async validateMigration(): Promise<ValidationReport> {
    const report = {
      tables: {},
      totalErrors: 0,
      timestamp: new Date().toISOString()
    };
    
    const tables = ['users', 'tasks', 'emails', 'reports', 'documentation'];
    
    for (const table of tables) {
      const validation = await this.validateTable(table);
      report.tables[table] = validation;
      report.totalErrors += validation.errors.length;
    }
    
    return report;
  }

  private async validateTable(tableName: string): Promise<TableValidation> {
    // Count records in both databases
    const [pgCount] = await pgPool.query(`SELECT COUNT(*) FROM ${tableName}`);
    const [mysqlCount] = await mysqlPool.execute(`SELECT COUNT(*) FROM ${tableName}`);
    
    const errors = [];
    
    if (pgCount.rows[0].count !== mysqlCount[0]['COUNT(*)']) {
      errors.push(`Record count mismatch: PG=${pgCount.rows[0].count}, MySQL=${mysqlCount[0]['COUNT(*)']}`);
    }
    
    // Validate data integrity
    const sampleValidation = await this.validateSampleData(tableName);
    errors.push(...sampleValidation);
    
    return {
      tableName,
      postgresqlCount: pgCount.rows[0].count,
      mysqlCount: mysqlCount[0]['COUNT(*)'],
      errors,
      validated: errors.length === 0
    };
  }
}
```

## AWS EC2 MySQL Deployment

### EC2 MySQL Installation
```bash
#!/bin/bash
# install-mysql-ec2.sh

# Update system
sudo yum update -y

# Install MySQL 8.0
sudo yum install -y mysql80-server

# Start MySQL service
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Get temporary root password
TEMP_PASSWORD=$(sudo grep 'temporary password' /var/log/mysqld.log | awk '{print $11}')

# Secure MySQL installation
mysql_secure_installation

# Create application database and user
mysql -u root -p << EOF
CREATE DATABASE sugarwish_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'crm_user'@'%' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON sugarwish_crm.* TO 'crm_user'@'%';
FLUSH PRIVILEGES;
EOF

# Configure MySQL for production
sudo tee -a /etc/my.cnf << EOF
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
query_cache_size = 64M
query_cache_type = 1
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
EOF

# Restart MySQL
sudo systemctl restart mysqld
```

### Production Configuration
```javascript
// Production MySQL configuration for EC2
const productionConfig = {
  host: process.env.MYSQL_HOST, // EC2 internal IP
  port: 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  
  // Production pool settings
  connectionLimit: 50,
  acquireTimeout: 60000,
  timeout: 60000,
  
  // SSL for production
  ssl: {
    require: true,
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-cert.pem'),
    key: fs.readFileSync('/path/to/client-key.pem'),
    cert: fs.readFileSync('/path/to/client-cert.pem')
  },
  
  // Connection retry logic
  reconnect: true,
  reconnectTimeout: 1000,
  maxReconnects: 3
};
```

## Performance Optimization

### Index Optimization
```sql
-- Analyze table usage patterns
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  SEQ_IN_INDEX,
  COLUMN_NAME,
  CARDINALITY
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'sugarwish_crm'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Optimize for common queries
CREATE INDEX idx_tasks_status_priority_date ON tasks(status, priority, created_at);
CREATE INDEX idx_emails_status_sent_date ON emails(status, sent_at);

-- JSON indexing for MySQL 8.0+
ALTER TABLE reports ADD INDEX idx_reports_type_generated ((CAST(data->>'$.type' AS CHAR(50))));
```

### Query Performance Monitoring
```sql
-- Enable performance schema
SET GLOBAL performance_schema = ON;

-- Monitor slow queries
SELECT 
  DIGEST_TEXT,
  COUNT_STAR,
  AVG_TIMER_WAIT/1000000000 AS avg_time_seconds,
  SUM_TIMER_WAIT/1000000000 AS total_time_seconds
FROM performance_schema.events_statements_summary_by_digest 
WHERE DIGEST_TEXT IS NOT NULL 
ORDER BY AVG_TIMER_WAIT DESC 
LIMIT 10;
```

## Backup and Recovery

### Automated Backup Strategy
```bash
#!/bin/bash
# mysql-backup.sh

BACKUP_DIR="/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="sugarwish_crm"

# Create backup with compression
mysqldump \
  --host=$MYSQL_HOST \
  --user=$MYSQL_USER \
  --password=$MYSQL_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  --hex-blob \
  $DB_NAME | gzip > "$BACKUP_DIR/crm_backup_$DATE.sql.gz"

# Upload to S3 for offsite storage
aws s3 cp "$BACKUP_DIR/crm_backup_$DATE.sql.gz" \
  "s3://sugarwish-backups/mysql/"

# Clean up old local backups (keep last 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: crm_backup_$DATE.sql.gz"
```

### Point-in-Time Recovery
```sql
-- Enable binary logging for point-in-time recovery
[mysqld]
log-bin = mysql-bin
binlog-format = ROW
expire_logs_days = 7
sync_binlog = 1

-- Recovery procedure (example)
-- 1. Restore from last backup
-- 2. Apply binary logs from backup point to desired recovery point
mysqlbinlog --start-datetime="2025-06-05 14:00:00" \
           --stop-datetime="2025-06-05 15:30:00" \
           mysql-bin.000001 | mysql -u root -p sugarwish_crm
```

This comprehensive MySQL documentation provides migration strategies, EC2 deployment guidelines, and performance optimization for transitioning the Sugarwish CRM system from PostgreSQL to MySQL.