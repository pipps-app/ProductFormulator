import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { insertFormulationSchema, type Formulation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMaterials } from "@/hooks/use-materials";
import { useEffect, useState } from "react";
import { Plus, X, Calculator } from "lucide-react";

interface Ingredient {
  id: string;
  materialId: number;
  materialName: string;
  unitCost: number;
  quantity: number;
  unit: string;
  totalCost: number;
}

interface FormulationFormProps {
  formulation?: Formulation | null;
  onSuccess: () => void;
}

export default function FormulationForm({ formulation, onSuccess }: FormulationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: materials } = useMaterials();
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [ingredientQuantity, setIngredientQuantity] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");

  const form = useForm({
    resolver: zodResolver(insertFormulationSchema.omit({ userId: true, batchSize: true, batchUnit: true })),
    defaultValues: {
      name: "",
      description: "",
      markupPercentage: "30.00",
      isActive: true,
    },
  });

  // Cost calculations
  const totalMaterialCost = ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
  const unitCost = totalMaterialCost; // Direct cost since we removed batch sizing
  const markupPercentage = parseFloat(form.watch("markupPercentage") || "30");
  const suggestedPrice = unitCost * (1 + markupPercentage / 100);
  const actualSellingPrice = parseFloat(sellingPrice || "0");
  const profit = actualSellingPrice > 0 ? actualSellingPrice - unitCost : 0;
  
  // Calculate both profit margin (% of selling price) and markup (% of cost)
  const profitMargin = actualSellingPrice > 0 ? ((profit / actualSellingPrice) * 100) : 0;
  const actualMarkup = unitCost > 0 && actualSellingPrice > 0 ? ((profit / unitCost) * 100) : 0;

  // Add ingredient
  const addIngredient = () => {
    if (!selectedMaterialId || !ingredientQuantity) return;
    
    const material = materials?.find(m => m.id === parseInt(selectedMaterialId));
    if (!material) return;

    const quantity = parseFloat(ingredientQuantity);
    const materialUnitCost = parseFloat(material.unitCost);
    const totalCost = quantity * materialUnitCost;

    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      materialId: material.id,
      materialName: material.name,
      unitCost: materialUnitCost,
      quantity,
      unit: material.unit,
      totalCost
    };

    setIngredients([...ingredients, newIngredient]);
    setSelectedMaterialId("");
    setIngredientQuantity("");
  };

  // Remove ingredient
  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  // Set form values when editing
  useEffect(() => {
    if (formulation) {
      form.reset({
        name: formulation.name,
        description: formulation.description || "",
        batchSize: formulation.batchSize,
        batchUnit: formulation.batchUnit,
        markupPercentage: formulation.markupPercentage || "30.00",
        isActive: formulation.isActive ?? true,
      });
      
      // Set selling price if it exists
      if (formulation.targetPrice) {
        setSellingPrice(formulation.targetPrice);
      }
      
      // Load existing ingredients
      const loadIngredients = async () => {
        try {
          const response = await fetch(`/api/formulations/${formulation.id}/ingredients`);
          if (response.ok) {
            const existingIngredients = await response.json();
            const formattedIngredients = existingIngredients.map((ing: any) => {
              const material = materials?.find(m => m.id === ing.materialId);
              return {
                id: ing.id.toString(),
                materialId: ing.materialId,
                materialName: material?.name || `Material ${ing.materialId}`,
                unitCost: parseFloat(material?.unitCost || "0"),
                quantity: parseFloat(ing.quantity),
                unit: ing.unit,
                totalCost: parseFloat(ing.costContribution),
              };
            });
            setIngredients(formattedIngredients);
          }
        } catch (error) {
          console.error("Failed to load ingredients:", error);
        }
      };
      
      if (materials && materials.length > 0) {
        loadIngredients();
      }
    } else {
      setIngredients([]);
    }
  }, [formulation, form, materials]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/formulations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      toast({ title: "Formulation created successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create formulation", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/formulations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      toast({ title: "Formulation updated successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update formulation", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    if (ingredients.length === 0) {
      toast({ title: "Please add at least one ingredient", variant: "destructive" });
      return;
    }

    const formulationData = {
      ...data,
      targetPrice: sellingPrice || undefined,
      totalCost: totalMaterialCost.toString(),
      unitCost: unitCost.toString(),
      profitMargin: profitMargin.toString(),
      ingredients: ingredients.map(ing => ({
        materialId: ing.materialId,
        quantity: ing.quantity.toString(),
        unit: ing.unit,
        costContribution: ing.totalCost.toString(),
        includeInMarkup: true,
      })),
    };

    console.log("Submitting formulation with ingredients:", formulationData);

    if (formulation) {
      updateMutation.mutate({ id: formulation.id, data: formulationData });
    } else {
      createMutation.mutate(formulationData);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formulation Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter formulation name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Describe your formulation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="batchSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Size</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.001" placeholder="1.000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batchUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                          <SelectItem value="pcs">pcs</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Ingredient */}
              <div className="grid grid-cols-4 gap-4 items-end">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-slate-700">Select Material</label>
                  <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials?.map((material) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name} (${material.unitCost}/{material.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Quantity</label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={ingredientQuantity}
                    onChange={(e) => setIngredientQuantity(e.target.value)}
                  />
                </div>
                <Button type="button" onClick={addIngredient} disabled={!selectedMaterialId || !ingredientQuantity}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Ingredients List */}
              {ingredients.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">Added Ingredients</div>
                  {ingredients.map((ingredient) => (
                    <div key={ingredient.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{ingredient.materialName}</div>
                        <div className="text-sm text-slate-600">
                          {ingredient.quantity} {ingredient.unit} × ${ingredient.unitCost.toFixed(4)} = ${ingredient.totalCost.toFixed(2)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIngredient(ingredient.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Calculations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Cost Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-slate-600">Total Material Cost</div>
                  <div className="text-2xl font-bold text-slate-900">${totalMaterialCost.toFixed(2)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-600">Cost per {form.watch("batchUnit") || "unit"}</div>
                  <div className="text-2xl font-bold text-slate-900">${unitCost.toFixed(4)}</div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="markupPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Markup Percentage (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="30.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-slate-600">Suggested Selling Price</div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    ${suggestedPrice.toFixed(2)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Your Selling Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                  />
                </div>
              </div>

              {actualSellingPrice > 0 && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="text-sm text-green-600">Profit per {form.watch("batchUnit") || "unit"}</div>
                    <div className="text-xl font-bold text-green-700">${profit.toFixed(2)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-green-600">Profit Margin</div>
                    <div className="text-lg font-bold text-green-700">{profitMargin.toFixed(1)}%</div>
                    <div className="text-xs text-green-600">% of selling price</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-green-600">Markup</div>
                    <div className="text-lg font-bold text-green-700">{actualMarkup.toFixed(1)}%</div>
                    <div className="text-xs text-green-600">% of cost</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending || ingredients.length === 0}
            >
              {formulation ? 'Update' : 'Create'} Formulation
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
