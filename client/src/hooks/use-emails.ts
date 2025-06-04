import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useEmails() {
  return useQuery({
    queryKey: ["/api/emails"],
    queryFn: api.emails.getAll,
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ["/api/emails/templates"],
    queryFn: api.emails.getTemplates,
  });
}

export function useEmailStats() {
  return useQuery({
    queryKey: ["/api/emails/stats"],
    queryFn: api.emails.getStats,
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.emails.send,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Email Sent",
        description: "Email has been sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Failed to send email",
        variant: "destructive",
      });
    },
  });
}
