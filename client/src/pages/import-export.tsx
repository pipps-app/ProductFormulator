import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileText, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import FileUpload from "@/components/common/file-upload";

export default function ImportExport() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleSetupImportData = async () => {
    setImporting(true);
    try {
      const response = await apiRequest("POST", "/api/setup-import-data", {});
      const result = await response.json();
      toast({
        title: "Setup completed",
        description: result.message
      });
    } catch (error) {
      toast({
        title: "Setup failed",
        description: "Failed to setup vendors and categories",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    setImporting(true);
    try {
      const response = await apiRequest("POST", "/api/remove-duplicates", {});
      const result = await response.json();
      
      // Force refresh of all material-related queries
      const { queryClient } = await import("@/lib/queryClient");
      await queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Duplicates removed",
        description: result.message
      });
    } catch (error) {
      toast({
        title: "Failed to remove duplicates",
        description: "An error occurred while removing duplicate materials",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async (files: File[]) => {
    if (files.length === 0) return;
    
    setImporting(true);
    try {
      const file = files[0];
      const text = await file.text();
      
      let materials = [];
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        // Parse CSV
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          throw new Error('CSV must have at least a header row and one data row');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        console.log('CSV Headers:', headers);
        
        console.log(`Processing ${lines.length} total lines (${lines.length - 1} data rows)`);
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) {
            console.log(`Skipping empty line ${i}`);
            continue;
          }
          
          const values = [];
          let currentValue = '';
          let inQuotes = false;
          
          for (let char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());
          
          const material: any = {};
          headers.forEach((header, index) => {
            const value = values[index]?.replace(/"/g, '').trim() || '';
            switch (header.toLowerCase()) {
              case 'name':
                material.name = value;
                break;
              case 'sku':
                material.sku = value || null;
                break;
              case 'categoryname':
                material.categoryName = value;
                break;
              case 'vendorname':
                material.vendorName = value;
                break;
              case 'totalcost':
                material.totalCost = value || '0';
                break;
              case 'quantity':
                material.quantity = value || '1';
                break;
              case 'unit':
                material.unit = value || 'pcs';
                break;
              case 'notes':
                material.notes = value || null;
                break;
            }
          });
          
          // Validate required fields
          if (material.name && material.name.trim() && 
              material.categoryName && material.categoryName.trim() && 
              material.vendorName && material.vendorName.trim()) {
            materials.push(material);
          } else {
            console.log(`Skipping invalid material on line ${i}:`, material);
          }
        }
        
        console.log(`Parsed ${materials.length} valid materials from ${lines.length - 1} data rows`);
      } else {
        // Parse JSON
        const data = JSON.parse(text);
        materials = data.materials || [];
      }

      if (materials.length > 0) {
        console.log('Importing materials:', materials.slice(0, 3));
        const response = await apiRequest("POST", "/api/import/materials", { materials });
        const result = await response.json();
        
        if (result.failed > 0) {
          // Show detailed step-by-step instructions
          const steps = result.actionSteps || [];
          const stepsText = steps.length > 0 ? steps.map((step, i) => `${i + 1}. ${step}`).join('\n') : 'Check missing vendors/categories and create them first.';
          
          toast({ 
            title: `${result.failed} materials failed to import`, 
            description: `${result.successful} succeeded. TO FIX:\n${stepsText}`,
            variant: "destructive"
          });
          
          // Also show in console for debugging
          console.log('=== IMPORT ISSUE RESOLUTION ===');
          console.log('Problem:', result.guidance);
          console.log('Action Steps:');
          steps.forEach((step, i) => console.log(`${i + 1}. ${step}`));
          console.log('Detailed errors:', result.errors);
        } else {
          toast({ 
            title: "Import successful", 
            description: `All ${result.successful} materials imported successfully`
          });
        }
      } else {
        toast({ 
          title: "No valid materials found", 
          description: "Please check your file format and ensure it contains valid material data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({ 
        title: "Import failed", 
        description: error instanceof Error ? error.message : "Please check your file format and try again",
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
              <Alert className="border-green-200 bg-green-50">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <p><strong className="text-green-800">CSV Import Process:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-green-700 ml-4">
                      <li>Upload your CSV file below</li>
                      <li>If materials fail, you'll get EXACT instructions on what to create</li>
                      <li>Create the missing vendors/categories</li>
                      <li>Re-upload the SAME file - only failed items will import</li>
                    </ol>
                    <p className="text-green-600 text-xs mt-2 font-medium">
                      ✓ Required format: name,sku,categoryName,vendorName,totalCost,quantity,unit,notes
                    </p>
                  </div>
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
                  onClick={handleSetupImportData}
                  disabled={importing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Setup Vendors & Categories
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRemoveDuplicates}
                  disabled={importing}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Remove Duplicates
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownloadTemplate('materials')}
                >
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
