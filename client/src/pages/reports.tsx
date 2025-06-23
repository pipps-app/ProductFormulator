import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import jsPDF from 'jspdf';
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
  hasAccess?: boolean;
}

export default function Reports() {
  const [selectedTier, setSelectedTier] = useState("free");
  const [refreshing, setRefreshing] = useState(false);

  const { data: userInfo } = useQuery({
    queryKey: ["/api/user"]
  });

  const { data: reportsData, refetch: refetchReports, isLoading } = useQuery({
    queryKey: [`/api/reports/${selectedTier}`],
    enabled: !!userInfo
  });

  const reports = reportsData?.reports || [];
  const isPreview = reportsData?.preview || false;

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

  const handleDownloadReport = (report: ReportData, format: 'pdf' | 'json' = 'pdf') => {
    if (format === 'pdf') {
      generatePDF(report);
    } else {
      const dataStr = JSON.stringify(report, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const generatePDF = (report: ReportData) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Header with client info
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('PIPPS Maker Calc - Report', margin, yPosition);
    yPosition += 10;

    // Client and report info
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Client: ${userInfo?.email || 'Unknown User'}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Company: ${userInfo?.company || 'Not specified'}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Report: ${report.title}`, margin, yPosition);
    yPosition += 15;

    // Report title and description
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text(report.title, margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const splitDescription = pdf.splitTextToSize(report.description, pageWidth - 2 * margin);
    pdf.text(splitDescription, margin, yPosition);
    yPosition += splitDescription.length * 6 + 10;

    // Report data
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Report Data:', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');

    const formatDataForPDF = (data: any, indent = 0): string[] => {
      const lines: string[] = [];
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            const title = item.name || item.materialName || item.category || item.formulation || `Item ${index + 1}`;
            lines.push(`${' '.repeat(indent)}${index + 1}. ${title}`);
            Object.entries(item).forEach(([key, value]) => {
              if (key !== 'name' && key !== 'materialName' && key !== 'category' && key !== 'formulation') {
                const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                let displayValue = value;
                
                // Handle nested objects and arrays
                if (typeof value === 'object' && value !== null) {
                  if (Array.isArray(value)) {
                    displayValue = `[${value.length} items]`;
                  } else {
                    displayValue = JSON.stringify(value, null, 2);
                  }
                }
                
                lines.push(`${' '.repeat(indent + 4)}${displayKey}: ${displayValue}`);
              }
            });
            lines.push(''); // Add space between items
          } else {
            lines.push(`${' '.repeat(indent)}${index + 1}. ${item}`);
          }
        });
      } else if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
          const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          let displayValue = value;
          
          // Handle nested objects and arrays
          if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              displayValue = `[${value.length} items]`;
            } else {
              displayValue = JSON.stringify(value, null, 2);
            }
          }
          
          lines.push(`${' '.repeat(indent)}${displayKey}: ${displayValue}`);
        });
      } else {
        lines.push(`${' '.repeat(indent)}${data}`);
      }
      return lines;
    };

    const dataLines = formatDataForPDF(report.data);
    dataLines.forEach(line => {
      if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      const splitLine = pdf.splitTextToSize(line, pageWidth - 2 * margin);
      pdf.text(splitLine, margin, yPosition);
      yPosition += splitLine.length * 5;
    });

    // Download
    const fileName = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
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

  const renderReportItem = (report: ReportData, index: number) => {
    const hasAccess = report.hasAccess !== false;
    
    return (
      <div key={report.title} className={`border rounded-lg ${hasAccess ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getTierIcon(report.tier)}
              <h3 className={`text-lg font-semibold ${hasAccess ? 'text-gray-900' : 'text-gray-500'}`}>
                {report.title}
              </h3>
              {!hasAccess && (
                <Badge variant="secondary" className="text-xs">
                  Upgrade Required
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getTierColor(report.tier)}>
                {report.tier.charAt(0).toUpperCase() + report.tier.slice(1)}
              </Badge>
              {hasAccess && (
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReport(report, 'pdf')}
                    title="Download as PDF"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReport(report, 'json')}
                    title="Download as JSON"
                  >
                    <Download className="h-4 w-4" />
                    JSON
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <p className={`text-sm mb-2 ${hasAccess ? 'text-gray-600' : 'text-gray-500'}`}>
            {report.description}
          </p>
          
          <p className="text-xs text-gray-500 mb-3">
            Generated: {new Date(report.generatedAt).toLocaleString()}
          </p>

          {hasAccess ? (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                <ChevronRight className="h-4 w-4" />
                <span>View Report Data</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  {renderReportData(report)}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <div className="bg-gray-100 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-500">
                Upgrade to {report.tier.charAt(0).toUpperCase() + report.tier.slice(1)} to view this report
              </p>
              <Button size="sm" className="mt-2">
                Upgrade Now
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReportData = (report: ReportData) => {
    const data = report.data;
    
    // Handle different data structures
    if (Array.isArray(data)) {
      return (
        <div className="space-y-3">
          {data.slice(0, 10).map((item, index) => (
            <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                {item.name || item.materialName || item.category || item.formulation || `Item ${index + 1}`}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(item).map(([key, value]) => {
                  if (key === 'name' || key === 'materialName' || key === 'category' || key === 'formulation') return null;
                  
                  let displayValue = value;
                  if (typeof value === 'object' && value !== null) {
                    if (Array.isArray(value)) {
                      displayValue = `${value.length} items`;
                    } else {
                      displayValue = 'Complex data';
                    }
                  }
                  
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="font-medium">{String(displayValue)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {data.length > 10 && (
            <div className="text-center py-2">
              <Badge variant="secondary">
                ...and {data.length - 10} more items
              </Badge>
            </div>
          )}
        </div>
      );
    }
    
    if (typeof data === 'object' && data !== null) {
      return (
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => {
            let displayValue = value;
            if (typeof value === 'object' && value !== null) {
              if (Array.isArray(value)) {
                displayValue = `${value.length} items`;
              } else {
                displayValue = 'Complex data';
              }
            }
            
            return (
              <div key={key} className="flex justify-between items-center p-3 bg-white border rounded">
                <span className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <Badge variant="outline">
                  {String(displayValue)}
                </Badge>
              </div>
            );
          })}
        </div>
      );
    }
    
    return (
      <div className="p-4 bg-white border rounded">
        <p className="text-sm text-gray-600">
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </p>
      </div>
    );
  };

  // Preview component for locked tier reports
  const PreviewCard = ({ title, description, reports }) => (
    <Card className="border-2 border-dashed border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-orange-800">{title}</CardTitle>
            <p className="text-orange-600 mt-1">{description}</p>
          </div>
          <Crown className="h-8 w-8 text-orange-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {reports.map((report, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-orange-100">
              <FileText className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-800">{report.title}</h4>
                <p className="text-sm text-gray-600">{report.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg border border-orange-200">
          <div>
            <p className="font-medium text-orange-800">Upgrade to unlock these reports</p>
            <p className="text-sm text-orange-600">Get detailed insights and analytics for your business</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            Upgrade Plan
          </Button>
        </div>
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
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Generating reports...</p>
              </div>
            ) : isPreview ? (
              <PreviewCard 
                title={reportsData.title}
                description={reportsData.description}
                reports={reportsData.reports}
              />
            ) : reports && reports.length > 0 ? (
              reports.map((report: ReportData, index) => renderReportItem(report, index))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No reports available</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pro">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Generating reports...</p>
              </div>
            ) : isPreview ? (
              <PreviewCard 
                title={reportsData.title}
                description={reportsData.description}
                reports={reportsData.reports}
              />
            ) : reports && reports.length > 0 ? (
              reports.map((report: ReportData, index) => renderReportItem(report, index))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No reports available</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="business">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Generating reports...</p>
              </div>
            ) : isPreview ? (
              <PreviewCard 
                title={reportsData.title}
                description={reportsData.description}
                reports={reportsData.reports}
              />
            ) : reports && reports.length > 0 ? (
              reports.map((report: ReportData, index) => renderReportItem(report, index))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No reports available</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="enterprise">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Generating reports...</p>
              </div>
            ) : isPreview ? (
              <PreviewCard 
                title={reportsData.title}
                description={reportsData.description}
                reports={reportsData.reports}
              />
            ) : reports && reports.length > 0 ? (
              reports.map((report: ReportData, index) => renderReportItem(report, index))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No reports available</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}