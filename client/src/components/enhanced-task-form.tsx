import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

const taskFormSchema = z.object({
  taskName: z.string().min(1, "Task name is required"),
  taskOwner: z.number().optional(),
  category: z.string().optional(),
  dateDue: z.string().optional(),
  expirationDate: z.string().optional(),
  priority: z.number().min(1).max(5).default(1),
  status: z.string().default("pending"),
  taskDetails: z.string().optional(),
  assignToSidekick: z.boolean().default(false),
  linkedSwUserId: z.number().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface EnhancedTaskFormProps {
  onSuccess?: () => void;
}

export function EnhancedTaskForm({ onSuccess }: EnhancedTaskFormProps) {
  const { toast } = useToast();

  // Fetch sales representatives
  const { data: salesReps = [] } = useQuery<User[]>({
    queryKey: ["/api/users/sales-reps"],
  });

  // Fetch all users for linking
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: TaskFormData) => {
      return apiRequest("POST", "/api/tasks", task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Task created successfully"
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    }
  });

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      taskName: "",
      category: "",
      priority: 1,
      status: "pending",
      taskDetails: "",
      assignToSidekick: false
    }
  });

  const onSubmit = async (data: TaskFormData) => {
    const submitData = {
      ...data,
      dateDue: data.dateDue ? new Date(data.dateDue) : null,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
    };
    
    await createTaskMutation.mutateAsync(submitData);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="taskName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter task name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="taskOwner"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned To (Sales Rep)</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                value={field.value?.toString() || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales representative" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {salesReps.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName} (${user.username})`
                        : user.username
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dateDue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expirationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiration Date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || "1"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1 - Low</SelectItem>
                  <SelectItem value="2">2 - Medium</SelectItem>
                  <SelectItem value="3">3 - High</SelectItem>
                  <SelectItem value="4">4 - Urgent</SelectItem>
                  <SelectItem value="5">5 - Critical</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="linkedSwUserId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link to User</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                value={field.value?.toString() || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional: Link to user" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName} (${user.username})`
                        : user.username
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="taskDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Details</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter detailed task description" 
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assignToSidekick"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Assign to Sidekick</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Automatically assign this task to AI assistant
                </p>
              </div>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={createTaskMutation.isPending}
        >
          {createTaskMutation.isPending ? "Creating..." : "Create Task"}
        </Button>
      </form>
    </Form>
  );
}