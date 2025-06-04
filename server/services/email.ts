import { storage } from "../storage";

class EmailService {
  async sendEmail(emailId: number) {
    try {
      const email = await storage.getEmail(emailId);
      if (!email) {
        throw new Error("Email not found");
      }

      // In a real implementation, this would integrate with an email service
      // For now, we'll simulate sending and mark as sent
      console.log(`Sending email to ${email.to}: ${email.subject}`);
      
      // Simulate email sending delay
      setTimeout(async () => {
        await storage.updateEmail(emailId, {
          status: "sent",
          sentAt: new Date()
        });
      }, 1000);

      // Simulate email opening after a delay
      setTimeout(async () => {
        if (Math.random() > 0.3) { // 70% open rate simulation
          await storage.updateEmail(emailId, {
            openedAt: new Date()
          });
        }
      }, 5000);

    } catch (error) {
      console.error("Email sending error:", error);
      await storage.updateEmail(emailId, {
        status: "failed"
      });
      throw error;
    }
  }

  async getEmailTemplates() {
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

Please log into the Wish Desk CRM to view more details.

Best regards,
Wish Desk CRM Team`
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

Thanks for your hard work!

Best regards,
Wish Desk CRM Team`
      },
      {
        id: 'weekly-report',
        name: 'Weekly Report',
        subject: 'Weekly Team Performance Report - {weekDate}',
        body: `Hi Team,

Here's your weekly performance summary:

**Tasks Completed:** {tasksCompleted}
**Active Tasks:** {activeTasks}
**GitHub Activity:** {githubCommits} commits
**Team Productivity:** {productivityScore}%

Full report is available in the CRM dashboard.

Best regards,
Wish Desk CRM Team`
      }
    ];
  }
}

export const emailService = new EmailService();
