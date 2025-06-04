import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Book, FileText, HelpCircle, Eye, Edit, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Documentation } from "@shared/schema";

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: docs = [], isLoading: docsLoading } = useQuery({
    queryKey: ["/api/documentation"],
  });

  const { data: categories = {}, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/documentation/categories"],
  });

  const createDocMutation = useMutation({
    mutationFn: async (docData: any) => {
      return apiRequest("POST", "/api/documentation", docData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documentation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documentation/categories"] });
      toast({
        title: "Document Created",
        description: "Documentation has been created successfully.",
      });
    },
  });

  const docCategories = [
    {
      key: 'setup-guides',
      title: 'Setup Guides',
      description: 'Installation and configuration documentation',
      icon: Settings,
      color: 'bg-primary'
    },
    {
      key: 'api-documentation',
      title: 'API Documentation',
      description: 'Endpoints, authentication, and integration guides',
      icon: Book,
      color: 'bg-success'
    },
    {
      key: 'process-guides',
      title: 'Process Guides',
      description: 'Step-by-step workflow documentation',
      icon: FileText,
      color: 'bg-warning'
    },
    {
      key: 'troubleshooting',
      title: 'Troubleshooting',
      description: 'Common issues and resolution steps',
      icon: HelpCircle,
      color: 'bg-purple-500'
    }
  ];

  const filteredDocs = docs.filter((doc: Documentation) => {
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !doc.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-success bg-opacity-10 text-success';
      case 'draft':
        return 'bg-warning bg-opacity-10 text-warning';
      case 'archived':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryConfig = docCategories.find(cat => cat.key === category);
    return categoryConfig?.icon || FileText;
  };

  const getCategoryColor = (category: string) => {
    const categoryConfig = docCategories.find(cat => cat.key === category);
    return categoryConfig?.color || 'bg-gray-500';
  };

  if (docsLoading || categoriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
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
          <h3 className="text-xl font-semibold text-gray-900">Documentation</h3>
          <p className="text-sm text-gray-500">Process documentation and implementation guides</p>
        </div>
        <Button className="bg-primary hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Documentation Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {docCategories.map((category) => {
          const Icon = category.icon;
          const count = categories[category.key] || 0;
          
          return (
            <Card
              key={category.key}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="pt-6">
                <div className={`w-12 h-12 ${category.color} bg-opacity-10 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`${category.color.replace('bg-', 'text-')} w-6 h-6`} />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">{category.title}</h4>
                <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                <span className="text-xs text-gray-400">{count} documents</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Documents */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-medium text-gray-900">Recent Documents</h4>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="ghost" className="text-primary hover:text-blue-700">
                View All
              </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No documentation found</p>
                <p className="text-sm text-gray-400">
                  {searchQuery ? "Try adjusting your search terms" : "Start by creating your first document"}
                </p>
              </div>
            ) : (
              filteredDocs.map((doc: Documentation) => {
                const CategoryIcon = getCategoryIcon(doc.category);
                const categoryColor = getCategoryColor(doc.category);
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between p-6 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 ${categoryColor} bg-opacity-10 rounded-lg flex items-center justify-center mt-1`}>
                        <CategoryIcon className={`${categoryColor.replace('bg-', 'text-')} w-5 h-5`} />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900 mb-1">{doc.title}</h5>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{doc.content.substring(0, 200)}...</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <CategoryIcon className="w-3 h-3 mr-1" />
                            {docCategories.find(cat => cat.key === doc.category)?.title || doc.category}
                          </span>
                          <span>Updated: {new Date(doc.updatedAt).toLocaleDateString()}</span>
                          <span>Author: {doc.author}</span>
                          <Badge className={getStatusColor(doc.status)}>
                            {doc.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" className="bg-primary hover:bg-blue-700">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
