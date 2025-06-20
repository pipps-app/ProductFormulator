import { useState } from "react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Trash2, Package, DollarSign, Calendar, Building2 } from "lucide-react";
import { useMaterial } from "@/hooks/use-materials";
import MaterialForm from "@/components/materials/material-form";
import FileAttachments from "@/components/files/file-attachments";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

export default function MaterialDetail() {
  const { id } = useParams();
  const materialId = parseInt(id || "0");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: material, isLoading } = useMaterial(materialId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/raw-materials/${materialId}`);
      toast({
        title: "Material deleted",
        description: "The material has been successfully deleted.",
      });
      
      // Invalidate queries and redirect
      queryClient.invalidateQueries({ queryKey: ['/api/raw-materials'] });
      window.location.href = '/materials';
    } catch (error) {
      console.error("Error deleting material:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Failed to delete the material. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(value));
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/materials">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Materials
            </Button>
          </Link>
        </div>
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-muted rounded animate-pulse" />
              <div className="h-96 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/materials">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Materials
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Material not found</h3>
            <p className="text-muted-foreground">
              The material you're looking for doesn't exist or may have been deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/materials">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Materials
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Material</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{material.name}"? This action cannot be undone.
                  All associated files and formulation ingredients will also be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Material
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Material Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{material.name}</CardTitle>
                  {material.sku && (
                    <p className="text-muted-foreground mt-1">SKU: {material.sku}</p>
                  )}
                </div>
                <Badge variant={material.isActive ? "default" : "secondary"}>
                  {material.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {material.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{material.notes}</p>
                </div>
              )}
              
              <Separator />
              
              {/* Cost Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="font-semibold">{formatCurrency(material.totalCost)}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Package className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-semibold">{material.quantity} {material.unit}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                  <p className="text-sm text-muted-foreground">Unit Cost</p>
                  <p className="font-semibold">{formatCurrency(material.unitCost)}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm text-muted-foreground">Added</p>
                  <p className="font-semibold">{formatDate(material.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Attachments */}
          <FileAttachments
            entityType="material"
            entityId={material.id}
            entityName={material.name}
          />
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Category & Vendor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {material.category && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: material.category.color }}
                    />
                    <p className="text-sm text-muted-foreground">Category</p>
                  </div>
                  <p className="font-medium">{material.category.name}</p>
                </div>
              )}
              
              {material.vendor && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Vendor</p>
                  </div>
                  <p className="font-medium">{material.vendor.name}</p>
                  {material.vendor.contactEmail && (
                    <p className="text-sm text-muted-foreground">{material.vendor.contactEmail}</p>
                  )}
                </div>
              )}
              
              <Separator />
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                <p className="font-medium">{formatDate(material.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Usage in Formulations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                This material is used in formulations. Usage tracking will be implemented in future updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
          </DialogHeader>
          <MaterialForm
            material={material}
            onSuccess={() => {
              setIsEditModalOpen(false);
              toast({
                title: "Material updated",
                description: "The material has been successfully updated.",
              });
            }}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}