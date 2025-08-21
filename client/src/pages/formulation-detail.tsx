import { useState } from "react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Trash2, FlaskRound, DollarSign, Package, Calendar, Target } from "lucide-react";
import { useFormulation, useFormulationIngredients } from "@/hooks/use-formulations";
import FormulationForm from "@/components/formulations/formulation-form";
import FileAttachments from "@/components/files/file-attachments";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

export default function FormulationDetail() {
  const { id } = useParams();
  const formulationId = parseInt(id || "0");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: formulation, isLoading } = useFormulation(formulationId);
  const { data: ingredients = [] } = useFormulationIngredients(formulationId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/formulations/${formulationId}`);
      toast({
        title: "Formulation deleted",
        description: "The formulation has been successfully deleted.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/formulations'] });
      window.location.href = '/formulations';
    } catch (error) {
      console.error("Error deleting formulation:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Failed to delete the formulation. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue) || numericValue === null || numericValue === undefined) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numericValue);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProfitMargin = () => {
    if (!formulation?.targetPrice || !formulation?.totalCost) return 0;
    const target = parseFloat(formulation.targetPrice);
    const cost = parseFloat(formulation.totalCost);
    return ((target - cost) / target * 100);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/formulations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Formulations
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

  if (!formulation) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/formulations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Formulations
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <FlaskRound className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Formulation not found</h3>
            <p className="text-muted-foreground">
              The formulation you're looking for doesn't exist or may have been deleted.
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
          <Link href="/formulations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Formulations
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit className="w-4 w-4 mr-2" />
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
                <AlertDialogTitle>Delete Formulation</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{formulation.name}"? This action cannot be undone.
                  All associated ingredients and files will also be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Formulation
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
          {/* Formulation Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{formulation.name}</CardTitle>
                  {formulation.description && (
                    <p className="text-muted-foreground mt-1">{formulation.description}</p>
                  )}
                </div>
                <Badge variant={formulation.isActive ? "default" : "secondary"}>
                  {formulation.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              
              {/* Cost & Profit Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="font-semibold">{formatCurrency(formulation.totalCost)}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Package className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-muted-foreground">Batch Size</p>
                  <p className="font-semibold">{formulation.batchSize} {formulation.batchUnit}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Target className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                  <p className="text-sm text-muted-foreground">Target Price</p>
                  <p className="font-semibold">
                    {formulation.targetPrice ? formatCurrency(formulation.targetPrice) : 'Not set'}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-semibold">{formatDate(formulation.createdAt)}</p>
                </div>
              </div>

              {/* Profit Analysis */}
              {formulation.targetPrice && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-medium mb-2">Profit Analysis</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Production Cost</p>
                      <p className="font-medium">{formatCurrency(formulation.totalCost)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target Revenue</p>
                      <p className="font-medium">{formatCurrency(formulation.targetPrice)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Profit Margin</p>
                      <p className={`font-medium ${calculateProfitMargin() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {calculateProfitMargin().toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients ({ingredients.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {ingredients.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No ingredients added to this formulation yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {ingredients.map((ingredient: any) => (
                    <div key={ingredient.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{ingredient.materialName}</p>
                        <p className="text-sm text-muted-foreground">
                          {ingredient.quantity} {ingredient.unit}
                          {ingredient.notes && ` • ${ingredient.notes}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(ingredient.costContribution)}</p>
                        <p className="text-xs text-muted-foreground">
                          {ingredient.includeInMarkup ? 'In markup' : 'Excluded'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Attachments */}
          <FileAttachments
            entityType="formulation"
            entityId={formulation.id}
            entityName={formulation.name}
          />
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Unit Cost</p>
                <p className="font-medium">{formatCurrency(formulation.unitCost)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Markup Percentage</p>
                <p className="font-medium">
                  {formulation.markupPercentage ? `${formulation.markupPercentage}%` : 'Not set'}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                <p className="font-medium">{formatDate(formulation.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Production Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Production</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Production tracking and batch history will be implemented in future updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Formulation</DialogTitle>
          </DialogHeader>
          <FormulationForm
            formulation={formulation}
            onSuccess={() => {
              setIsEditModalOpen(false);
              toast({
                title: "Formulation updated",
                description: "The formulation has been successfully updated.",
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}