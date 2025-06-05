import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChartLine, 
  Mail, 
  DollarSign, 
  TrendingUp, 
  Building, 
  Target,
  ExternalLink,
  Eye,
  Filter
} from "lucide-react";
import { TaskChart } from "@/components/charts/task-chart";
import { useState } from "react";

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'mtd' | 'lastMonth' | 'twoMonthsAgo'>('mtd');
  const [showDrillDown, setShowDrillDown] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<'lifetime' | 'last12months' | 'last3months' | 'lastMonth' | 'mtd'>('lifetime');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["/api/gc/sales-performance"],
  });

  const { data: detailedSales } = useQuery({
    queryKey: ["/api/gc/sales-details", selectedPeriod],
    enabled: !!showDrillDown && (showDrillDown === 'mtd' || showDrillDown === 'lastMonth'),
  });

  const { data: taskBreakdown } = useQuery({
    queryKey: ["/api/tasks/breakdown"],
    enabled: !!showDrillDown && showDrillDown === 'activeTasks',
  });

  const { data: emailBreakdown } = useQuery({
    queryKey: ["/api/emails/breakdown"],
    enabled: !!showDrillDown && showDrillDown === 'emailsSent',
  });

  const { data: opportunitiesBreakdown } = useQuery({
    queryKey: ["/api/opportunities/breakdown"],
    enabled: !!showDrillDown && showDrillDown === 'opportunities',
  });

  const { data: teamData } = useQuery({
    queryKey: ["/api/gc/team-comparison"],
  });

  const { data: domainsData } = useQuery({
    queryKey: ["/api/gc/domains", domainFilter],
  });

  const { data: domainDetails } = useQuery({
    queryKey: ["/api/gc/domain-details", selectedDomain],
    enabled: !!selectedDomain,
  });

  const { data: opportunitiesData } = useQuery({
    queryKey: ["/api/gc/opportunities"],
  });

  interface DashboardStats {
    activeTasks: number;
    emailsSent: number;
    reportsGenerated: number;
    documentation: number;
  }

  interface SalesData {
    mtd: number;
    lastMonth: number;
    twoMonthsAgo: number;
  }

  const StatCard = ({ title, value, icon: Icon, change, color, onClick }: any) => (
    <Card className={onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""} onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-semibold text-gray-900">{value || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#f9f9fb]">
            <Icon className={`${color.replace('bg-', 'text-')} w-6 h-6`} />
          </div>
        </div>
        {change && (
          <div className="mt-4 flex items-center">
            <span className="text-sm font-medium text-[#55c5ce]">{change}</span>
            <span className="text-gray-500 text-sm ml-2">from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (statsLoading || salesLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
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
      {/* Core Performance Cards - GC Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="MTD Sales"
          value={`$${(salesData as SalesData)?.mtd?.toLocaleString() || '0'}`}
          icon={DollarSign}
          change="+12%"
          color="bg-primary"
          onClick={() => setShowDrillDown(showDrillDown === 'mtd' ? null : 'mtd')}
        />
        <StatCard
          title="Last Month Sales"
          value={`$${(salesData as SalesData)?.lastMonth?.toLocaleString() || '0'}`}
          icon={TrendingUp}
          change="+8%"
          color="bg-success"
          onClick={() => setShowDrillDown(showDrillDown === 'lastMonth' ? null : 'lastMonth')}
        />
        <StatCard
          title="Active Tasks"
          value={(stats as DashboardStats)?.activeTasks || 0}
          icon={ChartLine}
          change="+5%"
          color="bg-warning"
          onClick={() => setShowDrillDown(showDrillDown === 'activeTasks' ? null : 'activeTasks')}
        />
        <StatCard
          title="Emails Sent"
          value={(stats as DashboardStats)?.emailsSent || 0}
          icon={Mail}
          change="+15%"
          color="bg-purple-500"
          onClick={() => setShowDrillDown(showDrillDown === 'emailsSent' ? null : 'emailsSent')}
        />
        <StatCard
          title="Opportunities"
          value={(stats as any)?.totalOpportunities || 8}
          icon={Target}
          change="+3%"
          color="bg-[#55c5ce]"
          onClick={() => setShowDrillDown(showDrillDown === 'opportunities' ? null : 'opportunities')}
        />
      </div>
      {/* Drill Down Details */}
      {showDrillDown && (showDrillDown === 'mtd' || showDrillDown === 'lastMonth') && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {showDrillDown === 'mtd' ? 'Month to Date' : 'Last Month'} Sales Details
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDrillDown(null)}
              >
                Close
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Company</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailedSales as any)?.map((sale: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{sale.company}</td>
                      <td className="py-2">${sale.amount.toLocaleString()}</td>
                      <td className="py-2">{new Date(sale.date).toLocaleDateString()}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-gray-500">No sales data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Active Tasks Drill Down */}
      {showDrillDown === 'activeTasks' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Tasks Breakdown</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDrillDown(null)}
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {(taskBreakdown as any)?.overdue || 0}
                  </div>
                  <div className="text-sm font-medium text-red-700">Overdue Tasks</div>
                  <div className="text-xs text-red-500 mt-1">Past due date</div>
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {(taskBreakdown as any)?.dueToday || 0}
                  </div>
                  <div className="text-sm font-medium text-orange-700">Due Today</div>
                  <div className="text-xs text-orange-500 mt-1">Due today</div>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {(taskBreakdown as any)?.dueTomorrow || 0}
                  </div>
                  <div className="text-sm font-medium text-yellow-700">Due Tomorrow</div>
                  <div className="text-xs text-yellow-500 mt-1">Due tomorrow</div>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(taskBreakdown as any)?.dueFuture || 0}
                  </div>
                  <div className="text-sm font-medium text-blue-700">Due in Future</div>
                  <div className="text-xs text-blue-500 mt-1">Due later</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Emails Sent Drill Down */}
      {showDrillDown === 'emailsSent' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Emails Sent Breakdown</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDrillDown(null)}
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Count Cards */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {(emailBreakdown as any)?.sentYesterday || 0}
                      </div>
                      <div className="text-sm font-medium text-orange-700">Emails Sent Yesterday</div>
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(emailBreakdown as any)?.sentToday || 0}
                      </div>
                      <div className="text-sm font-medium text-green-700">Emails Sent Today</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Emails List */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">5 Most Recent Emails</h4>
                <div className="space-y-2">
                  {(emailBreakdown as any)?.recentEmails?.length > 0 ? (
                    (emailBreakdown as any).recentEmails.map((email: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {email.subject}
                            </div>
                            <div className="text-xs text-gray-600">
                              To: {email.recipient}
                            </div>
                            <div className="text-xs text-gray-500">
                              {email.sentAt ? new Date(email.sentAt).toLocaleDateString() + ' ' + 
                               new Date(email.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Not sent'}
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            email.status === 'sent' ? 'bg-green-100 text-green-800' :
                            email.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {email.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">No recent emails found</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Opportunities Drill Down */}
      {showDrillDown === 'opportunities' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Opportunities Breakdown</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDrillDown(null)}
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-[#66cc99]" style={{ backgroundColor: '#ccedf0', borderColor: '#55c5ce' }}>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#277e88' }}>
                    {(opportunitiesBreakdown as any)?.closeRate || 0}%
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#1b575e' }}>Close Rate</div>
                  <div className="text-xs mt-1" style={{ color: '#277e88' }}>Won opportunities this month</div>
                </div>
              </div>
              <div className="p-4 rounded-lg border" style={{ backgroundColor: '#f6cbcb', borderColor: '#d2232a' }}>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#a61c25' }}>
                    {(opportunitiesBreakdown as any)?.overdueOpportunities || 0}
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#721319' }}>Overdue Opportunities</div>
                  <div className="text-xs mt-1" style={{ color: '#a61c25' }}>Past estimated ship date</div>
                </div>
              </div>
              <div className="p-4 rounded-lg border" style={{ backgroundColor: '#ffd580', borderColor: '#ffd580' }}>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#2d3333' }}>
                    {(opportunitiesBreakdown as any)?.currentMonthOpportunities || 0}
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#2d3333' }}>Current Month Opportunities</div>
                  <div className="text-xs mt-1" style={{ color: '#737373' }}>Ship date this month</div>
                </div>
              </div>
              <div className="p-4 rounded-lg border" style={{ backgroundColor: '#f3fbfc', borderColor: '#55c5ce' }}>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#277e88' }}>
                    {(opportunitiesBreakdown as any)?.futureOpportunities || 0}
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#1b575e' }}>Future Opportunities</div>
                  <div className="text-xs mt-1" style={{ color: '#277e88' }}>Next month and beyond</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Two Months Ago Sales and Estimated Bonus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Two Months Ago Sales</span>
                <span className="text-lg font-semibold">${(salesData as any)?.twoMonthsAgo?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimated Bonus</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#a4e0e5]">
                <span className="text-sm font-medium">MTD Bonus (1.7%)</span>
                <span className="text-lg font-semibold text-[#ffffff]">
                  ${Math.round(((salesData as any)?.mtd || 0) * 0.017).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#e87373]">
                <span className="text-sm font-medium">Last Month Bonus (1.7%)</span>
                <span className="text-lg font-semibold text-[#ffffff]">
                  ${Math.round(((salesData as any)?.lastMonth || 0) * 0.017).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 italic">
                * Numbers aren't final and are contingent on billing review
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Team Comparison */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Sales Comparison (MTD)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Rank</th>
                  <th className="text-left py-2">Gift Concierge</th>
                  <th className="text-left py-2">MTD Sales</th>
                  <th className="text-left py-2">Performance</th>
                </tr>
              </thead>
              <tbody>
                {(teamData as any)?.map((member: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                    </td>
                    <td className="py-2 font-medium">{member.name}</td>
                    <td className="py-2">${member.sales.toLocaleString()}</td>
                    <td className="py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (member.sales / Math.max(...((teamData as any)?.map((m: any) => m.sales) || [1]))) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{member.change}</span>
                      </div>
                    </td>
                  </tr>
                )) || (
                  <tr key="no-data">
                    <td colSpan={4} className="py-4 text-center text-gray-500">No team data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Task Completion Trends Chart */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Trends</h3>
          <div className="h-64">
            <TaskChart />
          </div>
        </CardContent>
      </Card>
      {/* Assigned Domains */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Assigned Domains (Top 50)</h3>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <select 
                value={domainFilter} 
                onChange={(e) => setDomainFilter(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="lifetime">Lifetime Revenue</option>
                <option value="last12months">Last 12 Months</option>
                <option value="last3months">Last 3 Months</option>
                <option value="lastMonth">Last Month</option>
                <option value="mtd">Month to Date</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Domain</th>
                  <th className="text-left py-2">Company Count</th>
                  <th className="text-left py-2">Revenue</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(domainsData as any)?.slice(0, 50).map((domain: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{domain.domain}</td>
                    <td className="py-2">{domain.companyCount}</td>
                    <td className="py-2">${domain.revenue.toLocaleString()}</td>
                    <td className="py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDomain(selectedDomain === domain.domain ? null : domain.domain)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {selectedDomain === domain.domain ? 'Hide' : 'View'}
                      </Button>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">No domain data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Domain Details Drill Down */}
      {selectedDomain && domainDetails && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Domain Details: {selectedDomain}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDomain(null)}
              >
                Close
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Organization</th>
                    <th className="text-left py-2">Recent Activity</th>
                    <th className="text-left py-2">Last Order</th>
                    <th className="text-left py-2">Last Credit</th>
                    <th className="text-left py-2">MTD Revenue</th>
                    <th className="text-left py-2">Lifetime Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {(domainDetails as any)?.organizations?.map((org: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium">{org.name}</td>
                      <td className="py-2">{org.recentActivity || 'None'}</td>
                      <td className="py-2">{org.lastOrderDate ? new Date(org.lastOrderDate).toLocaleDateString() : '-'}</td>
                      <td className="py-2">{org.lastCreditDate ? new Date(org.lastCreditDate).toLocaleDateString() : '-'}</td>
                      <td className="py-2">${org.mtdRevenue.toLocaleString()}</td>
                      <td className="py-2">${org.lifetimeRevenue.toLocaleString()}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-gray-500">No organization data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Open Opportunities */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Open Opportunities (Above $2,000)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Opportunity</th>
                  <th className="text-left py-2">Value</th>
                  <th className="text-left py-2">Ship Date</th>
                  <th className="text-left py-2">Last Activity</th>
                  <th className="text-left py-2">Next Activity</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(opportunitiesData as any)?.filter((opp: any) => opp.value > 2000)
                  .sort((a: any, b: any) => new Date(a.shipDate).getTime() - new Date(b.shipDate).getTime())
                  .map((opportunity: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{opportunity.name}</td>
                    <td className="py-2 font-semibold text-green-600">${opportunity.value.toLocaleString()}</td>
                    <td className="py-2">{new Date(opportunity.shipDate).toLocaleDateString()}</td>
                    <td className="py-2">{opportunity.lastActivity ? new Date(opportunity.lastActivity).toLocaleDateString() : '-'}</td>
                    <td className="py-2">{opportunity.nextActivity ? new Date(opportunity.nextActivity).toLocaleDateString() : '-'}</td>
                    <td className="py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(opportunity.insightlyUrl, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View in Insightly
                      </Button>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-500">No opportunities available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}