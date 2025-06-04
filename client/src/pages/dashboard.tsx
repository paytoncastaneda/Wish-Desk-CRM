import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskChart } from "@/components/charts/task-chart";
import { GitHubChart } from "@/components/charts/github-chart";
import { api } from "@/lib/api";
import { 
  CheckSquare, 
  Github, 
  Mail, 
  FileBarChart,
  Clock,
  GitCommit,
  Users
} from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: api.dashboard.getStats,
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
    queryFn: api.dashboard.getRecentActivity,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task":
        return <CheckSquare className="h-4 w-4 text-white" />;
      case "github":
        return <Github className="h-4 w-4 text-white" />;
      case "email":
        return <Mail className="h-4 w-4 text-white" />;
      default:
        return <Clock className="h-4 w-4 text-white" />;
    }
  };

  const getActivityIconBg = (type: string) => {
    switch (type) {
      case "task":
        return "bg-primary";
      case "github":
        return "bg-green-500";
      case "email":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full custom-scrollbar">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                <p className="text-3xl font-semibold text-foreground">
                  {stats?.activeTasks || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-green-600 text-sm font-medium">+12%</span>
              <span className="text-muted-foreground text-sm ml-2">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">GitHub Repos</p>
                <p className="text-3xl font-semibold text-foreground">
                  {stats?.githubRepos || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <Github className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-green-600 text-sm font-medium">+2</span>
              <span className="text-muted-foreground text-sm ml-2">new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails Sent</p>
                <p className="text-3xl font-semibold text-foreground">
                  {stats?.emailsSent || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-green-600 text-sm font-medium">+8%</span>
              <span className="text-muted-foreground text-sm ml-2">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reports Generated</p>
                <p className="text-3xl font-semibold text-foreground">
                  {stats?.reportsGenerated || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <FileBarChart className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-green-600 text-sm font-medium">+3</span>
              <span className="text-muted-foreground text-sm ml-2">this week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Task Completion Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskChart />
          </CardContent>
        </Card>

        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              GitHub Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GitHubChart />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-center space-x-4 py-3 border-b border-border last:border-b-0">
                  <div className={`w-8 h-8 ${getActivityIconBg(activity.type)} rounded-full flex items-center justify-center`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown time'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent activity found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
