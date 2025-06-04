import { storage } from "../storage";
import type { Email, InsertEmail } from "@shared/schema";

interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
  category: string;
}

class EmailService {
  private templates: Map<string, EmailTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  private initializeTemplates() {
    const defaultTemplates: EmailTemplate[] = [
      {
        name: "task-assignment",
        subject: "New Task Assigned: {{taskTitle}}",
        body: `
          <h2>You have been assigned a new task</h2>
          <h3>{{taskTitle}}</h3>
          <p><strong>Description:</strong> {{taskDescription}}</p>
          <p><strong>Priority:</strong> {{taskPriority}}</p>
          <p><strong>Due Date:</strong> {{taskDueDate}}</p>
          <p>Please log into the CRM to view more details and start working on this task.</p>
        `,
        category: "system"
      },
      {
        name: "task-completion",
        subject: "Task Completed: {{taskTitle}}",
        body: `
          <h2>Congratulations! Task completed</h2>
          <h3>{{taskTitle}}</h3>
          <p>The task has been marked as completed by {{completedBy}}.</p>
          <p><strong>Completion Date:</strong> {{completionDate}}</p>
          <p>Great work on completing this task!</p>
        `,
        category: "system"
      },
      {
        name: "weekly-report",
        subject: "Weekly Performance Report - {{weekOf}}",
        body: `
          <h2>Weekly Team Performance Report</h2>
          <h3>Week of {{weekOf}}</h3>
          <h4>Summary:</h4>
          <ul>
            <li>Tasks Completed: {{tasksCompleted}}</li>
            <li>New Tasks Created: {{newTasks}}</li>
            <li>Team Productivity: {{productivity}}%</li>
          </ul>
          <p>View the full report in the CRM dashboard for detailed insights.</p>
        `,
        category: "custom"
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.name, template);
    });
  }

  async sendEmail(emailData: InsertEmail): Promise<Email> {
    try {
      // Create email record
      const email = await storage.createEmail(emailData);

      // In a real implementation, you would integrate with an email service like:
      // - SendGrid
      // - AWS SES
      // - Nodemailer with SMTP
      // For now, we'll simulate sending and mark as sent
      
      await this.simulateEmailSending(email);

      return email;
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send email');
    }
  }

  private async simulateEmailSending(email: Email): Promise<void> {
    // Simulate email sending delay
    setTimeout(async () => {
      await storage.updateEmail(email.id, {
        status: "sent",
        sentAt: new Date()
      });

      // Simulate email opening after some time
      setTimeout(async () => {
        if (Math.random() > 0.3) { // 70% open rate simulation
          await storage.updateEmail(email.id, {
            openedAt: new Date()
          });
        }
      }, Math.random() * 3600000); // Random time within 1 hour
    }, 1000); // 1 second sending delay
  }

  async sendTaskAssignmentEmail(taskData: {
    to: string;
    taskTitle: string;
    taskDescription: string;
    taskPriority: string;
    taskDueDate: string;
  }): Promise<Email> {
    const template = this.templates.get("task-assignment");
    if (!template) throw new Error("Task assignment template not found");

    const subject = this.replaceTemplateVariables(template.subject, taskData);
    const body = this.replaceTemplateVariables(template.body, taskData);

    return this.sendEmail({
      to: taskData.to,
      subject,
      body,
      template: "task-assignment",
      status: "pending"
    });
  }

  async sendTaskCompletionEmail(taskData: {
    to: string;
    taskTitle: string;
    completedBy: string;
    completionDate: string;
  }): Promise<Email> {
    const template = this.templates.get("task-completion");
    if (!template) throw new Error("Task completion template not found");

    const subject = this.replaceTemplateVariables(template.subject, taskData);
    const body = this.replaceTemplateVariables(template.body, taskData);

    return this.sendEmail({
      to: taskData.to,
      subject,
      body,
      template: "task-completion",
      status: "pending"
    });
  }

  async sendWeeklyReport(reportData: {
    to: string;
    weekOf: string;
    tasksCompleted: number;
    newTasks: number;
    productivity: number;
  }): Promise<Email> {
    const template = this.templates.get("weekly-report");
    if (!template) throw new Error("Weekly report template not found");

    const subject = this.replaceTemplateVariables(template.subject, reportData);
    const body = this.replaceTemplateVariables(template.body, reportData);

    return this.sendEmail({
      to: reportData.to,
      subject,
      body,
      template: "weekly-report",
      status: "pending"
    });
  }

  private replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(variables[key]));
    });
    return result;
  }

  getTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(name: string): EmailTemplate | undefined {
    return this.templates.get(name);
  }

  async getEmailStats(): Promise<{
    sentToday: number;
    openRate: number;
    pending: number;
    totalSent: number;
  }> {
    const emails = await storage.getEmails();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentToday = emails.filter(email => 
      email.sentAt && new Date(email.sentAt) >= today
    ).length;

    const sentEmails = emails.filter(email => email.status === "sent");
    const openedEmails = sentEmails.filter(email => email.openedAt);
    const openRate = sentEmails.length > 0 ? (openedEmails.length / sentEmails.length) * 100 : 0;

    const pending = emails.filter(email => email.status === "pending").length;

    return {
      sentToday,
      openRate: Math.round(openRate),
      pending,
      totalSent: sentEmails.length
    };
  }
}

export const emailService = new EmailService();
