import { Octokit } from "@octokit/rest";
import { storage } from "../storage";

class GitHubService {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN || "",
    });
  }

  async syncRepositories() {
    try {
      if (!process.env.GITHUB_TOKEN && !process.env.GITHUB_ACCESS_TOKEN) {
        console.warn("No GitHub token provided, skipping repository sync");
        return;
      }

      const { data: repos } = await this.octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100
      });

      for (const repo of repos) {
        const existingRepo = await storage.getRepoByRepoId(repo.id);
        
        if (existingRepo) {
          await storage.updateRepo(existingRepo.id, {
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description || undefined,
            language: repo.language || undefined,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            isPrivate: repo.private
          });
        } else {
          await storage.createRepo({
            repoId: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description || undefined,
            language: repo.language || undefined,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            isPrivate: repo.private
          });
        }

        // Sync recent commits
        await this.syncRepositoryCommits(repo.owner.login, repo.name, repo.id);
      }
    } catch (error) {
      console.error("GitHub sync error:", error);
      throw error;
    }
  }

  async syncRepository(repoId: number) {
    try {
      const repo = await storage.getRepo(repoId);
      if (!repo) {
        throw new Error("Repository not found");
      }

      const [owner, name] = repo.fullName.split('/');
      await this.syncRepositoryCommits(owner, name, repo.repoId);
      
      // Update last sync time
      await storage.updateRepo(repoId, {});
    } catch (error) {
      console.error("Repository sync error:", error);
      throw error;
    }
  }

  private async syncRepositoryCommits(owner: string, repo: string, repoId: number) {
    try {
      const { data: commits } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 50
      });

      for (const commit of commits) {
        const existingCommits = await storage.getCommitsByRepo(repoId);
        const exists = existingCommits.some(c => c.sha === commit.sha);
        
        if (!exists) {
          await storage.createCommit({
            repoId,
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author?.name || 'Unknown',
            date: new Date(commit.commit.author?.date || Date.now())
          });
        }
      }
    } catch (error) {
      console.error("Commit sync error:", error);
    }
  }
}

export const githubService = new GitHubService();
