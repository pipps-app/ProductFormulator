import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FileUpload from "@/components/common/file-upload";

export default function ImportExport() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleImport = (files: File[]) => {
    setImporting(true);
    // TODO: Implement import logic
    setTimeout(() => {
      setImporting(false);
    }, 2000);
  };

  const handleExportMaterials = () => {
    setExporting(true);
    // TODO: Implement export logic
    setTimeout(() => {
      setExporting(false);
    }, 1000);
  };

  const handleExportFormulations = () => {
    setExporting(true);
    // TODO: Implement export logic
    setTimeout(() => {
      setExporting(false);
    }, 1000);
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
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Template
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
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Template
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
                <Button onClick={handleExportMaterials} disabled={exporting}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
                <Button variant="outline" onClick={handleExportMaterials} disabled={exporting}>
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
              
              <Button onClick={handleExportFormulations} disabled={exporting}>
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
