import { apiRequest } from "./queryClient";
import type { GithubRepo, GithubCommit } from "@shared/schema";

export interface GitHubStatus {
  repos: number;
  lastSync: string;
  commits: number;
}

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
}

export class GitHubService {
  async getRepositories(): Promise<GithubRepo[]> {
    const response = await apiRequest("GET", "/api/github/repos");
    return response.json();
  }

  async syncAllRepositories(): Promise<void> {
    await apiRequest("POST", "/api/github/sync");
  }

  async syncRepository(repoId: number): Promise<void> {
    await apiRequest("POST", `/api/github/repos/${repoId}/sync`);
  }

  async getStatus(): Promise<GitHubStatus> {
    const response = await apiRequest("GET", "/api/github/status");
    return response.json();
  }

  async getCommits(repoId?: number): Promise<GithubCommit[]> {
    const url = repoId ? `/api/github/repos/${repoId}/commits` : "/api/github/commits";
    const response = await apiRequest("GET", url);
    return response.json();
  }

  async getAnalytics(): Promise<any> {
    const response = await apiRequest("GET", "/api/dashboard/github-analytics");
    return response.json();
  }

  // Utility functions for GitHub data
  formatRepoName(fullName: string): { owner: string; repo: string } {
    const [owner, repo] = fullName.split("/");
    return { owner, repo };
  }

  getRepoUrl(fullName: string): string {
    return `https://github.com/${fullName}`;
  }

  getCommitUrl(fullName: string, sha: string): string {
    return `https://github.com/${fullName}/commit/${sha}`;
  }

  formatCommitMessage(message: string, maxLength: number = 50): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength - 3) + "...";
  }

  getLanguageColor(language: string): string {
    const colors: Record<string, string> = {
      JavaScript: "#f1e05a",
      TypeScript: "#2b7489",
      Python: "#3572A5",
      Java: "#b07219",
      "C++": "#f34b7d",
      C: "#555555",
      "C#": "#239120",
      PHP: "#4F5D95",
      Ruby: "#701516",
      Go: "#00ADD8",
      Rust: "#dea584",
      Swift: "#ffac45",
      Kotlin: "#F18E33",
      Dart: "#00B4AB",
      HTML: "#e34c26",
      CSS: "#1572B6",
      SCSS: "#c6538c",
      Vue: "#4FC08D",
      React: "#61DAFB",
      Angular: "#DD0031",
      Shell: "#89e051",
      PowerShell: "#012456",
      Dockerfile: "#384d54",
      YAML: "#cb171e",
      JSON: "#292929",
      Markdown: "#083fa1",
    };
    return colors[language] || "#858585";
  }

  formatFileSize(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  }

  calculateRepoStats(repos: GithubRepo[]) {
    const totalStars = repos.reduce((sum, repo) => sum + (repo.stars || 0), 0);
    const totalForks = repos.reduce((sum, repo) => sum + (repo.forks || 0), 0);
    const languages = repos.reduce((acc, repo) => {
      if (repo.language) {
        acc[repo.language] = (acc[repo.language] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRepos: repos.length,
      totalStars,
      totalForks,
      languages,
      privateRepos: repos.filter(repo => repo.isPrivate).length,
      publicRepos: repos.filter(repo => !repo.isPrivate).length,
    };
  }

  groupCommitsByDate(commits: GithubCommit[]): Record<string, number> {
    return commits.reduce((acc, commit) => {
      const date = new Date(commit.date).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  getCommitActivity(commits: GithubCommit[], days: number = 30): Array<{ date: string; commits: number }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const activity: Array<{ date: string; commits: number }> = [];
    const commitsByDate = this.groupCommitsByDate(commits);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      activity.push({
        date: dateStr,
        commits: commitsByDate[dateStr] || 0
      });
    }

    return activity;
  }
}

export const githubService = new GitHubService();
