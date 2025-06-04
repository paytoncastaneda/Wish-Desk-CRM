import { BarChart3, Github, Mail, Users, Database, Plus } from "lucide-react";

interface ReportTemplatesProps {
  onGenerateReport: (type: string) => void;
}

const reportTemplates = [
  {
    id: "task_performance",
    title: "Task Performance Report",
    description: "Comprehensive analysis of task completion rates, team productivity, and bottlenecks",
    icon: BarChart3,
    color: "bg-primary",
    badge: "Popular",
    badgeColor: "bg-primary bg-opacity-10 text-primary",
    generated: 15,
    avgTime: "2 min",
  },
  {
    id: "github_activity",
    title: "GitHub Activity Report",
    description: "Repository insights, commit history, and development activity across your GitHub account",
    icon: Github,
    color: "bg-crm-success",
    badge: "New",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    generated: 8,
    avgTime: "3 min",
  },
  {
    id: "email_campaign",
    title: "Email Campaign Report",
    description: "Email delivery statistics, open rates, and engagement metrics for your campaigns",
    icon: Mail,
    color: "bg-crm-warning",
    badge: null,
    badgeColor: "",
    generated: 12,
    avgTime: "1 min",
  },
  {
    id: "team_productivity",
    title: "Team Productivity Report",
    description: "Individual and team performance metrics with workload distribution analysis",
    icon: Users,
    color: "bg-purple-500",
    badge: null,
    badgeColor: "",
    generated: 6,
    avgTime: "4 min",
  },
  {
    id: "system_usage",
    title: "System Usage Report",
    description: "CRM usage statistics, feature adoption, and system performance metrics",
    icon: Database,
    color: "bg-blue-500",
    badge: null,
    badgeColor: "",
    generated: 4,
    avgTime: "2 min",
  },
];

export default function ReportTemplates({ onGenerateReport }: ReportTemplatesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reportTemplates.map((template) => {
        const Icon = template.icon;
        return (
          <div
            key={template.id}
            onClick={() => onGenerateReport(template.id)}
            className="bg-crm-surface rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${template.color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                <Icon className={`text-xl ${template.color.replace('bg-', 'text-')}`} size={24} />
              </div>
              {template.badge && (
                <span className={`px-2 py-1 text-xs rounded-full ${template.badgeColor}`}>
                  {template.badge}
                </span>
              )}
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{template.title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{template.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Generated {template.generated} times</span>
              <span>Avg. time: {template.avgTime}</span>
            </div>
          </div>
        );
      })}

      {/* Custom Report Builder */}
      <div className="bg-crm-surface rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <Plus className="text-gray-400" size={24} />
          </div>
        </div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Custom Report Builder</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Create personalized reports with custom metrics, filters, and visualizations
        </p>
        <div className="text-center">
          <span className="text-xs text-primary font-medium">Build Custom Report</span>
        </div>
      </div>
    </div>
  );
}
