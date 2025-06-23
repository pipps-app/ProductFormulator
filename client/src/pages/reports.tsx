import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  PieChart,
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Crown,
  Zap,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ReportData {
  title: string;
  description: string;
  data: any;
  generatedAt: string;
  tier: string;
}

export default function Reports() {
  const [selectedTier, setSelectedTier] = useState("free");
  const [refreshing, setRefreshing] = useState(false);

  const { data: userInfo } = useQuery({
    queryKey: ["/api/user"]
  });

  const { data: reports, refetch: refetchReports, isLoading } = useQuery({
    queryKey: ["/api/reports", selectedTier],
    enabled: !!userInfo
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchReports();
      toast({
        title: "Reports Updated",
        description: "All reports have been refreshed with the latest data."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh reports. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadReport = (report: ReportData) => {
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Package className="h-4 w-4" />;
      case 'pro': return <Zap className="h-4 w-4" />;
      case 'business': return <TrendingUp className="h-4 w-4" />;
      case 'enterprise': return <Crown className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'business': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-gold-100 text-gold-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canAccessTier = (tier: string) => {
    const userTier = userInfo?.subscriptionPlan || 'free';
    const tierHierarchy = ['free', 'pro', 'business', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const requiredTierIndex = tierHierarchy.indexOf(tier);
    return userTierIndex >= requiredTierIndex;
  };

  const renderReportCard = (report: ReportData) => (
    <Card key={report.title} className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getTierIcon(report.tier)}
            <CardTitle className="text-lg">{report.title}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getTierColor(report.tier)}>
              {report.tier.charAt(0).toUpperCase() + report.tier.slice(1)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadReport(report)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">{report.description}</p>
        <p className="text-xs text-gray-500">
          Generated: {new Date(report.generatedAt).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renderReportData(report)}
        </div>
      </CardContent>
    </Card>
  );

  const renderReportData = (report: ReportData) => {
    const data = report.data;
    
    // Handle different data structures
    if (Array.isArray(data)) {
      return (
        <div className="space-y-2">
          {data.slice(0, 5).map((item, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">
                {item.name || item.materialName || item.category || `Item ${index + 1}`}
              </span>
              <Badge variant="outline">
                {item.unitCost || item.totalCost || item.value || item.count || 'N/A'}
              </Badge>
            </div>
          ))}
          {data.length > 5 && (
            <p className="text-xs text-gray-500 text-center">
              ...and {data.length - 5} more items
            </p>
          )}
        </div>
      );
    }
    
    if (typeof data === 'object' && data !== null) {
      return (
        <div className="space-y-2">
          {Object.entries(data).slice(0, 5).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <Badge variant="outline">
                {typeof value === 'object' ? 'View Details' : String(value)}
              </Badge>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="p-4 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">
          {typeof data === 'string' ? data : JSON.stringify(data)}
        </p>
      </div>
    );
  };

  const renderTierUpgrade = (tier: string) => (
    <Card className="h-full border-dashed border-2 border-gray-300">
      <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier Required
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Upgrade your subscription to access {tier} tier reports with advanced analytics and insights.
        </p>
        <Button>
          Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into your formulation costs and material usage
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={selectedTier} onValueChange={setSelectedTier}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="free" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Free</span>
          </TabsTrigger>
          <TabsTrigger value="pro" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Pro</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Business</span>
          </TabsTrigger>
          <TabsTrigger value="enterprise" className="flex items-center space-x-2">
            <Crown className="h-4 w-4" />
            <span>Enterprise</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="free">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canAccessTier("free") ? (
              isLoading ? (
                <div className="col-span-full text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Generating reports...</p>
                </div>
              ) : reports && reports.length > 0 ? (
                reports.map((report: ReportData) => renderReportCard(report))
              ) : (
                <div className="col-span-full text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No reports available</p>
                </div>
              )
            ) : (
              renderTierUpgrade("free")
            )}
          </div>
        </TabsContent>

        <TabsContent value="pro">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canAccessTier("pro") ? (
              isLoading ? (
                <div className="col-span-full text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Generating reports...</p>
                </div>
              ) : reports && reports.length > 0 ? (
                reports.map((report: ReportData) => renderReportCard(report))
              ) : (
                <div className="col-span-full text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No reports available</p>
                </div>
              )
            ) : (
              renderTierUpgrade("pro")
            )}
          </div>
        </TabsContent>

        <TabsContent value="business">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canAccessTier("business") ? (
              isLoading ? (
                <div className="col-span-full text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Generating reports...</p>
                </div>
              ) : reports && reports.length > 0 ? (
                reports.map((report: ReportData) => renderReportCard(report))
              ) : (
                <div className="col-span-full text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No reports available</p>
                </div>
              )
            ) : (
              renderTierUpgrade("business")
            )}
          </div>
        </TabsContent>

        <TabsContent value="enterprise">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canAccessTier("enterprise") ? (
              isLoading ? (
                <div className="col-span-full text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Generating reports...</p>
                </div>
              ) : reports && reports.length > 0 ? (
                reports.map((report: ReportData) => renderReportCard(report))
              ) : (
                <div className="col-span-full text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No reports available</p>
                </div>
              )
            ) : (
              renderTierUpgrade("enterprise")
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}