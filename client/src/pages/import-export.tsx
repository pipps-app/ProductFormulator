import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import FileUpload from "@/components/common/file-upload";

export default function ImportExport() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async (files: File[]) => {
    if (files.length === 0) return;
    
    setImporting(true);
    try {
      const file = files[0];
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.materials) {
        const response = await apiRequest("POST", "/api/import/materials", { materials: data.materials });
        const result = await response.json();
        toast({ 
          title: "Import completed", 
          description: result.message 
        });
      } else {
        toast({ 
          title: "Invalid file format", 
          description: "Please upload a valid JSON file with materials data",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ 
        title: "Import failed", 
        description: "Please check your file format and try again",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExportMaterials = async (format: 'csv' | 'json' = 'json') => {
    setExporting(true);
    try {
      const response = await fetch(`/api/export/materials?format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `materials.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Materials exported successfully" });
    } catch (error) {
      toast({ 
        title: "Export failed", 
        description: "Failed to export materials",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportFormulations = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/export/formulations');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'formulations.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Formulations exported successfully" });
    } catch (error) {
      toast({ 
        title: "Export failed", 
        description: "Failed to export formulations",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportBackup = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/export/backup');
      if (!response.ok) throw new Error('Backup failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pipps-backup.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Backup created successfully" });
    } catch (error) {
      toast({ 
        title: "Backup failed", 
        description: "Failed to create backup",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async (type: 'materials' | 'formulations') => {
    try {
      const response = await fetch(`/api/templates/${type}`);
      if (!response.ok) throw new Error('Template download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-template.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} template downloaded` });
    } catch (error) {
      toast({ 
        title: "Download failed", 
        description: "Failed to download template",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Import & Export</h2>
        <p className="text-slate-600 mt-1">Manage your data with import and export tools</p>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Import Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload a CSV file with columns: name, sku, category, vendor, totalCost, quantity, unit
                </AlertDescription>
              </Alert>
              
              <FileUpload
                onUpload={handleImport}
                accept=".csv,.json"
                maxSize={5 * 1024 * 1024}
                isLoading={importing}
              />
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownloadTemplate('materials')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Materials Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Import Formulations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload a JSON file with formulation data including ingredients and calculations
                </AlertDescription>
              </Alert>
              
              <FileUpload
                onUpload={handleImport}
                accept=".json"
                maxSize={5 * 1024 * 1024}
                isLoading={importing}
              />
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownloadTemplate('formulations')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Formulations Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Export Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                Export all your raw materials data including costs, quantities, and vendor information.
              </p>
              
              <div className="flex space-x-3">
                <Button onClick={() => handleExportMaterials('csv')} disabled={exporting}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
                <Button variant="outline" onClick={() => handleExportMaterials('json')} disabled={exporting}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Export Formulations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                Export all your formulations including ingredients, costs, and profit calculations.
              </p>
              
              <div className="flex space-x-3">
                <Button onClick={handleExportFormulations} disabled={exporting}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
                <Button variant="outline" onClick={handleExportFormulations} disabled={exporting}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF Report
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Backup Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                Create a complete backup of all your data including materials, formulations, vendors, and settings.
              </p>
              
              <Button onClick={handleExportBackup} disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                Create Full Backup
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
