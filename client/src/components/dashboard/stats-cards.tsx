import { CheckSquare, Github, Mail, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  stats?: {
    activeTasks: number;
    githubRepos: number;
    emailsSent: number;
    reportsGenerated: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Active Tasks",
      value: stats?.activeTasks || 0,
      icon: CheckSquare,
      color: "bg-primary",
      change: "+12%",
      changeLabel: "from last week",
    },
    {
      title: "GitHub Repos",
      value: stats?.githubRepos || 0,
      icon: Github,
      color: "bg-crm-success",
      change: "+2",
      changeLabel: "new this month",
    },
    {
      title: "Emails Sent",
      value: stats?.emailsSent || 0,
      icon: Mail,
      color: "bg-crm-warning",
      change: "+8%",
      changeLabel: "from last week",
    },
    {
      title: "Reports Generated",
      value: stats?.reportsGenerated || 0,
      icon: FileText,
      color: "bg-purple-500",
      change: "+3",
      changeLabel: "this week",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="bg-crm-surface border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                  <Icon className={`text-xl ${card.color.replace('bg-', 'text-')}`} size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-crm-success text-sm font-medium">{card.change}</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">{card.changeLabel}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
