import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ChartLine, Github, Mail, BarChart3 } from "lucide-react";
import { TaskChart } from "@/components/charts/task-chart";
import { GitHubChart } from "@/components/charts/github-chart";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const StatCard = ({ title, value, icon: Icon, change, color }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-semibold text-gray-900">{value || 0}</p>
          </div>
          <div className={`w-12 h-12 ${color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
            <Icon className={`${color.replace('bg-', 'text-')} w-6 h-6`} />
          </div>
        </div>
        {change && (
          <div className="mt-4 flex items-center">
            <span className="text-success text-sm font-medium">{change}</span>
            <span className="text-gray-500 text-sm ml-2">from last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Tasks"
          value={stats?.activeTasks}
          icon={ChartLine}
          change="+12%"
          color="bg-primary"
        />
        <StatCard
          title="GitHub Repos"
          value={stats?.githubRepos}
          icon={Github}
          change="+2 new this month"
          color="bg-success"
        />
        <StatCard
          title="Emails Sent"
          value={stats?.emailsSent}
          icon={Mail}
          change="+8%"
          color="bg-warning"
        />
        <StatCard
          title="Reports Generated"
          value={stats?.reportsGenerated}
          icon={BarChart3}
          change="+3 this week"
          color="bg-purple-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Trends</h3>
            <div className="h-64">
              <TaskChart />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">GitHub Activity</h3>
            <div className="h-64">
              <GitHubChart />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <ChartLine className="text-white w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New task completed: API documentation update</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
              <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                <Github className="text-white w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">GitHub repository synchronized</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
              <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center">
                <Mail className="text-white w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Email notification sent to team</p>
                <p className="text-xs text-gray-500">6 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
