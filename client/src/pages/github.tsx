import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Github } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RepoList from "@/components/github/repo-list";

export default function GitHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: repos, isLoading } = useQuery({
    queryKey: ["/api/github/repos"],
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/github/sync");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/github/repos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({ 
        title: "GitHub sync completed", 
        description: `Synced ${data.syncedCount} repositories` 
      });
    },
    onError: () => {
      toast({ 
        title: "Sync failed", 
        description: "Failed to sync GitHub repositories. Please check your GitHub token.",
        variant: "destructive" 
      });
    },
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">GitHub Integration</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Connect and sync your GitHub repositories</p>
        </div>
        <Button onClick={handleSync} disabled={syncMutation.isPending} className="bg-primary hover:bg-blue-700">
          <RefreshCw className={`mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} size={16} />
          {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      {/* Connection Status */}
      <Card className="bg-crm-surface border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="font-medium text-gray-900 dark:text-white">Connection Status</CardTitle>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <Github className="mr-1" size={12} />
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {repos?.length || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Repositories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {repos?.length > 0 ? '2 hrs ago' : 'Never'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Sync</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {repos?.reduce((acc: number, repo: any) => acc + (repo.stars || 0), 0) || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Stars</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repository List */}
      <RepoList repos={repos || []} isLoading={isLoading} />
    </div>
  );
}
