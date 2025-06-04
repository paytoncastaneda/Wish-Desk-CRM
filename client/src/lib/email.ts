import { apiRequest } from "./queryClient";
import type { Email, InsertEmail } from "@shared/schema";

export interface EmailStats {
  sentToday: number;
  openRate: number;
  pending: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'system' | 'custom';
  usage: number;
  lastUsed?: Date;
}

export class EmailService {
  async getEmails(): Promise<Email[]> {
    const response = await apiRequest("GET", "/api/emails");
    return response.json();
  }

  async createEmail(emailData: InsertEmail): Promise<Email> {
    const response = await apiRequest("POST", "/api/emails", emailData);
    return response.json();
  }

  async getEmailStats(): Promise<EmailStats> {
    const response = await apiRequest("GET", "/api/emails/stats");
    return response.json();
  }

  async sendEmail(to: string, subject: string, body: string, template?: string): Promise<Email> {
    return this.createEmail({
      to,
      subject,
      body,
      template,
    });
  }

  async sendTemplateEmail(templateId: string, to: string, variables: Record<string, string>): Promise<Email> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const subject = this.replaceVariables(template.subject, variables);
    const body = this.replaceVariables(template.body, variables);

    return this.sendEmail(to, subject, body, templateId);
  }

  async sendBulkEmails(emails: Array<{ to: string; subject: string; body: string; template?: string }>): Promise<Email[]> {
    const promises = emails.map(email => this.createEmail(email));
    return Promise.all(promises);
  }

  getTemplates(): EmailTemplate[] {
    return [
      {
        id: 'task-assignment',
        name: 'Task Assignment',
        subject: 'New Task Assigned: {taskTitle}',
        body: `Hi {assigneeName},

You have been assigned a new task:

**{taskTitle}**
{taskDescription}

Priority: {taskPriority}
Due Date: {taskDueDate}

Please log into the Wish Desk CRM to view more details and start working on this task.

Best regards,
Wish Desk CRM Team`,
        category: 'system',
        usage: 15
      },
      {
        id: 'task-completion',
        name: 'Task Completion',
        subject: 'Task Completed: {taskTitle}',
        body: `Hi Team,

Great news! The following task has been completed:

**{taskTitle}**
Completed by: {completedBy}
Completion Date: {completionDate}

{taskDescription}

Thanks for your excellent work!

Best regards,
Wish Desk CRM Team`,
        category: 'system',
        usage: 28
      },
      {
        id: 'task-overdue',
        name: 'Task Overdue',
        subject: 'Overdue Task Reminder: {taskTitle}',
        body: `Hi {assigneeName},

This is a reminder that the following task is overdue:

**{taskTitle}**
Due Date: {taskDueDate}
Priority: {taskPriority}

{taskDescription}

Please prioritize this task and update its status in the CRM system.

Best regards,
Wish Desk CRM Team`,
        category: 'system',
        usage: 8
      },
      {
        id: 'weekly-report',
        name: 'Weekly Report',
        subject: 'Weekly Team Performance Report - {weekDate}',
        body: `Hi Team,

Here's your weekly performance summary for the week of {weekDate}:

**Team Statistics:**
- Tasks Completed: {tasksCompleted}
- Active Tasks: {activeTasks}
- GitHub Commits: {githubCommits}
- Team Productivity Score: {productivityScore}%

**Top Performers:**
{topPerformers}

**Areas for Improvement:**
{improvements}

The full detailed report is available in the CRM dashboard.

Keep up the great work!

Best regards,
Wish Desk CRM Team`,
        category: 'custom',
        usage: 8
      },
      {
        id: 'system-maintenance',
        name: 'System Maintenance',
        subject: 'Scheduled Maintenance Notice - {maintenanceDate}',
        body: `Hi Team,

We will be performing scheduled maintenance on the Wish Desk CRM system:

**Maintenance Window:**
Date: {maintenanceDate}
Time: {maintenanceTime}
Duration: {maintenanceDuration}

**Expected Impact:**
{maintenanceImpact}

**What to Expect:**
- System will be temporarily unavailable
- All data will be preserved
- Normal operations will resume after maintenance

We apologize for any inconvenience and appreciate your patience.

Best regards,
Wish Desk CRM Team`,
        category: 'system',
        usage: 3
      },
      {
        id: 'welcome-user',
        name: 'Welcome New User',
        subject: 'Welcome to Wish Desk CRM, {userName}!',
        body: `Hi {userName},

Welcome to Wish Desk CRM! We're excited to have you on board.

**Getting Started:**
1. Complete your profile setup
2. Explore the dashboard and familiarize yourself with the interface
3. Check out the documentation section for helpful guides
4. Connect with your team members

**Your Account Details:**
Username: {userEmail}
Role: {userRole}
Team: {userTeam}

If you have any questions or need assistance, don't hesitate to reach out to your team lead or check our documentation.

Welcome aboard!

Best regards,
Wish Desk CRM Team`,
        category: 'system',
        usage: 12
      }
    ];
  }

  getTemplate(templateId: string): EmailTemplate | undefined {
    return this.getTemplates().find(template => template.id === templateId);
  }

  replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateEmailList(emails: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];
    
    emails.forEach(email => {
      if (this.validateEmail(email.trim())) {
        valid.push(email.trim());
      } else {
        invalid.push(email.trim());
      }
    });
    
    return { valid, invalid };
  }

  formatEmailAddress(name: string, email: string): string {
    return `${name} <${email}>`;
  }

  parseEmailAddress(emailAddress: string): { name?: string; email: string } {
    const match = emailAddress.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: emailAddress.trim() };
  }

  generateUnsubscribeLink(emailId: number): string {
    return `${window.location.origin}/unsubscribe?email=${emailId}`;
  }

  getEmailStatusColor(status: string): string {
    switch (status) {
      case 'sent':
        return 'text-success bg-success bg-opacity-10';
      case 'pending':
        return 'text-warning bg-warning bg-opacity-10';
      case 'failed':
        return 'text-error bg-error bg-opacity-10';
      case 'delivered':
        return 'text-success bg-success bg-opacity-10';
      case 'opened':
        return 'text-primary bg-primary bg-opacity-10';
      case 'clicked':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  calculateEngagementRate(emails: Email[]): number {
    const sentEmails = emails.filter(email => email.status === 'sent');
    const openedEmails = emails.filter(email => email.openedAt);
    
    if (sentEmails.length === 0) return 0;
    return Math.round((openedEmails.length / sentEmails.length) * 100);
  }

  getEmailMetrics(emails: Email[]) {
    const total = emails.length;
    const sent = emails.filter(email => email.status === 'sent').length;
    const pending = emails.filter(email => email.status === 'pending').length;
    const failed = emails.filter(email => email.status === 'failed').length;
    const opened = emails.filter(email => email.openedAt).length;
    
    const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;
    
    return {
      total,
      sent,
      pending,
      failed,
      opened,
      openRate,
      successRate
    };
  }

  groupEmailsByDate(emails: Email[]): Record<string, number> {
    return emails.reduce((acc, email) => {
      const date = new Date(email.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  getEmailActivity(emails: Email[], days: number = 30): Array<{ date: string; sent: number; opened: number }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const activity: Array<{ date: string; sent: number; opened: number }> = [];
    const sentByDate = this.groupEmailsByDate(emails.filter(e => e.status === 'sent'));
    const openedByDate = emails
      .filter(e => e.openedAt)
      .reduce((acc, email) => {
        const date = new Date(email.openedAt!).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      activity.push({
        date: dateStr,
        sent: sentByDate[dateStr] || 0,
        opened: openedByDate[dateStr] || 0
      });
    }

    return activity;
  }
}

export const emailService = new EmailService();
