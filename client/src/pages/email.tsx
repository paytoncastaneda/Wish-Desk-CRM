import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Send, Eye, Clock } from "lucide-react";
import EmailTemplates from "@/components/email/email-templates";

export default function Email() {
  const { data: emailStats } = useQuery({
    queryKey: ["/api/email-stats"],
  });

  const { data: emails } = useQuery({
    queryKey: ["/api/emails"],
  });

  const statsCards = [
    {
      title: "Emails Sent Today",
      value: emailStats?.sentToday || 0,
      icon: Send,
      color: "bg-primary",
    },
    {
      title: "Open Rate",
      value: `${emailStats?.openRate || 0}%`,
      icon: Eye,
      color: "bg-crm-success",
    },
    {
      title: "Pending Queue",
      value: emailStats?.pending || 0,
      icon: Clock,
      color: "bg-crm-warning",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Email Center</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage notifications and communications</p>
        </div>
        <Button className="bg-primary hover:bg-blue-700">
          <Plus className="mr-2" size={16} />
          Compose Email
        </Button>
      </div>

      {/* Email Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((card) => {
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Email Templates */}
      <EmailTemplates />

      {/* Recent Emails */}
      <Card className="bg-crm-surface border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="font-medium text-gray-900 dark:text-white">Recent Emails</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!emails || emails.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">No emails sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {emails.slice(0, 5).map((email: any) => (
                <div key={email.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                          {email.subject}
                        </h5>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          email.status === "sent" || email.status === "delivered"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}>
                          {email.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Sent to: {email.recipient}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Sent: {new Date(email.sentAt || email.createdAt).toLocaleDateString()}</span>
                        {email.template && <span>Template: {email.template}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button size="sm" className="bg-primary hover:bg-blue-700">
                        Resend
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
