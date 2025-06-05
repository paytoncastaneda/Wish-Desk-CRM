# Sugarwish CRM - HTTP API Documentation

## Overview
This document covers the HTTP API design, endpoints, request/response formats, and integration patterns for the Sugarwish CRM system.

## API Architecture

### RESTful Design Principles
- **Resource-based URLs**: `/api/tasks`, `/api/emails`, `/api/reports`
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (remove)
- **Status Codes**: Proper HTTP status codes for different scenarios
- **JSON Format**: All requests and responses use JSON format
- **Stateless**: Each request contains all necessary information

### Base URL Structure
```
Production: https://sugarwish-crm.replit.app/api
Development: http://localhost:5000/api
```

## Authentication & Headers

### Required Headers
```http
Content-Type: application/json
Accept: application/json
Cookie: session=<session-id>  # For authenticated requests
```

### Session Management
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@sugarwish.com",
  "password": "secure_password"
}

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "username": "user@sugarwish.com",
    "role": "admin"
  }
}
```

## Core API Endpoints

### Dashboard Analytics

#### Get Dashboard Statistics
```http
GET /api/dashboard/stats

Response:
{
  "activeTasks": 15,
  "emailsSent": 42,
  "reportsGenerated": 8,
  "documentation": 23
}
```

#### Get Task Analytics
```http
GET /api/dashboard/task-analytics

Response:
[
  {
    "date": "2025-06-01",
    "completed": 5
  },
  {
    "date": "2025-06-02", 
    "completed": 3
  }
]
```

#### Get Email Analytics
```http
GET /api/dashboard/email-analytics

Response:
[
  {
    "week": "Week 1",
    "emails": 12
  },
  {
    "week": "Week 2",
    "emails": 18
  }
]
```

### Task Management

#### List Tasks
```http
GET /api/tasks?status=pending&priority=high&assignedTo=john

Query Parameters:
- status: pending, in-progress, completed, cancelled
- priority: low, medium, high
- assignedTo: username or user ID
- search: text search in title/description

Response:
[
  {
    "id": 1,
    "title": "Update CRM documentation",
    "description": "Complete API documentation update",
    "status": "pending",
    "priority": "high",
    "assignedTo": "john@sugarwish.com",
    "dueDate": "2025-06-15T10:00:00Z",
    "createdAt": "2025-06-01T09:00:00Z",
    "completedAt": null
  }
]
```

#### Create Task
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "New feature implementation",
  "description": "Implement user dashboard analytics",
  "priority": "medium",
  "assignedTo": "developer@sugarwish.com",
  "dueDate": "2025-06-20T17:00:00Z"
}

Response: 201 Created
{
  "id": 25,
  "title": "New feature implementation",
  "description": "Implement user dashboard analytics",
  "status": "pending",
  "priority": "medium",
  "assignedTo": "developer@sugarwish.com",
  "dueDate": "2025-06-20T17:00:00Z",
  "createdAt": "2025-06-05T14:30:00Z",
  "completedAt": null
}
```

#### Update Task
```http
PUT /api/tasks/25
Content-Type: application/json

{
  "status": "completed",
  "completedAt": "2025-06-18T16:45:00Z"
}

Response: 200 OK
{
  "id": 25,
  "title": "New feature implementation",
  "status": "completed",
  "completedAt": "2025-06-18T16:45:00Z"
}
```

#### Delete Task
```http
DELETE /api/tasks/25

Response: 204 No Content
```

### Email Management

#### List Emails
```http
GET /api/emails?status=sent

Response:
[
  {
    "id": 1,
    "to": "customer@example.com",
    "subject": "Welcome to Sugarwish",
    "body": "Thank you for joining...",
    "template": "welcome",
    "status": "sent",
    "createdAt": "2025-06-01T10:00:00Z",
    "sentAt": "2025-06-01T10:05:00Z",
    "openedAt": "2025-06-01T11:30:00Z"
  }
]
```

