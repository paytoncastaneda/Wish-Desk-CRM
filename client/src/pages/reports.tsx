import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReportTemplates from "@/components/reports/report-templates";

export default function Reports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports } = useQuery({
    queryKey: ["/api/reports"],
  });

  const createReportMutation = useMutation({
    mutationFn: async (type: string) => {
      await apiRequest("POST", "/api/reports", {
        title: `${type.replace('_', ' ')} Report - ${new Date().toLocaleDateString()}`,
        type,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({ title: "Report generation started" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reports & Analytics</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Generate insights and export data</p>
        </div>
        <Button className="bg-primary hover:bg-blue-700">
          <Plus className="mr-2" size={16} />
          New Report
        </Button>
      </div>

      {/* Report Templates */}
      <ReportTemplates onGenerateReport={(type) => createReportMutation.mutate(type)} />

      {/* Recent Reports */}
      <div className="bg-crm-surface rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-white">Recent Reports</h4>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {!reports || reports.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">No reports generated yet</p>
            </div>
          ) : (
            reports.slice(0, 5).map((report: any) => (
              <div key={report.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                        {report.title}
                      </h5>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        report.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : report.status === "processing"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {report.type.replace('_', ' ')} analysis with detailed metrics and insights
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {report.status === "completed" ? "Generated" : "Started"}: {" "}
                        {new Date(report.generatedAt || report.createdAt).toLocaleDateString()}
                      </span>
                      {report.pages && <span>Pages: {report.pages}</span>}
                      <span>Type: {report.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                    {report.status === "completed" && (
                      <Button size="sm" className="bg-primary hover:bg-blue-700">
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
