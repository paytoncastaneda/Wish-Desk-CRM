import { storage } from "../storage";
import type { Report, InsertReport } from "@shared/schema";
import fs from "fs/promises";
import path from "path";

interface ReportGenerator {
  type: string;
  name: string;
  description: string;
  generate(parameters?: any): Promise<string>;
}

class ReportsService {
  private generators: Map<string, ReportGenerator>;

  constructor() {
    this.generators = new Map();
    this.initializeGenerators();
  }

  private initializeGenerators() {
    const generators: ReportGenerator[] = [
      {
        type: "task-performance",
        name: "Task Performance Report",
        description: "Comprehensive analysis of task completion rates, team productivity, and bottlenecks",
        generate: this.generateTaskPerformanceReport.bind(this)
      },
      {
        type: "github-activity",
        name: "GitHub Activity Report", 
        description: "Repository insights, commit history, and development activity across your GitHub account",
        generate: this.generateGitHubActivityReport.bind(this)
      },
      {
        type: "email-campaign",
        name: "Email Campaign Report",
        description: "Email delivery statistics, open rates, and engagement metrics for your campaigns",
        generate: this.generateEmailCampaignReport.bind(this)
      },
      {
        type: "team-productivity",
        name: "Team Productivity Report",
        description: "Individual and team performance metrics with workload distribution analysis",
        generate: this.generateTeamProductivityReport.bind(this)
      },
      {
        type: "system-usage",
        name: "System Usage Report",
        description: "CRM usage statistics, feature adoption, and system performance metrics",
        generate: this.generateSystemUsageReport.bind(this)
      }
    ];

    generators.forEach(generator => {
      this.generators.set(generator.type, generator);
    });
  }

  async generateReport(type: string, parameters?: any): Promise<Report> {
    const generator = this.generators.get(type);
    if (!generator) {
      throw new Error(`Report generator for type '${type}' not found`);
    }

    // Create report record
    const report = await storage.createReport({
      title: generator.name,
      type,
      status: "processing",
      parameters
    });

    // Generate report asynchronously
    this.processReportGeneration(report, generator, parameters);

    return report;
  }

  private async processReportGeneration(
    report: Report, 
    generator: ReportGenerator, 
    parameters?: any
  ): Promise<void> {
    try {
      const content = await generator.generate(parameters);
      const fileName = `report-${report.id}-${Date.now()}.md`;
      const filePath = path.join(process.cwd(), "generated-reports", fileName);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write report content
      await fs.writeFile(filePath, content, 'utf-8');

      // Calculate page count (estimate based on content length)
      const pageCount = Math.ceil(content.length / 3000); // ~3000 chars per page

      // Update report status
      await storage.updateReport(report.id, {
        status: "completed",
        filePath: fileName,
        pageCount,
        completedAt: new Date()
      });
    } catch (error) {
      console.error(`Report generation failed for ${report.id}:`, error);
      await storage.updateReport(report.id, {
        status: "failed"
      });
    }
  }

