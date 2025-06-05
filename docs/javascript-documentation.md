# Sugarwish CRM - JavaScript Documentation

## Overview
This document covers the JavaScript implementation in the Sugarwish CRM system, including frontend React components, backend Node.js server logic, and data handling patterns.

## Frontend JavaScript (React + TypeScript)

### Component Architecture
- **Layout Components**: Sidebar, Header navigation with Sugarwish branding
- **Page Components**: Dashboard, Tasks, Email, Reports, Documentation
- **UI Components**: Shadcn/ui component library integration
- **Chart Components**: Task analytics, Email activity visualization

### State Management
```javascript
// React Query for server state
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Example: Task management hooks
export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ["/api/tasks", filters],
    enabled: true
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskData: InsertTask) => 
      apiRequest("/api/tasks", { method: "POST", body: taskData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    }
  });
}
```

### Form Handling
```javascript
// React Hook Form with Zod validation
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";

const form = useForm<InsertTask>({
  resolver: zodResolver(insertTaskSchema.extend({
    title: z.string().min(1, "Title is required"),
    priority: z.enum(["low", "medium", "high"])
  })),
  defaultValues: {
    title: "",
    description: "",
    status: "pending",
    priority: "medium"
  }
});
```

### API Integration
```javascript
// Centralized API client
export const api = {
  // Task operations
  getTasks: (filters?: TaskFilters) => 
    fetch(`/api/tasks${buildQueryString(filters)}`).then(res => res.json()),
  
  createTask: (taskData: InsertTask) =>
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData)
    }).then(res => res.json()),

  // Email operations
  sendEmail: (emailData: InsertEmail) =>
    fetch("/api/emails", {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailData)
    }).then(res => res.json())
};
```

## Backend JavaScript (Node.js + Express)

### Server Configuration
```javascript
// Express.js server setup
import express from "express";
import session from "express-session";
import { storage } from "./storage.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET || "sugarwish-crm-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
```

### Route Handlers
```javascript
// RESTful API endpoints
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
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const validatedData = insertTaskSchema.parse(req.body);
    const task = await storage.createTask(validatedData);
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(400).json({ message: "Invalid task data" });
  }
});
```

### Data Validation
```javascript
// Zod schema validation
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { tasks } from "@shared/schema";

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  assignedTo: true,
  dueDate: true
});

// Runtime validation
const validateTaskData = (data: unknown): InsertTask => {
  return insertTaskSchema.parse(data);
};
```

## JavaScript Patterns & Best Practices

### Error Handling
```javascript
// Frontend error handling
const handleApiError = (error: Error) => {
  console.error("API Error:", error);
  toast({
    title: "Error",
    description: error.message || "Something went wrong",
    variant: "destructive"
  });
};

// Backend error middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Server Error:", err);
  res.status(500).json({ 
    message: "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

### Async/Await Patterns
```javascript
// Database operations with proper error handling
export class DatabaseStorage {
  async createTask(insertTask: InsertTask): Promise<Task> {
    try {
      const [task] = await db.insert(tasks).values({
        ...insertTask,
        description: insertTask.description || null,
        status: insertTask.status || 'pending',
        priority: insertTask.priority || 'medium'
      }).returning();
      
      return task;
    } catch (error) {
      console.error("Database error creating task:", error);
      throw new Error("Failed to create task");
    }
  }
}
```

### TypeScript Integration
```javascript
// Type-safe API responses
interface DashboardStats {
  activeTasks: number;
  emailsSent: number;
  reportsGenerated: number;
  documentation: number;
}

// Type-safe database operations
const stats: DashboardStats = {
  activeTasks: tasks.filter(task => task.status !== 'completed').length,
  emailsSent: emails.filter(email => email.status === 'sent').length,
  reportsGenerated: reports.filter(report => report.status === 'completed').length,
  documentation: docs.length
};
```

## Performance Optimizations

### Frontend Optimizations
```javascript
// React Query caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    }
  }
});

// Lazy loading components
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Tasks = lazy(() => import("@/pages/tasks"));
```

### Backend Optimizations
```javascript
// Database connection pooling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Response compression
import compression from "compression";
app.use(compression());
```

## Security Considerations

### Input Validation
```javascript
// Sanitize user input
import validator from "validator";

const sanitizeInput = (input: string): string => {
  return validator.escape(input.trim());
};

// SQL injection prevention through parameterized queries
const getUserTasks = async (userId: number) => {
  return await db.select().from(tasks).where(eq(tasks.assignedTo, userId.toString()));
};
```

### Authentication & Authorization
```javascript
// Session-based authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Protected routes
app.use("/api/tasks", requireAuth);
app.use("/api/emails", requireAuth);
```

## Testing Patterns

### Frontend Testing
```javascript
// React component testing with React Testing Library
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TaskForm from "@/components/TaskForm";

test("creates new task on form submission", async () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <TaskForm />
    </QueryClientProvider>
  );
  
  fireEvent.change(screen.getByLabelText(/title/i), {
    target: { value: "New Task" }
  });
  
  fireEvent.click(screen.getByRole("button", { name: /create/i }));
  
  expect(await screen.findByText("Task created successfully")).toBeInTheDocument();
});
```

### Backend Testing
```javascript
// API endpoint testing with Jest and Supertest
import request from "supertest";
import { app } from "../server/index";

describe("Tasks API", () => {
  test("GET /api/tasks returns task list", async () => {
    const response = await request(app)
      .get("/api/tasks")
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });
  
  test("POST /api/tasks creates new task", async () => {
    const taskData = {
      title: "Test Task",
      description: "Test Description",
      priority: "medium"
    };
    
    const response = await request(app)
      .post("/api/tasks")
      .send(taskData)
      .expect(201);
    
    expect(response.body.title).toBe(taskData.title);
  });
});
```

## Build & Deployment

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check

# Run tests
npm test
```

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start

# Database migration
npm run db:push
```

## Environment Configuration
```javascript
// Environment variables
const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};
```

---

This documentation covers the complete JavaScript implementation of the Sugarwish CRM system, from frontend React components to backend Node.js API services.