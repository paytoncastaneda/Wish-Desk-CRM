import { Octokit } from "@octokit/rest";
import { storage } from "../storage";
import type { GitHubRepo } from "@shared/schema";

class GitHubService {
  private octokit: Octokit;

  constructor() {
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN || "";
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async syncRepositories(): Promise<GitHubRepo[]> {
    try {
      const { data: repos } = await this.octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        direction: 'desc',
        per_page: 100
      });

      const syncedRepos: GitHubRepo[] = [];

      for (const repo of repos) {
        const repoData = {
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || null,
          language: repo.language || null,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          isPrivate: repo.private,
          lastSync: new Date(),
          repoData: {
            url: repo.html_url,
            cloneUrl: repo.clone_url,
            defaultBranch: repo.default_branch,
            updatedAt: repo.updated_at,
            size: repo.size
          }
        };

        // Check if repo already exists
        const existingRepos = await storage.getGitHubRepos();
        const existingRepo = existingRepos.find(r => r.fullName === repo.full_name);

        if (existingRepo) {
          const updated = await storage.updateGitHubRepo(existingRepo.id, repoData);
          if (updated) syncedRepos.push(updated);
        } else {
          const created = await storage.createGitHubRepo(repoData);
          syncedRepos.push(created);
        }
      }

      return syncedRepos;
    } catch (error) {
      console.error('GitHub sync error:', error);
      throw new Error('Failed to sync GitHub repositories');
    }
  }

  async getRepositoryStats(): Promise<{
    totalRepos: number;
    totalCommits: number;
    languages: Record<string, number>;
    recentActivity: Array<{
      repo: string;
      commits: number;
      lastUpdate: string;
    }>;
  }> {
    try {
      const repos = await storage.getGitHubRepos();
      const languages: Record<string, number> = {};
      let totalCommits = 0;
      const recentActivity = [];

      for (const repo of repos.slice(0, 10)) { // Limit to recent repos
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }

        try {
          const { data: commits } = await this.octokit.rest.repos.listCommits({
            owner: repo.fullName.split('/')[0],
            repo: repo.name,
            since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
            per_page: 100
          });

          totalCommits += commits.length;
          recentActivity.push({
            repo: repo.name,
            commits: commits.length,
            lastUpdate: repo.repoData?.updatedAt || repo.lastSync?.toISOString() || ''
          });
        } catch (error) {
          console.error(`Error fetching commits for ${repo.name}:`, error);
        }
      }

      return {
        totalRepos: repos.length,
        totalCommits,
        languages,
        recentActivity: recentActivity.sort((a, b) => b.commits - a.commits)
      };
    } catch (error) {
      console.error('Error getting repository stats:', error);
      throw new Error('Failed to get repository statistics');
    }
  }

  async getRepositoryDetails(repoId: number): Promise<{
    repo: GitHubRepo;
    commits: Array<any>;
    issues: Array<any>;
    pullRequests: Array<any>;
  } | null> {
    try {
      const repo = await storage.getGitHubRepo(repoId);
      if (!repo) return null;

      const [owner, repoName] = repo.fullName.split('/');

      const [commitsResponse, issuesResponse, pullsResponse] = await Promise.all([
        this.octokit.rest.repos.listCommits({
          owner,
          repo: repoName,
          per_page: 20
        }),
        this.octokit.rest.issues.listForRepo({
          owner,
          repo: repoName,
          state: 'all',
          per_page: 20
        }),
        this.octokit.rest.pulls.list({
          owner,
          repo: repoName,
          state: 'all',
          per_page: 20
        })
      ]);

      return {
        repo,
        commits: commitsResponse.data,
        issues: issuesResponse.data,
        pullRequests: pullsResponse.data
      };
    } catch (error) {
      console.error('Error getting repository details:', error);
      throw new Error('Failed to get repository details');
    }
  }
}

export const githubService = new GitHubService();