  private async generateTaskPerformanceReport(parameters?: any): Promise<string> {
    const tasks = await storage.getTasks();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentTasks = tasks.filter(task => 
      task.createdAt && new Date(task.createdAt) >= weekAgo
    );

    const completedTasks = recentTasks.filter(task => task.status === "completed");
    const inProgressTasks = recentTasks.filter(task => task.status === "progress");
    const todoTasks = recentTasks.filter(task => task.status === "todo");

    const completionRate = recentTasks.length > 0 
      ? (completedTasks.length / recentTasks.length) * 100 
      : 0;

    const priorityBreakdown = {
      high: recentTasks.filter(task => task.priority === "high").length,
      medium: recentTasks.filter(task => task.priority === "medium").length,
      low: recentTasks.filter(task => task.priority === "low").length
    };

    return `# Task Performance Report

## Report Period
**Generated:** ${now.toLocaleDateString()}  
**Period:** Last 7 days (${weekAgo.toLocaleDateString()} - ${now.toLocaleDateString()})

## Executive Summary
This report provides an analysis of task completion rates, team productivity, and workflow bottlenecks for the past week.

## Key Metrics

### Task Completion Overview
- **Total Tasks:** ${recentTasks.length}
- **Completed:** ${completedTasks.length}
- **In Progress:** ${inProgressTasks.length}
- **To Do:** ${todoTasks.length}
- **Completion Rate:** ${completionRate.toFixed(1)}%

### Priority Distribution
- **High Priority:** ${priorityBreakdown.high} tasks
- **Medium Priority:** ${priorityBreakdown.medium} tasks
- **Low Priority:** ${priorityBreakdown.low} tasks

## Task Analysis

### Recently Completed Tasks
${completedTasks.slice(0, 10).map(task => 
  `- **${task.title}** (${task.priority} priority) - Completed ${task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'Unknown'}`
).join('\n')}

### Tasks In Progress
${inProgressTasks.slice(0, 10).map(task => 
  `- **${task.title}** (${task.priority} priority) - Due ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}`
).join('\n')}

## Recommendations

${completionRate < 50 ? '⚠️ **Action Required:** Task completion rate is below 50%. Consider reviewing task assignments and deadlines.' : '✅ Task completion rate is healthy.'}

${priorityBreakdown.high > priorityBreakdown.medium + priorityBreakdown.low ? '⚠️ **Attention:** High number of high-priority tasks may indicate resource constraints.' : ''}

## Next Steps
1. Review overdue tasks and reassign if necessary
2. Monitor high-priority task completion
3. Consider adjusting task load distribution

---
*Report generated by Wish Desk CRM - ${now.toISOString()}*
`;
  }

  private async generateGitHubActivityReport(parameters?: any): Promise<string> {
    const repos = await storage.getGitHubRepos();
    const totalRepos = repos.length;
    const privateRepos = repos.filter(repo => repo.isPrivate).length;
    const publicRepos = totalRepos - privateRepos;

    const languageStats = repos.reduce((acc, repo) => {
      if (repo.language) {
        acc[repo.language] = (acc[repo.language] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalStars = repos.reduce((sum, repo) => sum + (repo.stars || 0), 0);
    const totalForks = repos.reduce((sum, repo) => sum + (repo.forks || 0), 0);

    return `# GitHub Activity Report

## Report Period
**Generated:** ${new Date().toLocaleDateString()}  
**Account:** Wish Desk CRM GitHub Integration

## Repository Overview

### Repository Statistics
- **Total Repositories:** ${totalRepos}
- **Public Repositories:** ${publicRepos}
- **Private Repositories:** ${privateRepos}
- **Total Stars:** ${totalStars}
- **Total Forks:** ${totalForks}

### Language Distribution
${Object.entries(languageStats)
  .sort((a, b) => b[1] - a[1])
  .map(([language, count]) => `- **${language}:** ${count} repositories`)
  .join('\n')}

## Repository Details

### Most Active Repositories
${repos
  .sort((a, b) => (b.stars || 0) - (a.stars || 0))
  .slice(0, 10)
  .map(repo => 
    `- **${repo.name}** (${repo.language || 'Unknown'}) - ${repo.stars} stars, ${repo.forks} forks`
  )
  .join('\n')}

### Recent Activity
${repos
  .filter(repo => repo.lastSync)
  .sort((a, b) => new Date(b.lastSync!).getTime() - new Date(a.lastSync!).getTime())
  .slice(0, 10)
  .map(repo => 
    `- **${repo.name}** - Last synced ${new Date(repo.lastSync!).toLocaleDateString()}`
  )
  .join('\n')}

## Insights

### Development Focus
${Object.entries(languageStats).length > 0 
  ? `Primary development language: **${Object.entries(languageStats).sort((a, b) => b[1] - a[1])[0][0]}**`
  : 'No language data available'
}

### Repository Health
- Average stars per repository: ${totalRepos > 0 ? (totalStars / totalRepos).toFixed(1) : 0}
- Average forks per repository: ${totalRepos > 0 ? (totalForks / totalRepos).toFixed(1) : 0}

## Recommendations
1. Consider adding more documentation to repositories with high star counts
2. Regular maintenance of repositories with recent activity
3. Review private repositories for potential open-source opportunities

---
*Report generated by Wish Desk CRM - ${new Date().toISOString()}*
`;
  }

  private async generateEmailCampaignReport(parameters?: any): Promise<string> {
    const emails = await storage.getEmails();
    const sentEmails = emails.filter(email => email.status === "sent");
    const openedEmails = sentEmails.filter(email => email.openedAt);
    
    const openRate = sentEmails.length > 0 
      ? (openedEmails.length / sentEmails.length) * 100 
      : 0;

    const templateStats = emails.reduce((acc, email) => {
      if (email.template) {
        acc[email.template] = (acc[email.template] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return `# Email Campaign Report

## Report Period
**Generated:** ${new Date().toLocaleDateString()}  
**Period:** All-time email campaign data

## Campaign Overview

### Email Statistics
- **Total Emails Sent:** ${sentEmails.length}
- **Total Emails Opened:** ${openedEmails.length}
- **Open Rate:** ${openRate.toFixed(1)}%
- **Pending Emails:** ${emails.filter(email => email.status === "pending").length}

### Template Performance
${Object.entries(templateStats)
  .sort((a, b) => b[1] - a[1])
  .map(([template, count]) => `- **${template}:** ${count} emails sent`)
  .join('\n')}

## Detailed Analysis

### Recent Email Activity
${emails
  .slice(0, 10)
  .map(email => 
    `- **${email.subject}** - Sent to ${email.to} (${email.status})`
  )
  .join('\n')}

### Engagement Metrics
- **Best Performing Template:** ${
  Object.entries(templateStats).length > 0 
    ? Object.entries(templateStats).sort((a, b) => b[1] - a[1])[0][0]
    : 'None'
}
- **Average Time to Open:** Varies by campaign

## Recommendations
${openRate < 30 ? '⚠️ **Low Open Rate:** Consider improving subject lines and send timing' : '✅ Good email engagement'}

1. A/B test subject lines for better open rates
2. Segment email lists for more targeted campaigns
3. Monitor send timing for optimal engagement

---
*Report generated by Wish Desk CRM - ${new Date().toISOString()}*
`;
  }

  private async generateTeamProductivityReport(parameters?: any): Promise<string> {
    const tasks = await storage.getTasks();
    const assigneeStats = tasks.reduce((acc, task) => {
      if (task.assignedTo) {
        if (!acc[task.assignedTo]) {
          acc[task.assignedTo] = { total: 0, completed: 0, inProgress: 0, todo: 0 };
        }
        acc[task.assignedTo].total++;
        acc[task.assignedTo][task.status as keyof typeof acc[string]]++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number; inProgress: number; todo: number }>);

    return `# Team Productivity Report

## Report Overview
**Generated:** ${new Date().toLocaleDateString()}  
**Team Members Analyzed:** ${Object.keys(assigneeStats).length}

## Individual Performance

${Object.entries(assigneeStats)
  .map(([assignee, stats]) => {
    const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    return `### ${assignee}
- **Total Tasks:** ${stats.total}
- **Completed:** ${stats.completed}
- **In Progress:** ${stats.inProgress}
- **To Do:** ${stats.todo}
- **Completion Rate:** ${completionRate.toFixed(1)}%
`;
  })
  .join('\n')}

## Team Summary
- **Total Team Tasks:** ${tasks.length}
- **Unassigned Tasks:** ${tasks.filter(task => !task.assignedTo).length}

## Insights
${Object.keys(assigneeStats).length === 0 
  ? 'No task assignments found. Consider assigning tasks to team members for better tracking.'
  : 'Team productivity metrics show task distribution and completion rates.'
}

---
*Report generated by Wish Desk CRM - ${new Date().toISOString()}*
`;
  }

  private async generateSystemUsageReport(parameters?: any): Promise<string> {
    const tasks = await storage.getTasks();
    const repos = await storage.getGitHubRepos();
    const emails = await storage.getEmails();
    const reports = await storage.getReports();
    const docs = await storage.getDocuments();

    return `# System Usage Report

## Report Overview
**Generated:** ${new Date().toLocaleDateString()}  
**Wish Desk CRM System Usage Analysis**

## Feature Adoption

### Core Modules
- **Task Management:** ${tasks.length} total tasks
- **GitHub Integration:** ${repos.length} repositories synced
- **Email Center:** ${emails.length} emails processed
- **Reports Generated:** ${reports.length} reports
- **Documentation:** ${docs.length} documents

### Usage Patterns
- **Most Active Module:** ${
  Math.max(tasks.length, repos.length, emails.length, reports.length, docs.length) === tasks.length ? 'Task Management' :
  Math.max(repos.length, emails.length, reports.length, docs.length) === repos.length ? 'GitHub Integration' :
  Math.max(emails.length, reports.length, docs.length) === emails.length ? 'Email Center' :
  Math.max(reports.length, docs.length) === reports.length ? 'Reports' : 'Documentation'
}

## System Health
- **Database Records:** ${tasks.length + repos.length + emails.length + reports.length + docs.length} total
- **Active Integrations:** GitHub API
- **System Status:** Operational

## Recommendations
1. Continue expanding most-used features
2. Consider user training for underutilized modules
3. Monitor system performance as usage grows

---
*Report generated by Wish Desk CRM - ${new Date().toISOString()}*
`;
  }

  getAvailableReports(): Array<{ type: string; name: string; description: string }> {
    return Array.from(this.generators.values()).map(generator => ({
      type: generator.type,
      name: generator.name,
      description: generator.description
    }));
  }

  async getReportContent(reportId: number): Promise<string | null> {
    const report = await storage.getReport(reportId);
    if (!report || !report.filePath) return null;

    try {
      const filePath = path.join(process.cwd(), "generated-reports", report.filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Error reading report file for ${reportId}:`, error);
      return null;
    }
  }
}

export const reportsService = new ReportsService();