#### Send Email
```http
POST /api/emails
Content-Type: application/json

{
  "to": "client@example.com",
  "subject": "Project Update",
  "body": "Your project status has been updated...",
  "template": "notification"
}

Response: 201 Created
{
  "id": 15,
  "to": "client@example.com",
  "subject": "Project Update",
  "body": "Your project status has been updated...",
  "template": "notification",
  "status": "pending",
  "createdAt": "2025-06-05T14:00:00Z",
  "sentAt": null,
  "openedAt": null
}
```

#### Get Email Statistics
```http
GET /api/emails/stats

Response:
{
  "sentToday": 12,
  "openRate": 85,
  "pending": 3
}
```

### Reports Management

#### List Reports
```http
GET /api/reports

Response:
[
  {
    "id": 1,
    "title": "Monthly Task Performance",
    "type": "task-performance",
    "description": "Task completion metrics for June",
    "status": "completed",
    "createdAt": "2025-06-01T09:00:00Z",
    "generatedAt": "2025-06-01T09:15:00Z",
    "data": {
      "totalTasks": 45,
      "completedTasks": 38,
      "completionRate": 84.4
    }
  }
]
```

#### Generate Report
```http
POST /api/reports
Content-Type: application/json

{
  "title": "Weekly Email Campaign Report",
  "type": "email-campaign",
  "description": "Email performance for this week",
  "config": {
    "dateRange": {
      "start": "2025-06-01",
      "end": "2025-06-07"
    },
    "includeDetails": true
  }
}

Response: 201 Created
{
  "id": 8,
  "title": "Weekly Email Campaign Report",
  "type": "email-campaign",
  "status": "generating",
  "createdAt": "2025-06-05T15:00:00Z"
}
```

#### Export Report
```http
GET /api/reports/8/export?format=pdf

Response: 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="email-campaign-report-2025-06-05.pdf"

[Binary PDF data]
```

### Documentation Management

#### List Documentation
```http
GET /api/documentation?category=technical

Response:
[
  {
    "id": 1,
    "title": "API Integration Guide",
    "content": "# API Integration\n\nThis guide covers...",
    "status": "published",
    "category": "technical",
    "author": "Technical Team",
    "createdAt": "2025-06-01T08:00:00Z",
    "updatedAt": "2025-06-03T10:30:00Z",
    "publishedAt": "2025-06-03T11:00:00Z",
    "filePath": "/docs/api-integration.md"
  }
]
```

#### Create Documentation
```http
POST /api/documentation
Content-Type: application/json

{
  "title": "User Onboarding Process",
  "content": "# User Onboarding\n\n## Step 1\n...",
  "category": "process",
  "author": "Operations Team",
  "status": "draft"
}

Response: 201 Created
{
  "id": 24,
  "title": "User Onboarding Process",
  "status": "draft",
  "category": "process",
  "author": "Operations Team",
  "createdAt": "2025-06-05T16:00:00Z"
}
```

#### Get Documentation Categories
```http
GET /api/documentation/categories

Response:
{
  "technical": 8,
  "process": 12,
  "policy": 5,
  "training": 7
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": true,
  "message": "Resource not found",
  "code": "RESOURCE_NOT_FOUND",
  "details": {
    "resource": "task",
    "id": 999
  },
  "timestamp": "2025-06-05T15:30:00Z"
}
```

### HTTP Status Codes

#### Success Codes
- **200 OK**: Request successful, data returned
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful, no data returned (delete operations)

#### Client Error Codes
- **400 Bad Request**: Invalid request data or format
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Access denied for authenticated user
- **404 Not Found**: Resource does not exist
- **409 Conflict**: Resource conflict (duplicate data)
- **422 Unprocessable Entity**: Validation errors

#### Server Error Codes
- **500 Internal Server Error**: Unexpected server error
- **502 Bad Gateway**: Database or external service unavailable
- **503 Service Unavailable**: Server temporarily unavailable

### Validation Errors
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "",
  "priority": "invalid"
}

