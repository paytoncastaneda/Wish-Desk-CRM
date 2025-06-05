import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Calendar, User, Filter, Save, Download, Upload, Eye, Settings, ChevronDown, RefreshCw, ChevronUp, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { SwcrmTask, InsertSwcrmTask, TaskView, InsertTaskView, User as UserType, SwUser, SwCompany, Opportunity } from "@shared/schema";

interface TaskFilters {
  status?: string;
  priority?: number;
  category?: string;
  taskOwner?: number;
  assignToSidekick?: number;
  linkedSwCompanyId?: number;
  linkedSwCrmOpportunityId?: number;
  dateRange?: { start?: Date; end?: Date };
}

export default function Tasks() {
  const [activeView, setActiveView] = useState<TaskView | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [editingTask, setEditingTask] = useState<SwcrmTask | null>(null);
  const [editingView, setEditingView] = useState<TaskView | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { toast } = useToast();

  // Column configuration - optimized for requested layout
  const [visibleColumns, setVisibleColumns] = useState({
    dateDue: true,
    priority: true,
    category: true,
    taskName: true,
    linkedItems: true, // Combined linked contacts/companies/opportunities
  });

  // Current user info for role-based features will be fetched with useQuery

  // Default task views
  const defaultViews = [
    { 
      id: 'my-open-tasks', 
      name: 'My Open Tasks', 
      filters: { status: 'Not Started', taskOwner: 1 } 
    },
    { 
      id: 'my-tasks', 
      name: 'My Tasks', 
      filters: { taskOwner: 1 } 
    },
    { 
      id: 'my-overdue-tasks', 
      name: 'My Overdue Tasks', 
      filters: { status: 'Not Started', taskOwner: 1, overdue: true } 
    },
    { 
      id: 'all-open-tasks', 
      name: 'All Open Tasks', 
      filters: { status: 'Not Started' } 
    },
    { 
      id: 'high-priority', 
      name: 'High Priority Tasks', 
      filters: { priority: 3 } 
    },
  ];

  // Load saved view preference from localStorage
  useEffect(() => {
    const savedViewId = localStorage.getItem('lastTaskView');
    if (savedViewId) {
      const defaultView = defaultViews.find(v => v.id === savedViewId);
      if (defaultView) {
        setActiveView({ 
          id: defaultView.id as any, 
          name: defaultView.name, 
          filterConfig: defaultView.filters 
        } as TaskView);
        setFilters(defaultView.filters);
      }
    } else {
      // Default to "My Open Tasks"
      const defaultView = defaultViews[0];
      setActiveView({ 
        id: defaultView.id as any, 
        name: defaultView.name, 
        filterConfig: defaultView.filters 
      } as TaskView);
      setFilters(defaultView.filters);
    }
  }, []);

  // Fetch data
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<SwcrmTask[]>({
    queryKey: ["/api/swcrm-tasks", filters],
  });

  const { data: taskViews = [] } = useQuery<TaskView[]>({
    queryKey: ["/api/task-views"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: currentUser } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  const { data: swUsers = [] } = useQuery<SwUser[]>({
    queryKey: ["/api/sw-users"],
  });

  const { data: swCompanies = [] } = useQuery<SwCompany[]>({
    queryKey: ["/api/sw-companies"],
  });

  const { data: opportunities = [] } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (task: InsertSwcrmTask) => apiRequest("/api/swcrm-tasks", "POST", task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swcrm-tasks"] });
      setShowTaskForm(false);
      setEditingTask(null);
      toast({ title: "Task created successfully" });
    },
    onError: (error: any) => {
      console.error("Task creation error:", error);
      toast({ 
        title: "Failed to create task", 
        description: error?.message || "An unexpected error occurred",
        variant: "destructive"
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: number } & Partial<InsertSwcrmTask>) =>
      apiRequest(`/api/swcrm-tasks/${id}`, "PUT", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swcrm-tasks"] });
      setShowTaskForm(false);
      setEditingTask(null);
      toast({ title: "Task updated successfully" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/swcrm-tasks/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swcrm-tasks"] });
      toast({ title: "Task deleted successfully" });
    },
  });

  const createViewMutation = useMutation({
    mutationFn: (view: InsertTaskView) => apiRequest("/api/task-views", "POST", view),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-views"] });
      setShowViewForm(false);
      setEditingView(null);
      toast({ title: "View saved successfully" });
    },
  });

  const duplicateTaskMutation = useMutation({
    mutationFn: (taskId: number) => apiRequest(`/api/swcrm-tasks/${taskId}/duplicate`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swcrm-tasks"] });
      toast({ title: "Recurring task created successfully" });
    },
  });

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply active view filters
    if (activeView?.filterConfig) {
      const viewFilters = activeView.filterConfig as TaskFilters;
      filtered = filtered.filter(task => {
        if (viewFilters.status && task.status !== viewFilters.status) return false;
        if (viewFilters.priority && task.priority !== viewFilters.priority) return false;
        if (viewFilters.category && task.category !== viewFilters.category) return false;
        if (viewFilters.taskOwner && task.taskOwner !== viewFilters.taskOwner) return false;
        return true;
      });
    }

    // Apply current filters
    filtered = filtered.filter(task => {
      if (filters.status && task.status !== filters.status) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.category && task.category !== filters.category) return false;
      if (filters.taskOwner && task.taskOwner !== filters.taskOwner) return false;
      if (filters.assignToSidekick && task.assignToSidekick !== filters.assignToSidekick) return false;
      if (filters.linkedSwCompanyId && task.linkedSwCompanyId !== filters.linkedSwCompanyId) return false;
      if (filters.linkedSwCrmOpportunityId && task.linkedSwCrmOpportunityId !== filters.linkedSwCrmOpportunityId) return false;
      return true;
    });

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.taskName.toLowerCase().includes(query) ||
        task.taskDetails?.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tasks, filters, searchQuery, activeView]);

  const handleCompleteTask = async (task: SwcrmTask) => {
    await updateTaskMutation.mutateAsync({
      id: task.taskId,
      status: "Complete"
    });

    // If task is recurring, create next occurrence
    if (task.isRecurring) {
      await duplicateTaskMutation.mutateAsync(task.taskId);
    }
  };

  const handleBulkExport = () => {
    const csvContent = [
      // Header
      Object.keys(visibleColumns).filter(col => visibleColumns[col as keyof typeof visibleColumns]).join(','),
      // Data
      ...filteredTasks.map(task => 
        Object.keys(visibleColumns)
          .filter(col => visibleColumns[col as keyof typeof visibleColumns])
          .map(col => {
            const value = task[col as keyof SwcrmTask];
            return typeof value === 'string' ? `"${value}"` : value || '';
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "text-green-600";
      case 2: return "text-yellow-600";
      case 3: return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "Low";
      case 2: return "Medium";
      case 3: return "High";
      default: return "Low";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Complete": return "text-green-600 bg-green-50";
      case "Not Started": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  // Handle view selection and save preference
  const handleViewChange = (viewId: string) => {
    const selectedView = defaultViews.find(v => v.id === viewId);
    if (selectedView) {
      setActiveView({ 
        id: selectedView.id as any, 
        name: selectedView.name, 
        filterConfig: selectedView.filters 
      } as TaskView);
      setFilters(selectedView.filters);
      localStorage.setItem('lastTaskView', viewId);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#f9f9fb] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-3xl font-lato font-bold text-[#2d3333] mb-2">
              Task Management
            </h1>
            <p className="text-[#737373] font-lato">
              Comprehensive task tracking with advanced filtering and collaborative features
            </p>
          </div>
          
          {/* Task Views Dropdown */}
          <div className="flex items-center gap-2">
            <Label className="text-[#2d3333] font-lato text-sm font-medium">View:</Label>
            <Select value={activeView?.id || defaultViews[0].id} onValueChange={handleViewChange}>
              <SelectTrigger className="w-48 border-[#cccccc] focus:border-[#55c5ce] font-lato">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                {/* Default Views */}
                {defaultViews.map((view) => (
                  <SelectItem key={view.id} value={view.id} className="font-lato">
                    {view.name}
                  </SelectItem>
                ))}
                
                {/* Custom Views */}
                {taskViews && taskViews.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-[#737373] border-t border-[#e5e7eb] mt-1">
                      Custom Views
                    </div>
                    {taskViews.map((view) => (
                      <SelectItem key={`custom-${view.id}`} value={`custom-${view.id}`} className="font-lato">
                        <div className="flex items-center justify-between w-full">
                          <span>{view.name}</span>
                          {view.isGlobal && (
                            <span className="ml-2 text-xs text-[#55c5ce]">Global</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                
                {/* Add New View Option */}
                <div className="border-t border-[#e5e7eb] mt-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowViewForm(true);
                    }}
                    className="w-full px-2 py-2 text-left text-sm font-lato text-[#55c5ce] hover:bg-[#f3fbfc] flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Task View
                  </button>
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowTaskForm(true)}
            className="bg-[#d2232a] hover:bg-[#a61c25] text-white font-lato font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
          

          
          <Button
            onClick={() => setShowColumnConfig(true)}
            variant="outline"
            className="border-[#55c5ce] text-[#277e88] hover:bg-[#f3fbfc] font-lato"
          >
            <Settings className="w-4 h-4 mr-2" />
            Columns
          </Button>
        </div>
      </div>

      {/* Collapsible Filters */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <Card className="border-[#cccccc] shadow-sm">
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <CardTitle className="text-lg font-lato text-[#2d3333] flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-[#55c5ce]" />
                  Filters
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-[#277e88] hover:bg-[#f3fbfc] font-lato">
                  {isFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-[#2d3333] font-lato">Search</Label>
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-[#cccccc] focus:border-[#55c5ce]"
                  />
                </div>
                
                <div>
                  <Label className="text-[#2d3333] font-lato">Status</Label>
                  <Select value={filters.status || "all"} onValueChange={(value) => setFilters({...filters, status: value === "all" ? undefined : value})}>
                    <SelectTrigger className="border-[#cccccc] focus:border-[#55c5ce]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-[#2d3333] font-lato">Priority</Label>
                  <Select value={filters.priority?.toString() || "all"} onValueChange={(value) => setFilters({...filters, priority: value === "all" ? undefined : parseInt(value)})}>
                    <SelectTrigger className="border-[#cccccc] focus:border-[#55c5ce]">
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      <SelectItem value="1">Low</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-[#2d3333] font-lato">Assigned To</Label>
                  <Select value={filters.taskOwner?.toString() || "all"} onValueChange={(value) => setFilters({...filters, taskOwner: value === "all" ? undefined : parseInt(value)})}>
                    <SelectTrigger className="border-[#cccccc] focus:border-[#55c5ce]">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters({});
                    setSearchQuery("");
                  }}
                  className="border-[#cccccc] text-[#277e88] hover:bg-[#f3fbfc] font-lato"
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Tasks Table */}
      <Card className="border-[#cccccc] shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-montserrat text-[#2d3333]">
              Tasks ({filteredTasks.length})
            </CardTitle>
            {selectedTasks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#737373]">
                  {selectedTasks.length} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    selectedTasks.forEach(id => deleteTaskMutation.mutate(id));
                    setSelectedTasks([]);
                  }}
                  className="border-[#d2232a] text-[#d2232a] hover:bg-[#fef6f6]"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-[#55c5ce]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#ebebeb]">
                    <th className="text-left p-3">
                      <Checkbox
                        checked={selectedTasks.length === filteredTasks.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTasks(filteredTasks.map(t => t.taskId));
                          } else {
                            setSelectedTasks([]);
                          }
                        }}
                      />
                    </th>
                    {visibleColumns.taskName && <th className="text-left p-3 font-montserrat text-[#2d3333]">Task Name</th>}
                    {visibleColumns.category && <th className="text-left p-3 font-montserrat text-[#2d3333]">Category</th>}
                    {visibleColumns.priority && <th className="text-left p-3 font-montserrat text-[#2d3333]">Priority</th>}
                    {visibleColumns.status && <th className="text-left p-3 font-montserrat text-[#2d3333]">Status</th>}
                    {visibleColumns.taskOwner && <th className="text-left p-3 font-montserrat text-[#2d3333]">Assigned To</th>}
                    {visibleColumns.dateDue && <th className="text-left p-3 font-montserrat text-[#2d3333]">Due Date</th>}
                    {visibleColumns.linkedSwCompanyId && <th className="text-left p-3 font-montserrat text-[#2d3333]">Company</th>}
                    {visibleColumns.linkedSwCrmOpportunityId && <th className="text-left p-3 font-montserrat text-[#2d3333]">Opportunity</th>}
                    <th className="text-left p-3 font-montserrat text-[#2d3333]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.taskId} className="border-b border-[#f5f5f5] hover:bg-[#f9f9fb]">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedTasks.includes(task.taskId)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTasks([...selectedTasks, task.taskId]);
                            } else {
                              setSelectedTasks(selectedTasks.filter(id => id !== task.taskId));
                            }
                          }}
                        />
                      </td>
                      {visibleColumns.taskName && (
                        <td className="p-3">
                          <div className="font-lato text-[#2d3333] font-medium">{task.taskName}</div>
                          {task.taskDetails && (
                            <div className="text-sm text-[#737373] mt-1 truncate max-w-xs">
                              {task.taskDetails}
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.category && (
                        <td className="p-3">
                          <Badge variant="outline" className="border-[#55c5ce] text-[#277e88]">
                            {task.category}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.priority && (
                        <td className="p-3">
                          <span className={`font-lato font-medium ${getPriorityColor(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="p-3">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.taskOwner && (
                        <td className="p-3">
                          <div className="font-lato text-[#2d3333]">
                            {users.find(u => u.id === task.taskOwner)?.firstName} {users.find(u => u.id === task.taskOwner)?.lastName}
                          </div>
                        </td>
                      )}
                      {visibleColumns.dateDue && (
                        <td className="p-3">
                          {task.dateDue && (
                            <div className="font-lato text-[#2d3333]">
                              {format(new Date(task.dateDue), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.linkedSwCompanyId && (
                        <td className="p-3">
                          {task.linkedSwCompanyId && (
                            <div className="font-lato text-[#2d3333]">
                              {swCompanies.find(c => c.id === task.linkedSwCompanyId)?.name}
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.linkedSwCrmOpportunityId && (
                        <td className="p-3">
                          {task.linkedSwCrmOpportunityId && (
                            <div className="font-lato text-[#2d3333]">
                              {opportunities.find(o => o.id === task.linkedSwCrmOpportunityId)?.name}
                            </div>
                          )}
                        </td>
                      )}
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              setEditingTask(task);
                              setShowTaskForm(true);
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {task.status === "Not Started" && (
                              <DropdownMenuItem onClick={() => handleCompleteTask(task)}>
                                <Calendar className="w-4 h-4 mr-2" />
                                Mark Complete
                              </DropdownMenuItem>
                            )}
                            {task.isRecurring && (
                              <DropdownMenuItem onClick={() => duplicateTaskMutation.mutate(task.taskId)}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Create Next
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => deleteTaskMutation.mutate(task.taskId)}
                              className="text-[#d2232a]"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredTasks.length === 0 && (
                <div className="text-center py-8 text-[#737373] font-lato">
                  No tasks found matching your criteria
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={showTaskForm}
        onOpenChange={setShowTaskForm}
        task={editingTask}
        users={users}
        swUsers={swUsers}
        swCompanies={swCompanies}
        opportunities={opportunities}
        onSubmit={(data) => {
          try {
            if (editingTask) {
              updateTaskMutation.mutate({ id: editingTask.taskId, ...data });
            } else {
              createTaskMutation.mutate(data);
            }
          } catch (error) {
            console.error("Task submission error:", error);
            toast({ 
              title: "Failed to submit task", 
              description: "An unexpected error occurred while submitting the task",
              variant: "destructive"
            });
          }
        }}
      />

      {/* View Form Dialog */}
      <ViewFormDialog
        open={showViewForm}
        onOpenChange={setShowViewForm}
        view={editingView}
        currentFilters={filters}
        currentColumns={visibleColumns}
        onSubmit={(data) => createViewMutation.mutate(data)}
      />

      {/* Column Configuration Dialog */}
      <ColumnConfigDialog
        open={showColumnConfig}
        onOpenChange={setShowColumnConfig}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
      />
    </div>
  );
}

// View Form Dialog Component
interface ViewFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: TaskView | null;
  currentFilters: any;
  currentColumns: any;
  onSubmit: (data: any) => void;
}

function ViewFormDialog({ open, onOpenChange, view, currentFilters, currentColumns, onSubmit }: ViewFormDialogProps) {
  const form = useForm({
    resolver: zodResolver(z.object({
      name: z.string().min(1, "View name is required"),
      description: z.string().optional(),
      isGlobal: z.boolean().default(false),
      filters: z.any().optional(),
      columns: z.any().optional()
    })),
    defaultValues: {
      name: view?.name || "",
      description: view?.description || "",
      isGlobal: view?.isGlobal || false,
      filters: view?.filters || currentFilters,
      columns: view?.columns || currentColumns
    }
  });

  const handleSubmit = (data: any) => {
    onSubmit({
      ...data,
      filters: currentFilters,
      columns: currentColumns
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-lato text-[#2d3333]">
            {view ? "Edit Task View" : "Create New Task View"}
          </DialogTitle>
          <DialogDescription className="font-lato text-[#737373]">
            Save your current filters and column settings as a custom view
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-lato text-[#2d3333]">View Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter view name"
                      className="border-[#cccccc] focus:border-[#55c5ce] font-lato"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-lato text-[#2d3333]">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Brief description of this view"
                      className="border-[#cccccc] focus:border-[#55c5ce] font-lato"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isGlobal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#cccccc] p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="font-lato text-[#2d3333] text-sm font-medium">
                      Global View
                    </FormLabel>
                    <FormDescription className="font-lato text-[#737373] text-xs">
                      Make this view available to all users
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-[#cccccc] text-[#737373] hover:bg-[#f5f5f5] font-lato"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#d2232a] hover:bg-[#a61c25] text-white font-lato"
              >
                {view ? "Update View" : "Create View"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Task Form Dialog Component
interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: SwcrmTask | null;
  users: UserType[];
  swUsers: SwUser[];
  swCompanies: SwCompany[];
  opportunities: Opportunity[];
  onSubmit: (data: InsertSwcrmTask) => void;
}

function TaskFormDialog({ open, onOpenChange, task, users, swUsers, swCompanies, opportunities, onSubmit }: TaskFormDialogProps) {
  // Get current user data
  const { data: currentUser } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  const [formData, setFormData] = useState<InsertSwcrmTask>({
    taskOwner: currentUser?.id || 1, // Default to current user
    taskCreatedBy: currentUser?.id || 1,
    taskName: "",
    category: "CALL",
    taskDetails: "",
    dateDue: null,
    expirationDate: null,
    priority: 2, // Default to Medium (2)
    status: "Not Started",
    linkedSwUserId: null,
    linkedSwCompanyId: null,
    linkedSwCrmProposalId: null,
    linkedSwCrmOpportunityId: null,
    linkedSwCrmNotesId: null,
    linkedSwCrmPromotionsId: null,
    assignToSidekick: null,
    isRecurring: false,
    recurrencePattern: null,
    recurrenceInterval: 1,
  });

  // Update defaults when current user data is available
  useEffect(() => {
    if (currentUser && !task) {
      setFormData(prev => ({
        ...prev,
        taskOwner: currentUser.id,
        taskCreatedBy: currentUser.id,
      }));
    }
  }, [currentUser, task]);

  // Initialize form data when editing a task
  useEffect(() => {
    if (task) {
      setFormData({
        taskOwner: task.taskOwner || currentUser?.id || 1,
        taskCreatedBy: task.taskCreatedBy || currentUser?.id || 1,
        taskName: task.taskName || "",
        category: task.category || "CALL",
        taskDetails: task.taskDetails || "",
        dateDue: task.dateDue,
        expirationDate: task.expirationDate,
        priority: task.priority || 2,
        status: task.status || "Not Started",
        linkedSwUserId: task.linkedSwUserId,
        linkedSwCompanyId: task.linkedSwCompanyId,
        linkedSwCrmProposalId: task.linkedSwCrmProposalId,
        linkedSwCrmOpportunityId: task.linkedSwCrmOpportunityId,
        linkedSwCrmNotesId: task.linkedSwCrmNotesId,
        linkedSwCrmPromotionsId: task.linkedSwCrmPromotionsId,
        assignToSidekick: task.assignToSidekick,
        isRecurring: task.isRecurring || false,
        recurrencePattern: task.recurrencePattern,
        recurrenceInterval: task.recurrenceInterval || 1,
      });
    }
  }, [task, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert "none" values to null for submission
    const submissionData = {
      ...formData,
      linkedSwCompanyId: formData.linkedSwCompanyId === "none" || formData.linkedSwCompanyId === null ? null : 
        typeof formData.linkedSwCompanyId === 'string' ? parseInt(formData.linkedSwCompanyId) : formData.linkedSwCompanyId,
      linkedSwUserId: formData.linkedSwUserId === "none" || formData.linkedSwUserId === null ? null : 
        typeof formData.linkedSwUserId === 'string' ? parseInt(formData.linkedSwUserId) : formData.linkedSwUserId,
      linkedSwCrmOpportunityId: formData.linkedSwCrmOpportunityId === "none" || formData.linkedSwCrmOpportunityId === null ? null : 
        typeof formData.linkedSwCrmOpportunityId === 'string' ? parseInt(formData.linkedSwCrmOpportunityId) : formData.linkedSwCrmOpportunityId,
    };
    
    onSubmit(submissionData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-montserrat text-[#2d3333]">
            {task ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <DialogDescription className="text-[#2d3333] font-lato">
            {task ? "Update task details and save changes." : "Fill in the task information and click save to create a new task."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#2d3333] font-lato">Task Name *</Label>
              <Input
                value={formData.taskName}
                onChange={(e) => setFormData({...formData, taskName: e.target.value})}
                className="border-[#cccccc] focus:border-[#55c5ce]"
                required
              />
            </div>
            
            <div>
              <Label className="text-[#2d3333] font-lato">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger className="border-[#cccccc] focus:border-[#55c5ce]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CALL">Call</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                  <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                  <SelectItem value="PROPOSAL">Proposal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-[#2d3333] font-lato">Priority</Label>
              <Select value={formData.priority?.toString() || "1"} onValueChange={(value) => setFormData({...formData, priority: parseInt(value)})}>
                <SelectTrigger className="border-[#cccccc] focus:border-[#55c5ce]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-[#2d3333] font-lato">Assigned To *</Label>
              <Select value={formData.taskOwner?.toString() || ""} onValueChange={(value) => setFormData({...formData, taskOwner: parseInt(value)})}>
                <SelectTrigger className="border-[#cccccc] focus:border-[#55c5ce]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-[#2d3333] font-lato">Due Date</Label>
              <Input
                type="datetime-local"
                value={formData.dateDue ? new Date(formData.dateDue).toISOString().slice(0, 16) : ""}
                onChange={(e) => setFormData({...formData, dateDue: e.target.value ? new Date(e.target.value) : null})}
                className="border-[#cccccc] focus:border-[#55c5ce]"
              />
            </div>
            
            {/* Expiration Date - Only visible to MOD/Admin users */}
            {currentUser?.role === 'admin' || currentUser?.role === 'mod' ? (
              <div>
                <Label className="text-[#2d3333] font-lato">Expiration Date (MOD Use)</Label>
                <Input
                  type="datetime-local"
                  value={formData.expirationDate ? new Date(formData.expirationDate).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setFormData({...formData, expirationDate: e.target.value ? new Date(e.target.value) : null})}
                  className="border-[#cccccc] focus:border-[#55c5ce]"
                />
              </div>
            ) : null}
            
            <div>
              <Label className="text-[#2d3333] font-lato">Linked Company</Label>
              <Select 
                value={formData.linkedSwCompanyId?.toString() || ""} 
                onValueChange={(value) => setFormData({...formData, linkedSwCompanyId: value ? parseInt(value) : null})}
              >
                <SelectTrigger className="border-[#cccccc] focus:border-[#55c5ce]">
                  <SelectValue placeholder="Search and select company..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Company</SelectItem>
                  {swCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name || 'Unknown Company'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-[#2d3333] font-lato">Linked Contact</Label>
              <Select 
                value={formData.linkedSwUserId?.toString() || ""} 
                onValueChange={(value) => setFormData({...formData, linkedSwUserId: value ? parseInt(value) : null})}
              >
                <SelectTrigger className="border-[#cccccc] focus:border-[#55c5ce]">
                  <SelectValue placeholder="Search and select contact..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Contact</SelectItem>
                  {swUsers.map((swUser) => (
                    <SelectItem key={swUser.id} value={swUser.id.toString()}>
                      {swUser.firstName} {swUser.lastName} - {swUser.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-[#2d3333] font-lato">Linked Opportunity</Label>
              <Select 
                value={formData.linkedSwCrmOpportunityId?.toString() || ""} 
                onValueChange={(value) => setFormData({...formData, linkedSwCrmOpportunityId: value ? parseInt(value) : null})}
              >
                <SelectTrigger className="border-[#cccccc] focus:border-[#55c5ce]">
                  <SelectValue placeholder="Select opportunity..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Opportunity</SelectItem>
                  {opportunities.map((opp) => (
                    <SelectItem key={opp.id} value={opp.id.toString()}>
                      {opp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label className="text-[#2d3333] font-lato">Task Details</Label>
            <Textarea
              value={formData.taskDetails || ""}
              onChange={(e) => setFormData({...formData, taskDetails: e.target.value})}
              className="border-[#cccccc] focus:border-[#55c5ce]"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[#2d3333] font-lato">Linked Company</Label>
              <Select value={formData.linkedSwCompanyId?.toString() || ""} onValueChange={(value) => setFormData({...formData, linkedSwCompanyId: value ? parseInt(value) : null})}>
                <SelectTrigger className="border-[#cccccc] focus:border-[#55c5ce]">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {swCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-[#2d3333] font-lato">Linked Opportunity</Label>
              <Select value={formData.linkedSwCrmOpportunityId?.toString() || ""} onValueChange={(value) => setFormData({...formData, linkedSwCrmOpportunityId: value ? parseInt(value) : null})}>
                <SelectTrigger className="border-[#cccccc] focus:border-[#55c5ce]">
                  <SelectValue placeholder="Select opportunity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {opportunities.map((opportunity) => (
                    <SelectItem key={opportunity.id} value={opportunity.id.toString()}>
                      {opportunity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({...formData, isRecurring: !!checked})}
              />
              <Label htmlFor="recurring" className="text-[#2d3333] font-lato">Recurring Task</Label>
            </div>
            
            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <Label className="text-[#2d3333] font-lato">Pattern</Label>
                  <Select value={formData.recurrencePattern || ""} onValueChange={(value) => setFormData({...formData, recurrencePattern: value})}>
                    <SelectTrigger className="border-[#cccccc] focus:border-[#55c5ce]">
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-[#2d3333] font-lato">Interval</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.recurrenceInterval}
                    onChange={(e) => setFormData({...formData, recurrenceInterval: parseInt(e.target.value) || 1})}
                    className="border-[#cccccc] focus:border-[#55c5ce]"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#cccccc] text-[#737373]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#d2232a] hover:bg-[#a61c25] text-white font-montserrat"
            >
              {task ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Column Configuration Dialog Component
interface ColumnConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleColumns: any;
  onColumnsChange: (columns: any) => void;
}

function ColumnConfigDialog({ open, onOpenChange, visibleColumns, onColumnsChange }: ColumnConfigDialogProps) {
  const columns = [
    { key: 'taskName', label: 'Task Name' },
    { key: 'category', label: 'Category' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'taskOwner', label: 'Assigned To' },
    { key: 'dateDue', label: 'Due Date' },
    { key: 'linkedSwCompanyId', label: 'Company' },
    { key: 'linkedSwCrmOpportunityId', label: 'Opportunity' },
    { key: 'assignToSidekick', label: 'Sidekick' },
    { key: 'createdAt', label: 'Created' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-montserrat text-[#2d3333]">Configure Columns</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {columns.map((column) => (
            <div key={column.key} className="flex items-center space-x-2">
              <Checkbox
                id={column.key}
                checked={visibleColumns[column.key]}
                onCheckedChange={(checked) => 
                  onColumnsChange({
                    ...visibleColumns,
                    [column.key]: !!checked
                  })
                }
              />
              <Label htmlFor={column.key} className="text-[#2d3333] font-lato">
                {column.label}
              </Label>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-[#d2232a] hover:bg-[#a61c25] text-white font-montserrat"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}