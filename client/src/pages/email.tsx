import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Eye, RefreshCw, Clock, Mail, MailOpen } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Email } from "@shared/schema";

export default function EmailCenter() {
  const { toast } = useToast();

  const { data: emails = [], isLoading: emailsLoading } = useQuery({
    queryKey: ["/api/emails"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/emails/stats"],
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      return apiRequest("POST", "/api/emails", emailData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails/stats"] });
      toast({
        title: "Email Sent",
        description: "Email has been sent successfully.",
      });
    },
  });

  const emailTemplates = [
    {
      id: 'task-assignment',
      name: 'Task Assignment',
      description: 'Notify team members when they are assigned new tasks',
      category: 'System',
      usage: 15,
      updated: '2 days ago'
    },
    {
      id: 'task-completion',
      name: 'Task Completion',
      description: 'Celebrate task completions and project milestones',
      category: 'System',
      usage: 28,
      updated: '1 week ago'
    },
    {
      id: 'weekly-report',
      name: 'Weekly Report',
      description: 'Weekly summary of team performance and metrics',
      category: 'Custom',
      usage: 8,
      updated: '3 days ago'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-success bg-opacity-10 text-success';
      case 'pending':
        return 'bg-warning bg-opacity-10 text-warning';
      case 'failed':
        return 'bg-error bg-opacity-10 text-error';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return Send;
      case 'pending':
        return Clock;
      case 'failed':
        return RefreshCw;
      default:
        return Mail;
    }
  };

  if (emailsLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Email Center</h3>
          <p className="text-sm text-gray-500">Manage notifications and communications</p>
        </div>
        <Button className="bg-primary hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Compose Email
        </Button>
      </div>

      {/* Email Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Emails Sent Today</p>
                <p className="text-3xl font-semibold text-gray-900">{stats?.sentToday || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                <Send className="text-primary w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Open Rate</p>
                <p className="text-3xl font-semibold text-gray-900">{stats?.openRate || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                <MailOpen className="text-success w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Queue</p>
                <p className="text-3xl font-semibold text-gray-900">{stats?.pending || 0}</p>
              </div>
              <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-lg flex items-center justify-center">
                <Clock className="text-warning w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Templates */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Email Templates</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emailTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">{template.name}</h5>
                  <Badge className={template.category === 'System' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-warning bg-opacity-10 text-warning'}>
                    {template.category}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Used {template.usage} times</span>
                  <span>Last updated: {template.updated}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Emails */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Recent Emails</h4>
          
          <div className="space-y-4">
            {emails.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No emails found. Start by composing your first email.</p>
              </div>
            ) : (
              emails.slice(0, 10).map((email: Email) => {
                const StatusIcon = getStatusIcon(email.status);
                return (
                  <div
                    key={email.id}
                    className="flex items-start justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 ${getStatusColor(email.status)} rounded-lg flex items-center justify-center`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h5 className="text-sm font-medium text-gray-900">{email.subject}</h5>
                          <Badge className={getStatusColor(email.status)}>
                            {email.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">Sent to: {email.to}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Sent: {email.sentAt ? new Date(email.sentAt).toLocaleDateString() : 'Not sent'}</span>
                          {email.openedAt && <span>Opened: {new Date(email.openedAt).toLocaleDateString()}</span>}
                          {email.template && <span>Template: {email.template}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" className="bg-primary hover:bg-blue-700">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Resend
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
