import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EmailTemplates() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/email-templates"],
  });

  if (isLoading) {
    return (
      <Card className="bg-crm-surface border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="font-medium text-gray-900 dark:text-white">Email Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
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
        <CardTitle className="font-medium text-gray-900 dark:text-white">Email Templates</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template: any) => (
            <div 
              key={template.id} 
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900 dark:text-white">{template.name}</h5>
                <Badge className={
                  template.type === "system" 
                    ? "bg-primary bg-opacity-10 text-primary" 
                    : "bg-crm-warning bg-opacity-10 text-crm-warning"
                }>
                  {template.type}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {template.subject}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Used {template.usageCount || 0} times</span>
                <span>
                  {template.updatedAt 
                    ? `Updated ${new Date(template.updatedAt).toLocaleDateString()}`
                    : "Recently created"
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
