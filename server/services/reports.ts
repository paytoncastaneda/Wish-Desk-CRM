import { storage } from "../storage";

class ReportsService {
  async generateReport(reportId: number) {
    try {
      const report = await storage.getReport(reportId);
      if (!report) {
        throw new Error("Report not found");
      }

      await storage.updateReport(reportId, {
        status: "processing"
      });

      // Simulate report generation
      setTimeout(async () => {
        const data = await this.generateReportData(report.type);
        
        await storage.updateReport(reportId, {
          status: "completed",
          data,
          generatedAt: new Date()
        });
      }, 2000);

    } catch (error) {
      console.error("Report generation error:", error);
      await storage.updateReport(reportId, {
        status: "failed"
      });
      throw error;
    }
  }

  private async generateReportData(type: string) {
    switch (type) {
      case 'task-performance':
        return await this.generateTaskPerformanceData();
      case 'github-activity':
        return await this.generateGitHubActivityData();
      case 'email-campaign':
        return await this.generateEmailCampaignData();
      case 'team-productivity':
        return await this.generateTeamProductivityData();
      case 'system-usage':
        return await this.generateSystemUsageData();
      default:
        return {};
    }
  }

  private async generateTaskPerformanceData() {
    const tasks = await storage.getAllTasks();
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const activeTasks = tasks.filter(task => task.status !== 'completed');
    
    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      activeTasks: activeTasks.length,
      completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length * 100).toFixed(1) : 0,
      averageCompletionTime: this.calculateAverageCompletionTime(completedTasks),
      tasksByPriority: this.groupTasksByPriority(tasks),
      tasksByStatus: this.groupTasksByStatus(tasks)
    };
  }

  private async generateGitHubActivityData() {
    const repos = await storage.getAllRepos();
    const commits = await storage.getAllCommits();
    
    return {
      totalRepos: repos.length,
      totalCommits: commits.length,
      reposByLanguage: this.groupReposByLanguage(repos),
      commitsByRepo: this.groupCommitsByRepo(commits, repos),
      recentActivity: commits.slice(0, 50)
    };
  }

  private async generateEmailCampaignData() {
    const emails = await storage.getAllEmails();
    const sentEmails = emails.filter(email => email.status === 'sent');
    const openedEmails = emails.filter(email => email.openedAt);
    
    return {
      totalEmails: emails.length,
      sentEmails: sentEmails.length,
      openedEmails: openedEmails.length,
      openRate: sentEmails.length > 0 ? (openedEmails.length / sentEmails.length * 100).toFixed(1) : 0,
      emailsByTemplate: this.groupEmailsByTemplate(emails),
      deliveryStatus: this.groupEmailsByStatus(emails)
    };
  }

  private async generateTeamProductivityData() {
    const tasks = await storage.getAllTasks();
    
    return {
      tasksByAssignee: this.groupTasksByAssignee(tasks),
      completionRateByAssignee: this.calculateCompletionRateByAssignee(tasks),
      workloadDistribution: this.calculateWorkloadDistribution(tasks)
    };
  }

  private async generateSystemUsageData() {
    const tasks = await storage.getAllTasks();
    const emails = await storage.getAllEmails();
    const reports = await storage.getAllReports();
    const docs = await storage.getAllDocumentation();
    
    return {
      featureUsage: {
        tasks: tasks.length,
        emails: emails.length,
        reports: reports.length,
        documentation: docs.length
      },
      growthMetrics: this.calculateGrowthMetrics(tasks, emails, reports, docs)
    };
  }

  private calculateAverageCompletionTime(completedTasks: any[]) {
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => {
      if (task.completedAt && task.createdAt) {
        return sum + (task.completedAt.getTime() - task.createdAt.getTime());
      }
      return sum;
    }, 0);
    
    return Math.round(totalTime / completedTasks.length / (1000 * 60 * 60 * 24)); // days
  }

  private groupTasksByPriority(tasks: any[]) {
    return tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});
  }

  private groupTasksByStatus(tasks: any[]) {
    return tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
  }

  private groupReposByLanguage(repos: any[]) {
    return repos.reduce((acc, repo) => {
      const lang = repo.language || 'Unknown';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});
  }

  private groupCommitsByRepo(commits: any[], repos: any[]) {
    const repoMap = repos.reduce((acc, repo) => {
      acc[repo.repoId] = repo.name;
      return acc;
    }, {});
    
    return commits.reduce((acc, commit) => {
      const repoName = repoMap[commit.repoId] || 'Unknown';
      acc[repoName] = (acc[repoName] || 0) + 1;
      return acc;
    }, {});
  }

  private groupEmailsByTemplate(emails: any[]) {
    return emails.reduce((acc, email) => {
      const template = email.template || 'No Template';
      acc[template] = (acc[template] || 0) + 1;
      return acc;
    }, {});
  }

  private groupEmailsByStatus(emails: any[]) {
    return emails.reduce((acc, email) => {
      acc[email.status] = (acc[email.status] || 0) + 1;
      return acc;
    }, {});
  }

  private groupTasksByAssignee(tasks: any[]) {
    return tasks.reduce((acc, task) => {
      const assignee = task.assignedTo || 'Unassigned';
      acc[assignee] = (acc[assignee] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateCompletionRateByAssignee(tasks: any[]) {
    const byAssignee = this.groupTasksByAssignee(tasks);
    const completedByAssignee = tasks
      .filter(task => task.status === 'completed')
      .reduce((acc, task) => {
        const assignee = task.assignedTo || 'Unassigned';
        acc[assignee] = (acc[assignee] || 0) + 1;
        return acc;
      }, {});
    
    return Object.keys(byAssignee).reduce((acc, assignee) => {
      const total = byAssignee[assignee];
      const completed = completedByAssignee[assignee] || 0;
      acc[assignee] = total > 0 ? (completed / total * 100).toFixed(1) : 0;
      return acc;
    }, {});
  }

  private calculateWorkloadDistribution(tasks: any[]) {
    const activeTasks = tasks.filter(task => task.status !== 'completed');
    return this.groupTasksByAssignee(activeTasks);
  }

  private calculateGrowthMetrics(tasks: any[], emails: any[], reports: any[], docs: any[]) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    return {
      tasksGrowth: tasks.filter(t => t.createdAt >= lastMonth).length,
      emailsGrowth: emails.filter(e => e.createdAt >= lastMonth).length,
      reportsGrowth: reports.filter(r => r.createdAt >= lastMonth).length,
      docsGrowth: docs.filter(d => d.createdAt >= lastMonth).length
    };
  }

  async exportReport(reportId: number, format: string = 'pdf') {
    const report = await storage.getReport(reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    // Simulate file generation
    const content = `${report.title}\n\nGenerated: ${new Date().toISOString()}\n\n${JSON.stringify(report.data, null, 2)}`;
    
    switch (format) {
      case 'csv':
        return Buffer.from(this.convertToCSV(report.data), 'utf-8');
      case 'json':
        return Buffer.from(JSON.stringify(report.data, null, 2), 'utf-8');
      default:
        return Buffer.from(content, 'utf-8');
    }
  }

  private convertToCSV(data: any): string {
    if (!data || typeof data !== 'object') {
      return 'No data available';
    }
    
    // Simple CSV conversion for basic data structures
    const lines: string[] = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        lines.push(`${key},${JSON.stringify(value)}`);
      } else {
        lines.push(`${key},${value}`);
      }
    }
    
    return lines.join('\n');
  }
}

export const reportsService = new ReportsService();
