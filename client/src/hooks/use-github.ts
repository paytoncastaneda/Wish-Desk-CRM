import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useGitHubRepos() {
  return useQuery({
    queryKey: ["/api/github/repos"],
    queryFn: api.github.getRepos,
  });
}

export function useGitHubStats() {
  return useQuery({
    queryKey: ["/api/github/stats"],
    queryFn: api.github.getStats,
  });
}

export function useGitHubSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.github.sync,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/github/repos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sync Complete",
        description: `Synced ${data.count} repositories successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync GitHub repositories",
        variant: "destructive",
      });
    },
  });
}

export function useGitHubRepoDetails(id: number) {
  return useQuery({
    queryKey: ["/api/github/repos", id],
    queryFn: () => api.github.getRepoDetails(id),
    enabled: !!id,
  });
}
