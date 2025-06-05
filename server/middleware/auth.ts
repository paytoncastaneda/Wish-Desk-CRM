import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, rolePermissions, auditLogs } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    permissions: any;
  };
}

// Role hierarchy for access control
const ROLE_HIERARCHY = {
  admin: 4,
  mod: 3,
  gc: 2,
  view_only: 1
};

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // For demo purposes, we'll simulate authentication
    // In production, this would verify JWT tokens or session data
    const authHeader = req.headers.authorization;
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid user or account disabled" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions || {}
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

export const requireRole = (minRole: keyof typeof ROLE_HIERARCHY) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role as keyof typeof ROLE_HIERARCHY] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole];

    if (userRoleLevel < requiredLevel) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admin always has full access
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      const [permission] = await db
        .select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.role, req.user.role),
            eq(rolePermissions.resource, resource)
          )
        );

      if (!permission) {
        return res.status(403).json({ error: "Access denied" });
      }

      const actions = permission.actions as any;
      if (!actions[action]) {
        return res.status(403).json({ error: `Permission denied for ${action} on ${resource}` });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ error: "Permission check failed" });
    }
  };
};

export const auditLog = (action: string, resource: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after successful response
      if (res.statusCode < 400 && req.user) {
        db.insert(auditLogs).values({
          userId: req.user.id,
          action,
          resource,
          resourceId: req.params.id || null,
          oldValues: req.method === 'PUT' || req.method === 'PATCH' ? req.body : null,
          newValues: req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' ? req.body : null,
          ipAddress: req.ip || req.connection.remoteAddress || null,
          userAgent: req.get('User-Agent') || null,
        }).catch(console.error);
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
};