Response: 422 Unprocessable Entity
{
  "error": true,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "priority",
      "message": "Priority must be one of: low, medium, high"
    }
  ]
}
```

## Request/Response Patterns

### Pagination
```http
GET /api/tasks?page=2&limit=10

Response:
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 156,
    "pages": 16,
    "hasNext": true,
    "hasPrev": true
  }
}
```

### Filtering and Sorting
```http
GET /api/tasks?status=pending&sort=dueDate&order=asc&search=documentation

Query Parameters:
- sort: field name to sort by
- order: asc or desc
- search: text search across relevant fields
- Any resource field for filtering
```

### Bulk Operations
```http
POST /api/tasks/bulk
Content-Type: application/json

{
  "operation": "update",
  "ids": [1, 2, 3, 4],
  "data": {
    "status": "completed"
  }
}

Response:
{
  "updated": 4,
  "failed": 0,
  "results": [
    {"id": 1, "success": true},
    {"id": 2, "success": true},
    {"id": 3, "success": true},
    {"id": 4, "success": true}
  ]
}
```

## Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625097600
X-RateLimit-Window: 900
```

### Rate Limit Response
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": true,
  "message": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 300
}
```

## Content Types & File Uploads

### File Upload (Multipart)
```http
POST /api/documentation/upload
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="manual.pdf"
Content-Type: application/pdf

[Binary file data]
--boundary
Content-Disposition: form-data; name="title"

User Manual
--boundary--

Response: 201 Created
{
  "id": 25,
  "title": "User Manual",
  "filePath": "/uploads/documents/manual-2025-06-05.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf"
}
```

### File Download
```http
GET /api/documentation/25/download

Response:
Content-Type: application/pdf
Content-Length: 2048576
Content-Disposition: attachment; filename="user-manual.pdf"

[Binary file data]
```

## Webhooks & Real-time Updates

### Webhook Configuration
```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://external-system.com/webhook",
  "events": ["task.created", "task.completed", "email.sent"],
  "secret": "webhook_secret_key"
}
```

### Webhook Payload Example
```http
POST https://external-system.com/webhook
Content-Type: application/json
X-Sugarwish-Signature: sha256=...

{
  "event": "task.completed",
  "timestamp": "2025-06-05T16:30:00Z",
  "data": {
    "id": 15,
    "title": "Documentation Update",
    "completedBy": "john@sugarwish.com",
    "completedAt": "2025-06-05T16:30:00Z"
  }
}
```

## API Versioning

### URL Versioning
```http
GET /api/v1/tasks    # Current version
GET /api/v2/tasks    # Future version
```

### Header Versioning
```http
GET /api/tasks
Accept: application/vnd.sugarwish.v1+json
```

## Integration Examples

### JavaScript/Node.js
```javascript
// Using fetch API
const response = await fetch('/api/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'New Task',
    priority: 'high'
  })
});

const task = await response.json();
```

### cURL Examples
```bash
# Get tasks
curl -X GET "http://localhost:5000/api/tasks?status=pending" \
  -H "Accept: application/json"

# Create task
curl -X POST "http://localhost:5000/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Documentation",
    "priority": "high",
    "assignedTo": "developer@sugarwish.com"
  }'

# Update task
curl -X PUT "http://localhost:5000/api/tasks/1" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

## Performance Considerations

### Caching Headers
```http
GET /api/dashboard/stats

Response:
Cache-Control: max-age=300, public
ETag: "abc123"
Last-Modified: Wed, 05 Jun 2025 15:00:00 GMT
```

### Compression
```http
GET /api/reports/1/data
Accept-Encoding: gzip, deflate

Response:
Content-Encoding: gzip
Content-Type: application/json
```

### Connection Keep-Alive
```http
Connection: keep-alive
Keep-Alive: timeout=5, max=100
```

This comprehensive HTTP API documentation covers all endpoints, request/response formats, error handling, and integration patterns for the Sugarwish CRM system.