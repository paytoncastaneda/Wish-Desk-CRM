import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, GitFork, RefreshCw, ExternalLink } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { GithubRepo } from "@shared/schema";

interface RepoListProps {
  repos: GithubRepo[];
  isLoading: boolean;
}

export default function RepoList({ repos, isLoading }: RepoListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncRepoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/github/repos/${id}/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/github/repos"] });
      toast({ title: "Repository synced successfully" });
    },
    onError: () => {
      toast({ title: "Failed to sync repository", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-crm-surface border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-crm-surface border border-gray-200 dark:border-gray-700">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="font-medium text-gray-900 dark:text-white">Repositories</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {repos.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No repositories found. Click "Sync Now" to import your GitHub repositories.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {repos.map((repo) => (
              <div key={repo.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                        {repo.fullName}
                      </h5>
                      <Badge className="bg-primary bg-opacity-10 text-primary">
                        {repo.branch}
                      </Badge>
                      <Badge className={
                        repo.isPrivate 
                          ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" 
                          : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                      }>
                        {repo.isPrivate ? "Private" : "Public"}
                      </Badge>
                    </div>
                    
                    {repo.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {repo.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      {repo.language && (
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Star className="mr-1" size={12} />
                        {repo.stars} stars
                      </span>
                      <span className="flex items-center">
                        <GitFork className="mr-1" size={12} />
                        {repo.forks} forks
                      </span>
                      {repo.lastSync && (
                        <span>
                          Updated {formatDistanceToNow(new Date(repo.lastSync), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {repo.repoData?.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={repo.repoData.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={14} />
                        </a>
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      onClick={() => syncRepoMutation.mutate(repo.id)}
                      disabled={syncRepoMutation.isPending}
                      className="bg-primary hover:bg-blue-700"
                    >
                      <RefreshCw className={`mr-1 ${syncRepoMutation.isPending ? 'animate-spin' : ''}`} size={12} />
                      Sync
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
