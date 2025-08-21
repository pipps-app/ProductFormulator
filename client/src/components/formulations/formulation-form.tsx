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
import { Checkbox } from "@/components/ui/checkbox";
import { insertFormulationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMaterials } from "@/hooks/use-materials";
import { useEffect, useState } from "react";
import { Plus, X, Calculator } from "lucide-react";
import FileAttachments from "@/components/files/file-attachments";
import { useLocation } from "wouter";
import { useAppDispatch } from "@/store/hooks";
import { addFormulation, updateFormulation, Formulation, Ingredient } from "@/store/formulationsSlice";

interface FormulationFormProps {
  formulation?: Formulation | null;
  onSuccess: () => void;
}

export default function FormulationForm({ formulation, onSuccess }: FormulationFormProps) {
  const { toast } = useToast();
  const { data: materials } = useMaterials();
  const [, setLocation] = useLocation();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [ingredientQuantity, setIngredientQuantity] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [unitCost, setUnitCost] = useState<number>(0);

  const form = useForm({
    resolver: zodResolver(insertFormulationSchema.omit({ userId: true })),
    defaultValues: {
      name: "",
      description: "",
      batchSize: "1",
      batchUnit: "unit",
      markupPercentage: "30.00",
      isActive: true,
    },
  });

  // Cost calculations
  const totalMaterialCost = ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
  const markupEligibleCost = ingredients.reduce((sum, ing) =>
    ing.includeInMarkup ? sum + ing.totalCost : sum, 0);
  const batchSize = parseFloat(form.watch("batchSize") || "1");
  const markupPercentage = parseFloat(form.watch("markupPercentage") || "30");
  const suggestedPrice = markupEligibleCost * (1 + markupPercentage / 100);
  const actualSellingPrice = parseFloat(sellingPrice || "0");
  const profit = actualSellingPrice > 0 ? actualSellingPrice - markupEligibleCost : 0;
  const profitMargin = actualSellingPrice > 0 ? ((profit / actualSellingPrice) * 100) : 0;
  // Add suggestedMargin calculation
  const suggestedMargin = suggestedPrice > 0 ? ((suggestedPrice - totalMaterialCost) / suggestedPrice) * 100 : 0;
  // Add calculation for enteredMargin and actualMarkup
  const enteredMargin = actualSellingPrice > 0 ? ((actualSellingPrice - totalMaterialCost) / actualSellingPrice) * 100 : 0;
  const actualMarkup = totalMaterialCost > 0 ? ((actualSellingPrice - totalMaterialCost) / totalMaterialCost) * 100 : 0;

  useEffect(() => {
    setUnitCost(batchSize > 0 ? totalMaterialCost / batchSize : 0);
  }, [totalMaterialCost, batchSize]);

  // --- React Query Mutations ---
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Formulation, "id">) => {
      const response = await apiRequest("POST", "/api/formulations", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulations"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Omit<Formulation, "id"> }) => {
      const response = await apiRequest("PUT", `/api/formulations/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulations"] });
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (formulation) {
      form.reset({
        name: formulation.name,
        description: formulation.description || "",
        batchSize: String(formulation.batchSize ?? "1"),
        batchUnit: formulation.batchUnit || "unit",
        markupPercentage: String(formulation.markupPercentage ?? "30.00"),
        isActive: formulation.isActive ?? true,
      });
      setSellingPrice(formulation.targetPrice !== undefined && formulation.targetPrice !== null ? String(formulation.targetPrice) : "");
      setIngredients(formulation.ingredients || []);
    } else {
      form.reset({
        name: "",
        description: "",
        batchSize: "1",
        batchUnit: "unit",
        markupPercentage: "30.00",
        isActive: true,
      });
      setSellingPrice("");
      setIngredients([]);
      setSelectedMaterialId("");
      setIngredientQuantity("");
      setEditingIngredientId(null);
    }
  }, [formulation, form.reset]);

  // Enrich ingredients with material names when materials data is available
  useEffect(() => {
    if (materials && materials.length > 0 && ingredients.length > 0) {
      setIngredients(currentIngredients => 
        currentIngredients.map(ingredient => {
          // Only update if materialName is missing
          if (!ingredient.materialName) {
            const material = materials.find(m => m.id === ingredient.materialId);
            if (material) {
              return {
                ...ingredient,
                materialName: material.name
              };
            }
          }
          return ingredient;
        })
      );
    }
  }, [materials, ingredients.length]); // Only run when materials change or ingredients are first loaded

  // Add or update ingredient
  const addIngredient = () => {
    if (!selectedMaterialId || !ingredientQuantity) return;
    
    const material = materials?.find(m => m.id === parseInt(selectedMaterialId));
    if (!material) {
      toast({
        title: "Material not found",
        description: "The selected material could not be found. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }
    
    const quantity = parseFloat(ingredientQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity greater than 0.",
        variant: "destructive"
      });
      return;
    }
    
    const materialUnitCost = parseFloat(material.unitCost);
    if (isNaN(materialUnitCost)) {
      toast({
        title: "Invalid material cost",
        description: `The material "${material.name}" has an invalid unit cost. Please update the material first.`,
        variant: "destructive"
      });
      return;
    }
    
    const totalCost = quantity * materialUnitCost;
    if (editingIngredientId) {
      setIngredients(ingredients.map(ing =>
        ing.id === editingIngredientId
          ? {
              ...ing,
              materialId: material.id,
              materialName: material.name,
              unitCost: materialUnitCost,
              quantity,
              unit: material.unit,
              totalCost,
            }
          : ing
      ));
      setEditingIngredientId(null);
    } else {
      const newIngredient: Ingredient = {
        id: Date.now().toString(),
        materialId: material.id,
        materialName: material.name,
        unitCost: materialUnitCost,
        quantity,
        unit: material.unit,
        totalCost,
        includeInMarkup: true
      };
      setIngredients([...ingredients, newIngredient]);
    }
    setSelectedMaterialId("");
    setIngredientQuantity("");
  };

  // Remove ingredient
  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  // Toggle include in markup
  const toggleIncludeInMarkup = (id: string) => {
    setIngredients(ingredients.map(ing =>
      ing.id === id
        ? { ...ing, includeInMarkup: !ing.includeInMarkup }
        : ing
    ));
    setTimeout(() => {
      const currentMarkup = form.getValues("markupPercentage");
      form.setValue("markupPercentage", currentMarkup);
    }, 0);
  };

  // --- Improved onSubmit handler ---
  const onSubmit = (data: Omit<Formulation, "id" | "ingredients">) => {
    // Validation checks
    if (ingredients.length === 0) {
      toast({ title: "Please add at least one ingredient", variant: "destructive" });
      return;
    }

    // Validate all ingredients have valid materials
    const invalidIngredients = ingredients.filter(ing => !ing.materialId || ing.materialId <= 0);
    if (invalidIngredients.length > 0) {
      toast({ 
        title: "Invalid ingredients detected", 
        description: "Please check all ingredients have valid materials selected.",
        variant: "destructive" 
      });
      return;
    }

    // Validate batch size is positive
    const batchSize = parseFloat(data.batchSize);
    if (isNaN(batchSize) || batchSize <= 0) {
      toast({ 
        title: "Invalid batch size", 
        description: "Batch size must be a positive number.",
        variant: "destructive" 
      });
      return;
    }

    // Prepare payload
    const payload = {
      ...data,
      batchSize: parseFloat(data.batchSize),
      markupPercentage: parseFloat(data.markupPercentage),
      targetPrice: sellingPrice ? parseFloat(sellingPrice) : undefined,
      ingredients: ingredients.map(ing => ({
        materialId: ing.materialId,
        quantity: parseFloat(ing.quantity.toString()),
        includeInMarkup: ing.includeInMarkup,
      })),
    };

    console.log("=== CLIENT FORMULATION SUBMIT DEBUG ===");
    console.log("Form data:", JSON.stringify(data, null, 2));
    console.log("Ingredients:", JSON.stringify(ingredients, null, 2));
    console.log("Final payload:", JSON.stringify(payload, null, 2));

    // Mutations
    if (formulation) {
      console.log("Updating formulation:", payload);
      updateMutation.mutate(
        { id: formulation.id, data: payload },
        {
          onSuccess: (updatedFormulation: Formulation) => {
            dispatch(updateFormulation(updatedFormulation));
            toast({ title: "Formulation updated successfully" });
            onSuccess();
          },
          onError: (error: any) => {
            console.error("Update formulation error:", error);
            const errorMessage =
              error?.response?.data?.error ||
              error?.message ||
              "Failed to update formulation";
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
          },
        }
      );
    } else {
      console.log("Creating formulation:", payload);
      createMutation.mutate(payload, {
        onSuccess: (newFormulation: Formulation) => {
          dispatch(addFormulation(newFormulation));
          toast({ title: "Formulation created successfully" });
          // Navigate to the detail page so user can see the file attachments
          if (newFormulation?.id) {
            setLocation(`/formulations/${newFormulation.id}`);
          } else {
            onSuccess();
          }
        },
        onError: (error: any) => {
          console.error("Create formulation error:", error);
          let errorMessage = "Failed to create formulation";
          
          // Extract more specific error messages
          if (error?.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error?.message) {
            errorMessage = error.message;
          }
          
          // Handle specific error types
          if (errorMessage.includes("ingredient")) {
            errorMessage = "There was an issue with one of your ingredients. Please check all ingredient data.";
          } else if (errorMessage.includes("material")) {
            errorMessage = "One or more materials in your formulation couldn't be found. Please refresh and try again.";
          }
          
          toast({ 
            title: "Error", 
            description: errorMessage, 
            variant: "destructive" 
          });
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Live-updating formulation title at the top */}
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
        {form.watch("name") || "Untitled Formulation"}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Basic Info & Ingredients */}
            <div className="space-y-6">
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
                            <Input
                              {...field}
                              type="number"
                              step="0.001"
                              placeholder="1000"
                            />
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
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unit">unit</SelectItem>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="lbs">lbs</SelectItem>
                                <SelectItem value="g">g</SelectItem>
                                <SelectItem value="oz">oz</SelectItem>
                                <SelectItem value="liters">liters</SelectItem>
                                <SelectItem value="ml">ml</SelectItem>
                                <SelectItem value="pieces">pieces</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
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
                  <CardTitle>
                    <span className="inline-flex items-center">
                      Ingredients
                      <span className="ml-2 inline-flex items-center text-xs font-semibold bg-slate-200 text-slate-700 rounded px-2 py-0.5">
                        {ingredients.length}
                      </span>
                    </span>
                  </CardTitle>
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addIngredient();
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        addIngredient();
                      }}
                      disabled={!selectedMaterialId || !ingredientQuantity}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {/* Ingredients List */}
                  {ingredients.length > 0 && (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                      <div className="text-sm font-medium text-slate-700">Added Ingredients</div>
                      {(ingredients.slice().sort((a, b) => (a.materialName || '').localeCompare(b.materialName || ''))).map((ingredient, idx) => (
                        <div
                          key={ingredient.id}
                          className={`flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 ${editingIngredientId === ingredient.id ? 'ring-2 ring-blue-400' : ''}`}
                          onClick={() => {
                            setEditingIngredientId(ingredient.id);
                            setSelectedMaterialId(ingredient.materialId.toString());
                            setIngredientQuantity(ingredient.quantity.toString());
                          }}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {/* Numbering */}
                            <span className="w-6 text-right text-slate-500 font-semibold select-none">{idx + 1}.</span>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={ingredient.includeInMarkup}
                                onCheckedChange={() => toggleIncludeInMarkup(ingredient.id)}
                              />
                              <span className="text-xs text-slate-600">Include in markup</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-slate-900">{ingredient.materialName}</div>
                              <div className="text-sm text-slate-600">
                                {ingredient.quantity} {ingredient.unit} × ${ingredient.unitCost.toFixed(4)} = ${ingredient.totalCost.toFixed(2)}
                                {!ingredient.includeInMarkup && (
                                  <Badge variant="secondary" className="ml-2 text-xs">Excluded from markup</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={e => { e.stopPropagation(); removeIngredient(ingredient.id); }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Cost Analysis & File Attachments */}
            <div className="space-y-6">
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
                      {markupEligibleCost !== totalMaterialCost && (
                        <div className="text-sm text-amber-600">
                          Markup eligible: ${markupEligibleCost.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-slate-600">Cost per unit</div>
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

                  {/* Profit Margins */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-slate-600">Suggested Margin</div>
                      <div className="text-lg font-bold text-blue-700">{suggestedMargin.toFixed(2)}%</div>
                    </div>
                    {actualSellingPrice > 0 && (
                      <div className="space-y-1">
                        <div className="text-sm text-slate-600">Entered Margin</div>
                        <div className="text-lg font-bold text-green-700">{enteredMargin.toFixed(2)}%</div>
                      </div>
                    )}
                  </div>

                  {actualSellingPrice > 0 && (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                      <div className="space-y-2">
                        <div className="text-sm text-green-600">Profit per unit</div>
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
              {/* File Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle>File Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 bg-gray-50">
                      {formulation?.id ? (
                        <FileAttachments
                          entityType="formulation"
                          entityId={formulation.id}
                          entityName={formulation.name}
                        />
                      ) : (
                        <div className="text-sm text-gray-600 text-center py-4">
                          Files can be attached after creating the formulation
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Actions always visible */}
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
