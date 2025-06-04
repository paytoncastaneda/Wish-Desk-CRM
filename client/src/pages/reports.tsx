import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChartLine, Github, Mail, Users, Database, Eye, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Report } from "@shared/schema";

export default function Reports() {
  const { toast } = useToast();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      return apiRequest("POST", "/api/reports", reportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Report Generation Started",
        description: "Your report is being generated. You'll be notified when it's ready.",
      });
    },
  });

  const downloadReportMutation = useMutation({
    mutationFn: async ({ id, format }: { id: number; format: string }) => {
      const response = await fetch(`/api/reports/${id}/download?format=${format}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report-${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: "Your report download has started.",
      });
    },
  });

  const reportTemplates = [
    {
      id: 'task-performance',
      title: 'Task Performance Report',
      description: 'Comprehensive analysis of task completion rates, team productivity, and bottlenecks',
      icon: ChartLine,
      color: 'bg-primary',
      usage: 15,
      avgTime: '2 min',
      badge: 'Popular'
    },
    {
      id: 'github-activity',
      title: 'GitHub Activity Report',
      description: 'Repository insights, commit history, and development activity across your GitHub account',
      icon: Github,
      color: 'bg-success',
      usage: 8,
      avgTime: '3 min',
      badge: 'New'
    },
    {
      id: 'email-campaign',
      title: 'Email Campaign Report',
      description: 'Email delivery statistics, open rates, and engagement metrics for your campaigns',
      icon: Mail,
      color: 'bg-warning',
      usage: 12,
      avgTime: '1 min',
      badge: null
    },
    {
      id: 'team-productivity',
      title: 'Team Productivity Report',
      description: 'Individual and team performance metrics with workload distribution analysis',
      icon: Users,
      color: 'bg-purple-500',
      usage: 6,
      avgTime: '4 min',
      badge: null
    },
    {
      id: 'system-usage',
      title: 'System Usage Report',
      description: 'CRM usage statistics, feature adoption, and system performance metrics',
      icon: Database,
      color: 'bg-blue-500',
      usage: 4,
      avgTime: '2 min',
      badge: null
    }
  ];

  const handleGenerateReport = (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId);
    if (template) {
      generateReportMutation.mutate({
        title: template.title,
        type: templateId,
        description: template.description,
        config: { templateId }
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success bg-opacity-10 text-success';
      case 'processing':
        return 'bg-warning bg-opacity-10 text-warning';
      case 'failed':
        return 'bg-error bg-opacity-10 text-error';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Reports & Analytics</h3>
          <p className="text-sm text-gray-500">Generate insights and export data</p>
        </div>
        <Button className="bg-primary hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <Card
              key={template.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleGenerateReport(template.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${template.color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                    <Icon className={`${template.color.replace('bg-', 'text-')} w-6 h-6`} />
                  </div>
                  {template.badge && (
                    <Badge className={template.badge === 'Popular' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-success bg-opacity-10 text-success'}>
                      {template.badge}
                    </Badge>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 mb-2">{template.title}</h4>
                <p className="text-sm text-gray-500 mb-4">{template.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Generated {template.usage} times</span>
                  <span>Avg. time: {template.avgTime}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Custom Report Builder */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Plus className="text-gray-400 w-6 h-6" />
              </div>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Custom Report Builder</h4>
            <p className="text-sm text-gray-500 mb-4">Create personalized reports with custom metrics, filters, and visualizations</p>
            <div className="text-center">
              <span className="text-xs text-primary font-medium">Build Custom Report</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Recent Reports</h4>
            <Button variant="ghost" className="text-primary hover:text-blue-700">
              View All
            </Button>
          </div>
          
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No reports generated yet. Create your first report using the templates above.</p>
              </div>
            ) : (
              reports.slice(0, 5).map((report: Report) => (
                <div
                  key={report.id}
                  className="flex items-start justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="text-sm font-medium text-gray-900">{report.title}</h5>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{report.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        {report.status === 'completed' && report.generatedAt
                          ? `Generated: ${new Date(report.generatedAt).toLocaleDateString()}`
                          : `Created: ${new Date(report.createdAt).toLocaleDateString()}`
                        }
                      </span>
                      <span>Type: {report.type}</span>
                      {report.status === 'processing' && <span>Progress: Processing...</span>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {report.status === 'completed' ? (
                      <>
                        <Button variant="outline" size="sm">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => downloadReportMutation.mutate({ id: report.id, format: 'pdf' })}
                          className="bg-primary hover:bg-blue-700"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </>
                    ) : report.status === 'processing' ? (
                      <Button variant="outline" size="sm" disabled>
                        Processing...
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    )}
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
