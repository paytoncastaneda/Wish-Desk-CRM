import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DollarSign, 
  TrendingUp, 
  Award, 
  Building, 
  Calendar,
  ExternalLink,
  Eye,
  Filter,
  Users,
  Target,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function GCDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("mtd");
  const [visibleGCs, setVisibleGCs] = useState<string[]>([]);
  const [domainFilter, setDomainFilter] = useState("company_count");
  const [expandedSalesRow, setExpandedSalesRow] = useState<string | null>(null);
  const [expandedDomainRow, setExpandedDomainRow] = useState<string | null>(null);

  // Fetch GC dashboard data
  const { data: salesData = {}, isLoading: salesLoading } = useQuery({
    queryKey: ["/api/gc/sales-performance"],
  });

  const { data: teamData = [], isLoading: teamLoading } = useQuery({
    queryKey: ["/api/gc/team-comparison"],
  });

  const { data: domainsData = [], isLoading: domainsLoading } = useQuery({
    queryKey: ["/api/gc/assigned-domains", domainFilter],
  });

  const { data: opportunitiesData = [], isLoading: opportunitiesLoading } = useQuery({
    queryKey: ["/api/gc/open-opportunities"],
  });

  const { data: detailedSales = [], isLoading: detailsLoading } = useQuery({
    queryKey: ["/api/gc/sales-details", expandedSalesRow],
    enabled: !!expandedSalesRow,
  });

  const { data: domainDetails = [], isLoading: domainDetailsLoading } = useQuery({
    queryKey: ["/api/gc/domain-details", expandedDomainRow],
    enabled: !!expandedDomainRow,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateBonus = (sales: number) => {
    return sales * 0.017; // 1.7% bonus rate
  };

  const getRankSuffix = (rank: number) => {
    if (rank % 10 === 1 && rank % 100 !== 11) return 'st';
    if (rank % 10 === 2 && rank % 100 !== 12) return 'nd';
    if (rank % 10 === 3 && rank % 100 !== 13) return 'rd';
    return 'th';
  };

  const toggleSalesExpansion = (period: string) => {
    setExpandedSalesRow(expandedSalesRow === period ? null : period);
  };

  const toggleDomainExpansion = (domain: string) => {
    setExpandedDomainRow(expandedDomainRow === domain ? null : domain);
  };

  const toggleGCVisibility = (gcId: string) => {
    setVisibleGCs(prev => 
      prev.includes(gcId) 
        ? prev.filter(id => id !== gcId)
        : [...prev, gcId]
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Gift Concierge Dashboard</h3>
          <p className="text-sm text-gray-500">Your sales performance, bonuses, and opportunities</p>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Month to Date Sales</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(salesData?.mtd || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Month Sales</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(salesData?.lastMonth || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                <p className="text-2xl font-bold text-orange-600">
                  {salesData?.activeTasks || 0}
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-purple-600">
                  {salesData?.emailsSent || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Task Completion</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {salesData?.taskCompletionRate || 0}%
                </p>
              </div>
              <Award className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Sales Revenue Details */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Revenue Details</CardTitle>
            <CardDescription>Click to drill down into transaction details</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Sales Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-medium">Month to Date</TableCell>
                  <TableCell>{formatCurrency(salesData?.mtd || 0)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleSalesExpansion('mtd')}
                    >
                      {expandedSalesRow === 'mtd' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedSalesRow === 'mtd' && detailedSales.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="bg-gray-50">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">MTD Transaction Details:</h4>
                        {detailedSales.map((transaction: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm border-b pb-1">
                            <span>{transaction.company || transaction.user}</span>
                            <span>{formatCurrency(transaction.amount)}</span>
                            <span>{formatDate(transaction.date)}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-medium">Last Month</TableCell>
                  <TableCell>{formatCurrency(salesData?.lastMonth || 0)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleSalesExpansion('lastMonth')}
                    >
                      {expandedSalesRow === 'lastMonth' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
                
                <TableRow className="hover:bg-gray-50">
                  <TableCell className="font-medium">Two Months Ago</TableCell>
                  <TableCell>{formatCurrency(salesData?.twoMonthsAgo || 0)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleSalesExpansion('twoMonthsAgo')}
                    >
                      {expandedSalesRow === 'twoMonthsAgo' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Estimated Bonus */}
        <Card>
          <CardHeader>
            <CardTitle>Estimated Bonus</CardTitle>
            <CardDescription>
              Based on 1.7% commission rate
              <br />
              <span className="text-orange-600 font-medium">
                * Numbers aren't final and are contingent on billing review
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">MTD Estimated Bonus</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(calculateBonus(salesData?.mtd || 0))}
                  </p>
                </div>
                <Award className="h-6 w-6 text-green-600" />
              </div>
              
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Month Bonus</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(calculateBonus(salesData?.lastMonth || 0))}
                  </p>
                </div>
                <Award className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Comparison</CardTitle>
          <CardDescription>Month to Date sales ranking for all Gift Concierges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Filter team members:</p>
            <div className="flex flex-wrap gap-2">
              {teamData.map((gc: any) => (
                <div key={gc.id} className="flex items-center space-x-2">
                  <Switch
                    checked={!visibleGCs.includes(gc.id.toString())}
                    onCheckedChange={() => toggleGCVisibility(gc.id.toString())}
                  />
                  <span className="text-sm">{gc.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Gift Concierge</TableHead>
                <TableHead>MTD Sales</TableHead>
                <TableHead>Estimated Bonus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamData
                .filter((gc: any) => !visibleGCs.includes(gc.id.toString()))
                .map((gc: any, index: number) => (
                <TableRow key={gc.id}>
                  <TableCell>
                    <Badge className={index < 3 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}>
                      {gc.rank}{getRankSuffix(gc.rank)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{gc.name}</TableCell>
                  <TableCell>{formatCurrency(gc.mtdSales || 0)}</TableCell>
                  <TableCell>{formatCurrency(calculateBonus(gc.mtdSales || 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Assigned Domains */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Domains</CardTitle>
            <CardDescription>
              Top 50 domains by company count (click to drill down)
            </CardDescription>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_count">Company Count</SelectItem>
                  <SelectItem value="lifetime_revenue">Lifetime Revenue</SelectItem>
                  <SelectItem value="last_12_months">Last 12 Months</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="mtd">Month to Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Companies</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domainsData.slice(0, 10).map((domain: any) => (
                  <>
                    <TableRow key={domain.domain} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{domain.domain}</TableCell>
                      <TableCell>{domain.companyCount}</TableCell>
                      <TableCell>{formatCurrency(domain.revenue || 0)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleDomainExpansion(domain.domain)}
                        >
                          {expandedDomainRow === domain.domain ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedDomainRow === domain.domain && domainDetails.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-gray-50">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Organizations in {domain.domain}:</h4>
                            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                              {domainDetails.map((org: any, index: number) => (
                                <div key={index} className="flex justify-between items-center text-sm border-b pb-2">
                                  <div>
                                    <p className="font-medium">{org.organizationName}</p>
                                    <p className="text-gray-500">
                                      Last Order: {org.lastOrderDate ? formatDate(org.lastOrderDate) : 'N/A'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p>{formatCurrency(org.lifetimeRevenue || 0)}</p>
                                    <p className="text-gray-500 text-xs">Lifetime</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Open Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle>High-Value Open Opportunities</CardTitle>
            <CardDescription>Opportunities over $2,000 sorted by estimated ship date</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Ship Date</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunitiesData.slice(0, 10).map((opportunity: any) => (
                  <TableRow key={opportunity.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{opportunity.name}</TableCell>
                    <TableCell>{formatCurrency(opportunity.value || 0)}</TableCell>
                    <TableCell>
                      {opportunity.estimatedShipDate ? formatDate(opportunity.estimatedShipDate) : 'TBD'}
                    </TableCell>
                    <TableCell>
                      {opportunity.lastActivityDate ? formatDate(opportunity.lastActivityDate) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {opportunity.insightlyUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(opportunity.insightlyUrl, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Insightly
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {opportunitiesData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No high-value opportunities found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}