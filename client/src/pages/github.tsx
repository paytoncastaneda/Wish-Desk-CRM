import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Eye, GitBranch, Star, GitFork, Code, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GithubRepo } from "@shared/schema";

export default function GitHub() {
  const { toast } = useToast();

  const { data: repos = [], isLoading: reposLoading } = useQuery({
    queryKey: ["/api/github/repos"],
  });

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/github/status"],
  });

  const syncAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/github/sync");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/github/repos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/status"] });
      toast({
        title: "Sync Started",
        description: "GitHub synchronization has been initiated.",
      });
    },
  });

  const syncRepoMutation = useMutation({
    mutationFn: async (repoId: number) => {
      return apiRequest("POST", `/api/github/repos/${repoId}/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/github/repos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/status"] });
      toast({
        title: "Repository Synced",
        description: "Repository synchronization completed.",
      });
    },
  });

  if (reposLoading || statusLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">GitHub Integration</h3>
          <p className="text-sm text-gray-500">Connect and sync your GitHub repositories</p>
        </div>
        <Button
          onClick={() => syncAllMutation.mutate()}
          disabled={syncAllMutation.isPending}
          className="bg-primary hover:bg-blue-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncAllMutation.isPending ? 'animate-spin' : ''}`} />
          Sync Now
        </Button>
      </div>

      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Connection Status</h4>
            <Badge className="bg-success bg-opacity-10 text-success">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">{status?.repos || 0}</p>
              <p className="text-sm text-gray-500">Repositories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">{status?.lastSync || 'Never'}</p>
              <p className="text-sm text-gray-500">Last Sync</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">{status?.commits || 0}</p>
              <p className="text-sm text-gray-500">Recent Commits</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repositories List */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Repositories</h4>
          
          <div className="space-y-4">
            {repos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No repositories found. Click "Sync Now" to fetch your repositories.</p>
              </div>
            ) : (
              repos.map((repo: GithubRepo) => (
                <div
                  key={repo.id}
                  className="flex items-start justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="text-sm font-medium text-gray-900">{repo.fullName}</h5>
                      <Badge className="bg-primary bg-opacity-10 text-primary">Main</Badge>
                      <Badge className={repo.isPrivate ? "bg-gray-100 text-gray-600" : "bg-success bg-opacity-10 text-success"}>
                        {repo.isPrivate ? "Private" : "Public"}
                      </Badge>
                    </div>
                    
                    {repo.description && (
                      <p className="text-sm text-gray-500 mb-3">{repo.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {repo.language && (
                        <span className="flex items-center">
                          <Code className="w-3 h-3 mr-1" />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        {repo.stars} stars
                      </span>
                      <span className="flex items-center">
                        <GitFork className="w-3 h-3 mr-1" />
                        {repo.forks} forks
                      </span>
                      <span>
                        Updated {repo.updatedAt ? new Date(repo.updatedAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => syncRepoMutation.mutate(repo.id)}
                      disabled={syncRepoMutation.isPending}
                      className="bg-primary hover:bg-blue-700"
                    >
                      <GitBranch className="w-3 h-3 mr-1" />
                      Sync
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
