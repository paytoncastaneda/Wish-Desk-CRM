import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, User } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Task } from "@shared/schema";

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
}

const priorityColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const statusColors = {
  todo: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default function TaskList({ tasks, isLoading }: TaskListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Task> }) => {
      await apiRequest("PUT", `/api/tasks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Task deleted successfully" });
    },
  });

  const handleToggleComplete = (task: Task) => {
    const newStatus = task.status === "completed" ? "todo" : "completed";
    updateTaskMutation.mutate({ id: task.id, updates: { status: newStatus } });
  };

  const handleDeleteTask = (id: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-crm-surface border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-crm-surface border border-gray-200 dark:border-gray-700">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="font-medium text-gray-900 dark:text-white">Active Tasks</CardTitle>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {tasks.length} tasks
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {tasks.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task) => (
              <div key={task.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={task.status === "completed"}
                    onCheckedChange={() => handleToggleComplete(task)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className={`text-sm font-medium truncate ${
                        task.status === "completed" 
                          ? "line-through text-gray-500 dark:text-gray-400" 
                          : "text-gray-900 dark:text-white"
                      }`}>
                        {task.title}
                      </h5>
                      <div className="flex items-center space-x-2 ml-2">
                        <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                          {task.priority} Priority
                        </Badge>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      {task.dueDate && (
                        <span className="flex items-center">
                          <Calendar className="mr-1" size={12} />
                          Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
                        </span>
                      )}
                      {task.assignedTo && (
                        <span className="flex items-center">
                          <User className="mr-1" size={12} />
                          Assigned to: {task.assignedTo}
                        </span>
                      )}
                      <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                        {task.status === "progress" ? "In Progress" : 
                         task.status === "todo" ? "To Do" : "Completed"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
