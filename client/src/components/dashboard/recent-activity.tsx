import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Github, Mail, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Activity } from "@shared/schema";

interface RecentActivityProps {
  activities: Activity[];
}

const iconMap = {
  "task_completed": Check,
  "task_created": Check,
  "github_sync": Github,
  "email_sent": Mail,
  "report_generated": FileText,
};

const colorMap = {
  "task_completed": "bg-primary",
  "task_created": "bg-primary",
  "github_sync": "bg-crm-success",
  "email_sent": "bg-crm-warning",
  "report_generated": "bg-purple-500",
};

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="bg-crm-surface border border-gray-200 dark:border-gray-700">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {activities.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No recent activity to display
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = iconMap[activity.type as keyof typeof iconMap] || Check;
              const bgColor = colorMap[activity.type as keyof typeof colorMap] || "bg-gray-500";
              
              return (
                <div key={activity.id} className="flex items-center space-x-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                  <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center`}>
                    <Icon className="text-white" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.createdAt && formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
