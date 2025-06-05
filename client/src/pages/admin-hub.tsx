import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Plus, Edit, Trash2, Users, Settings, Shield, Activity, Database, Layout } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User, TaskCategory, RolePermission } from "@shared/schema";

const taskCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().default("#6b7280"),
  isActive: z.boolean().default(true),
});

const userManagementSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["admin", "mod", "gc", "view_only"]),
  isActive: z.boolean().default(true),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const rolePermissionSchema = z.object({
  role: z.enum(["admin", "mod", "gc", "view_only"]),
  resource: z.string(),
  actions: z.object({
    create: z.boolean().default(false),
    read: z.boolean().default(true),
    update: z.boolean().default(false),
    delete: z.boolean().default(false),
  }),
});

type TaskCategoryFormData = z.infer<typeof taskCategorySchema>;
type UserManagementFormData = z.infer<typeof userManagementSchema>;
type RolePermissionFormData = z.infer<typeof rolePermissionSchema>;

export default function AdminHub() {
  const [activeTab, setActiveTab] = useState("categories");
  const { toast } = useToast();

  // Fetch data
  const { data: categories = [] } = useQuery<TaskCategory[]>({
    queryKey: ["/api/admin/task-categories"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: permissions = [] } = useQuery<RolePermission[]>({
    queryKey: ["/api/admin/role-permissions"],
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["/api/admin/audit-logs"],
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: TaskCategoryFormData) => {
      return apiRequest("POST", "/api/admin/task-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/task-categories"] });
      toast({ title: "Success", description: "Category created successfully" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserManagementFormData) => {
      return apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User created successfully" });
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async (data: RolePermissionFormData) => {
      return apiRequest("PUT", `/api/admin/role-permissions/${data.role}/${data.resource}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-permissions"] });
      toast({ title: "Success", description: "Permissions updated successfully" });
    },
  });

  // Forms
  const categoryForm = useForm<TaskCategoryFormData>({
    resolver: zodResolver(taskCategorySchema),
    defaultValues: { name: "", description: "", color: "#6b7280", isActive: true },
  });

  const userForm = useForm<UserManagementFormData>({
    resolver: zodResolver(userManagementSchema),
    defaultValues: { username: "", email: "", role: "view_only", isActive: true, password: "" },
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "mod": return "bg-orange-100 text-orange-800";
      case "gc": return "bg-blue-100 text-blue-800";
      case "view_only": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const resources = ["tasks", "users", "companies", "reports", "dashboard", "admin"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Super Admin Hub</h3>
          <p className="text-sm text-gray-500">Comprehensive system administration and configuration</p>
        </div>
        <Badge className="bg-red-100 text-red-800">
          <Shield className="w-3 h-3 mr-1" />
          Admin Access
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="layout">Page Layouts</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
        </TabsList>

        {/* Task Categories Management */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Task Categories Management</CardTitle>
                  <CardDescription>Create and manage task categories used throughout the CRM</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Task Category</DialogTitle>
                    </DialogHeader>
                    <Form {...categoryForm}>
                      <form onSubmit={categoryForm.handleSubmit((data) => createCategoryMutation.mutateAsync(data))} className="space-y-4">
                        <FormField
                          control={categoryForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Sales, Marketing" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={categoryForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Category description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={categoryForm.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color</FormLabel>
                              <FormControl>
                                <Input type="color" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={createCategoryMutation.isPending}>
                          {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full border" 
                            style={{ backgroundColor: category.color || "#6b7280" }} 
                          />
                          <span className="text-sm text-gray-500">{category.color || "#6b7280"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={category.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts and assign roles</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create User Account</DialogTitle>
                    </DialogHeader>
                    <Form {...userForm}>
                      <form onSubmit={userForm.handleSubmit((data) => createUserMutation.mutateAsync(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={userForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={userForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="johndoe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john@sugarwish.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="admin">Admin - Full Access</SelectItem>
                                  <SelectItem value="mod">MOD - Most Features</SelectItem>
                                  <SelectItem value="gc">GC - Limited Edit Access</SelectItem>
                                  <SelectItem value="view_only">View Only - Read Only</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={createUserMutation.isPending}>
                          {createUserMutation.isPending ? "Creating..." : "Create User"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Permissions */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions Matrix</CardTitle>
              <CardDescription>Configure what each user role can access and modify</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {["admin", "mod", "gc", "view_only"].map((role) => (
                  <div key={role} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge className={getRoleColor(role)}>
                          {role.toUpperCase()}
                        </Badge>
                        <div>
                          <h4 className="font-medium">
                            {role === "admin" && "Administrator - Full system access"}
                            {role === "mod" && "Moderator - Most features, cannot override admin settings"}
                            {role === "gc" && "General Coordinator - View most data, limited edit access"}
                            {role === "view_only" && "View Only - Read-only access to permitted items"}
                          </h4>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {resources.map((resource) => {
                        const permission = permissions.find(p => p.role === role && p.resource === resource);
                        const actions = permission?.actions as any || { create: false, read: false, update: false, delete: false };
                        
                        return (
                          <div key={resource} className="border rounded p-3">
                            <h5 className="font-medium mb-3 capitalize">{resource}</h5>
                            <div className="space-y-2">
                              {["create", "read", "update", "delete"].map((action) => (
                                <div key={action} className="flex items-center justify-between">
                                  <span className="text-sm capitalize">{action}</span>
                                  <Switch
                                    checked={actions[action]}
                                    onCheckedChange={(checked) => {
                                      updatePermissionMutation.mutate({
                                        role: role as any,
                                        resource,
                                        actions: { ...actions, [action]: checked }
                                      });
                                    }}
                                    disabled={role === "admin" || updatePermissionMutation.isPending}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>System Audit Logs</CardTitle>
              <CardDescription>Track all administrative actions and system changes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(auditLogs as any[]).slice(0, 20).map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{log.userId || "System"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{log.resource}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.resourceId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page Layout Management */}
        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle>Page Layout Configuration</CardTitle>
              <CardDescription>Customize page layouts for different user roles and modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["Tasks", "Users", "Companies", "Reports", "Dashboard"].map((page) => (
                  <div key={page} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium flex items-center">
                        <Layout className="w-4 h-4 mr-2" />
                        {page} Layout
                      </h4>
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>• Column visibility settings</div>
                      <div>• Filter options per role</div>
                      <div>• Action button permissions</div>
                      <div>• Field-level access control</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Global system settings and administrative controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Security Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Enforce 2FA for Admins</span>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Session Timeout (minutes)</span>
                        <Input type="number" className="w-20" defaultValue="60" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Password Complexity</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">System Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Email Notifications</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Audit Log Alerts</span>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>System Health Monitoring</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-600">Danger Zone</h4>
                      <p className="text-sm text-gray-500">These actions cannot be undone</p>
                    </div>
                    <div className="space-x-2">
                      <Button variant="destructive" size="sm">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Reset System
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Database className="w-3 h-3 mr-1" />
                        Export Data
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}