import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Mail, Send, User, Calendar, BarChart3, Plus, Edit, Eye, FileText, Code, Users, Clock, MailOpen, Trash2, Sparkles, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "HTML content is required"),
  assignedUserId: z.number().optional(),
  category: z.string().default("general"),
  isGlobal: z.boolean().default(false),
});

const emailSchema = z.object({
  to: z.string().email("Valid email required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message body is required"),
  templateId: z.number().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;
type EmailFormData = z.infer<typeof emailSchema>;

export default function EmailCenter() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiPurpose, setAiPurpose] = useState("general");
  const { toast } = useToast();

  // Fetch data
  const { data: emails = [], isLoading: emailsLoading } = useQuery({
    queryKey: ["/api/emails"],
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/email-templates"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/emails/stats"],
  });

  // AI template generation mutation
  const generateTemplateMutation = useMutation({
    mutationFn: async (data: { description: string; tone: string; purpose: string }) => {
      return apiRequest("POST", "/api/email-templates/generate", data);
    },
    onSuccess: (data) => {
      templateForm.setValue("htmlContent", data.htmlContent);
      setIsAIDialogOpen(false);
      setAiDescription("");
      toast({
        title: "Success",
        description: "AI template generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: "Failed to generate AI template",
        variant: "destructive",
      });
    },
  });

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      return apiRequest("POST", "/api/email-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({ title: "Success", description: "Template created successfully" });
      setIsCreateDialogOpen(false);
      templateForm.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TemplateFormData> }) => {
      return apiRequest("PUT", `/api/email-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({ title: "Success", description: "Template updated successfully" });
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      editForm.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to update template", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({ title: "Success", description: "Template deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      return apiRequest("POST", "/api/emails/send", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      toast({ title: "Success", description: "Email sent successfully" });
      emailForm.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to send email", variant: "destructive" });
    },
  });

  // Forms
  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: { 
      name: "", 
      subject: "", 
      htmlContent: "", 
      category: "general", 
      isGlobal: false 
    },
  });

  const editForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: { 
      name: "", 
      subject: "", 
      htmlContent: "", 
      category: "general", 
      isGlobal: false 
    },
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { to: "", subject: "", body: "" },
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "welcome": return "bg-blue-100 text-blue-800";
      case "follow-up": return "bg-green-100 text-green-800";
      case "proposal": return "bg-purple-100 text-purple-800";
      case "general": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const loadTemplateToEmail = (template: any) => {
    emailForm.setValue("subject", template.subject);
    emailForm.setValue("body", template.htmlContent);
    emailForm.setValue("templateId", template.id);
    setActiveTab("compose");
  };

  const openEditDialog = (template: any) => {
    setEditingTemplate(template);
    editForm.reset({
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      assignedUserId: template.assignedUserId,
      category: template.category,
      isGlobal: template.isGlobal
    });
    setIsEditDialogOpen(true);
  };

  const sampleHTMLTemplate = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f8f4f0; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #D4AF37, #B8860B); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .cta-button { background: #D4AF37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{title}}</h1>
            <p>Sugarwish - The sweetest way to send gifts</p>
        </div>
        <div class="content">
            <p>Dear {{customer_name}},</p>
            <p>{{message_content}}</p>
            <a href="{{action_url}}" class="cta-button">{{button_text}}</a>
            <p>Sweet regards,<br>{{gc_name}}<br>Your Gift Concierge</p>
        </div>
    </div>
</body>
</html>`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Email Center</h3>
          <p className="text-sm text-gray-500">Manage emails, templates, and outreach campaigns</p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Email Template</DialogTitle>
              </DialogHeader>
              <Form {...templateForm}>
                <form onSubmit={templateForm.handleSubmit((data) => createTemplateMutation.mutateAsync(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={templateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Welcome Email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={templateForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="welcome">Welcome</SelectItem>
                              <SelectItem value="follow-up">Follow-up</SelectItem>
                              <SelectItem value="proposal">Proposal</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={templateForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email subject" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="assignedUserId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to User (Optional)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === "global" ? undefined : parseInt(value))} value={field.value?.toString() || "global"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select user or leave as global" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="global">Global Template</SelectItem>
                            {Array.isArray(users) && users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.firstName} {user.lastName} ({user.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="isGlobal"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Global Template</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Make this template available to all users
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={templateForm.control}
                    name="htmlContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HTML Content</FormLabel>
                        <div className="flex space-x-2 mb-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => field.onChange(sampleHTMLTemplate)}
                          >
                            Load Sample Template
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                            <Eye className="w-4 h-4 mr-2" />
                            {previewMode ? "Edit" : "Preview"}
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea 
                            className="min-h-[300px] font-mono text-sm"
                            placeholder="Enter HTML content for the email template..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {previewMode && templateForm.watch("htmlContent") && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium mb-2">Preview:</h4>
                      <div 
                        className="bg-white border rounded p-4 max-h-96 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: templateForm.watch("htmlContent") }}
                      />
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={createTemplateMutation.isPending}>
                      {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="sent">Sent Emails</TabsTrigger>
        </TabsList>

        {/* Email Dashboard */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sent Today</p>
                    <p className="text-2xl font-bold">{stats.sentToday || 0}</p>
                  </div>
                  <Send className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Rate</p>
                    <p className="text-2xl font-bold">{stats.openRate || 0}%</p>
                  </div>
                  <MailOpen className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Templates</p>
                    <p className="text-2xl font-bold">{Array.isArray(templates) ? templates.length : 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">{stats.pending || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest email activity and template usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(emails) && emails.slice(0, 5).map((email: any) => (
                  <div key={email.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Mail className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium">{email.subject}</p>
                        <p className="text-sm text-gray-500">To: {email.to}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={
                        email.status === 'sent' ? 'bg-green-100 text-green-800' :
                        email.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {email.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(email.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {(!Array.isArray(emails) || emails.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No emails found. Start by creating templates and sending emails.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Management */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Manage HTML email templates for Gift Concierges and team members</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Assigned User</TableHead>
                    <TableHead>Global</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(templates) && templates.map((template: any) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-500">{template.subject}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {template.assignedUserId ? (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{Array.isArray(users) && users.find((u: any) => u.id === template.assignedUserId)?.firstName || "Unknown"}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={template.isGlobal ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                          {template.isGlobal ? "Global" : "Private"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={template.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => loadTemplateToEmail(template)}>
                            <Send className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(template)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                            disabled={deleteTemplateMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!Array.isArray(templates) || templates.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No templates found. Create your first template to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compose Email */}
        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Compose Email</CardTitle>
              <CardDescription>Send emails using templates or create custom messages</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit((data) => sendEmailMutation.mutateAsync(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={emailForm.control}
                      name="to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To</FormLabel>
                          <FormControl>
                            <Input placeholder="recipient@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name="templateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Use Template (Optional)</FormLabel>
                          <Select onValueChange={(value) => {
                            const templateId = value === "none" ? undefined : parseInt(value);
                            field.onChange(templateId);
                            if (templateId && Array.isArray(templates)) {
                              const template = templates.find((t: any) => t.id === templateId);
                              if (template) {
                                emailForm.setValue("subject", template.subject);
                                emailForm.setValue("body", template.htmlContent);
                              }
                            }
                          }} value={field.value?.toString() || "none"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No template</SelectItem>
                              {Array.isArray(templates) && templates.map((template: any) => (
                                <SelectItem key={template.id} value={template.id.toString()}>
                                  {template.name} ({template.category})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={emailForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Email subject" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={emailForm.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="min-h-[400px]"
                            placeholder="Enter your message here. You can use HTML formatting..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={sendEmailMutation.isPending}>
                    <Send className="w-4 h-4 mr-2" />
                    {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sent Emails */}
        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Sent Emails</CardTitle>
              <CardDescription>Track sent emails and their delivery status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Template Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Opened</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(emails) && emails.map((email: any) => (
                    <TableRow key={email.id}>
                      <TableCell className="font-medium">{email.subject}</TableCell>
                      <TableCell>{email.to}</TableCell>
                      <TableCell>
                        {email.templateId ? (
                          <Badge variant="outline">
                            {Array.isArray(templates) && templates.find((t: any) => t.id === email.templateId)?.name || "Unknown"}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">Custom</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          email.status === 'sent' ? 'bg-green-100 text-green-800' :
                          email.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {email.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {email.sentAt ? new Date(email.sentAt).toLocaleString() : "Not sent"}
                      </TableCell>
                      <TableCell>
                        {email.openedAt ? (
                          <span className="text-green-600">
                            {new Date(email.openedAt).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-500">Not opened</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!Array.isArray(emails) || emails.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No emails sent yet. Use the compose tab to send your first email.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template: {editingTemplate?.name}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => updateTemplateMutation.mutateAsync({ id: editingTemplate.id, data }))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Welcome Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="welcome">Welcome</SelectItem>
                          <SelectItem value="follow-up">Follow-up</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="assignedUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to User (Optional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "global" ? undefined : parseInt(value))} value={field.value?.toString() || "global"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user or leave as global" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="global">Global Template</SelectItem>
                        {Array.isArray(users) && users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.firstName} {user.lastName} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="isGlobal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Global Template</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Make this template available to all users
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="htmlContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTML Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="min-h-[300px] font-mono text-sm"
                        placeholder="Enter HTML content for the email template..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-2">
                <Button type="submit" disabled={updateTemplateMutation.isPending}>
                  {updateTemplateMutation.isPending ? "Updating..." : "Update Template"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}