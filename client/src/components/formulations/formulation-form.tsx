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
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
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
  const [materialSearch, setMaterialSearch] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [isSelectOpen, setIsSelectOpen] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Helper function to filter materials
  const getFilteredMaterials = () => {
    const sorted = (materials || []).slice().sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
    const q = materialSearch.trim().toLowerCase();
    return q
      ? sorted.filter((m) =>
          (m.name || '').toLowerCase().includes(q) ||
          (String(m.unitCost) || '').toLowerCase().includes(q) ||
          (m.unit || '').toLowerCase().includes(q)
        )
      : sorted;
  };

  // Track changes for confirmation dialog
  const checkForChanges = () => {
    const formName = form.getValues("name");
    const formDesc = form.getValues("description");
    return !!(formName || formDesc || ingredients.length > 0 || sellingPrice);
  };

  // Confirmation dialog helper
  const handleExitWithConfirmation = (callback: () => void) => {
    if (checkForChanges()) {
      if (window.confirm("You have unsaved changes. Are you sure you want to exit without saving?")) {
        callback();
      }
    } else {
      callback();
    }
  };

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
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Omit<Formulation, "id"> }) => {
      const response = await apiRequest("PUT", `/api/formulations/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
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

  // Enrich ingredients with material names and costs when materials data is available
  useEffect(() => {
    if (materials && materials.length > 0 && ingredients.length > 0) {
      setIngredients(currentIngredients => 
        currentIngredients.map(ingredient => {
          const material = materials.find(m => m.id === ingredient.materialId);
          if (material) {
            const materialUnitCost = parseFloat(material.unitCost);
            const quantity = parseFloat(ingredient.quantity?.toString() || '0');
            const calculatedTotalCost = !isNaN(materialUnitCost) && !isNaN(quantity) 
              ? quantity * materialUnitCost 
              : 0;
              
            return {
              ...ingredient,
              materialName: ingredient.materialName || material.name,
              unitCost: !isNaN(materialUnitCost) ? materialUnitCost : (ingredient.unitCost || 0),
              totalCost: calculatedTotalCost || (ingredient.totalCost || 0)
            };
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

  const generateIngredientsPDF = () => {
    const doc = new jsPDF();
    const formName = form.getValues("name") || "Untitled Formulation";
    const formDescription = form.getValues("description") || "";
    const batchSizeValue = form.getValues("batchSize") || "1";
    const batchUnitValue = form.getValues("batchUnit") || "unit";

    // Header
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("INGREDIENTS LIST", 105, 20, { align: "center" });
    
    // Formulation details
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(`${formName}`, 105, 30, { align: "center" });
    
    // Adjusted timestamp placement
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 40, { align: "center" });

    // Prepare table data
    const tableData = ingredients.map((ingredient, index) => {
      const percentage = totalMaterialCost > 0 ? ((ingredient.totalCost / totalMaterialCost) * 100) : 0;
      return [
        (index + 1).toString(),
        ingredient.materialName || '',
        `${ingredient.quantity}`,
        ingredient.unit || '',
        `$${(ingredient.unitCost || 0).toFixed(4)}`,
        `$${(ingredient.totalCost || 0).toFixed(2)}`,
        `${percentage.toFixed(1)}%`,
        ingredient.includeInMarkup ? 'Yes' : 'No'
      ];
    });

    // Table
    autoTable(doc, {
      startY: formDescription ? 90 : 80,
      head: [['#', 'Ingredient Name', 'Quantity', 'Unit', 'Unit Cost', 'Total Cost', '% of Formula', 'In Markup']],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [71, 85, 105], // slate-600
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' }, // #
        1: { cellWidth: 45 }, // Ingredient Name
        2: { cellWidth: 20, halign: 'right' }, // Quantity
        3: { cellWidth: 15, halign: 'center' }, // Unit
        4: { cellWidth: 25, halign: 'right' }, // Unit Cost
        5: { cellWidth: 25, halign: 'right' }, // Total Cost
        6: { cellWidth: 20, halign: 'right' }, // % of Formula
        7: { cellWidth: 20, halign: 'center' }, // In Markup
      },
    });

    // Summary section
    const finalY = ((doc as any).lastAutoTable?.finalY || (formDescription ? 200 : 180)) + 20;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", 20, finalY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const markupIncluded = ingredients.filter(ing => ing.includeInMarkup).length;
    const markupExcluded = ingredients.filter(ing => !ing.includeInMarkup).length;
    
    doc.text(`Total Ingredients: ${ingredients.length}`, 20, finalY + 15);
    doc.text(`Materials in Markup: ${markupIncluded}`, 20, finalY + 25);
    doc.text(`Materials Excluded: ${markupExcluded}`, 20, finalY + 35);
    doc.text(`Markup Eligible Cost: $${markupEligibleCost.toFixed(2)}`, 20, finalY + 45);
    doc.text(`Cost per Unit: $${unitCost.toFixed(4)}`, 20, finalY + 55);

    // Footer message
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Powered by PIPPS Smart Apps by J.C Epiphany", 105, pageHeight - 10, { align: "center" });

    // Save the PDF
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');

    toast({ 
      title: "PDF Generated", 
      description: `Ingredients list opened in a new tab.`,
    });
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
          // Close the modal and return to the formulations list
          onSuccess();
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
        <form 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="space-y-6"
          onKeyDown={(e) => {
            // Prevent accidental form submission on Enter
            if (e.key === 'Enter' && e.target !== e.currentTarget) {
              // Allow Enter in specific cases (like the search input handling above)
              if (!e.defaultPrevented) {
                e.preventDefault();
              }
            }
          }}
        >
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
                  <CardTitle className="flex items-center justify-between">
                    <span className="inline-flex items-center">
                      Ingredients
                      <span className="ml-2 inline-flex items-center text-xs font-semibold bg-slate-200 text-slate-700 rounded px-2 py-0.5">
                        {ingredients.length}
                      </span>
                    </span>
                    {ingredients.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateIngredientsPDF}
                        className="text-blue-600 hover:text-blue-800 border-blue-200 hover:bg-blue-50"
                      >
                        Export PDF
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Ingredient */}
                  <div className="grid grid-cols-4 gap-4 items-end">
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-slate-700">Select Material</label>
                      {/* Custom autocomplete implementation */}
                      <div className="relative">
                        <Input
                          placeholder="Search materials..."
                          value={materialSearch}
                          onChange={(e) => {
                            setMaterialSearch(e.target.value);
                            setIsSelectOpen(e.target.value.length > 0);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              // Find first match and select it
                              const filtered = getFilteredMaterials();
                              if (filtered.length > 0) {
                                setSelectedMaterialId(filtered[0].id.toString());
                                setMaterialSearch("");
                                setIsSelectOpen(false);
                              }
                            } else if (e.key === 'Escape') {
                              setIsSelectOpen(false);
                            }
                          }}
                          onFocus={() => {
                            if (materialSearch) {
                              setIsSelectOpen(true);
                            }
                          }}
                          className="w-full"
                          autoComplete="off"
                        />
                        
                        {/* Custom dropdown */}
                        {isSelectOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {(() => {
                              const filtered = getFilteredMaterials();
                              
                              if (filtered.length === 0) {
                                return (
                                  <div className="px-3 py-2 text-gray-500 text-sm">
                                    No materials found
                                  </div>
                                );
                              }

                              return filtered.map((material) => (
                                <div
                                  key={material.id}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                  onClick={() => {
                                    setSelectedMaterialId(material.id.toString());
                                    setMaterialSearch("");
                                    setIsSelectOpen(false);
                                  }}
                                >
                                  <div className="font-medium">{material.name}</div>
                                  <div className="text-gray-600 text-xs">
                                    ${material.unitCost}/{material.unit}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                        
                        {/* Click outside to close */}
                        {isSelectOpen && (
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsSelectOpen(false)}
                          />
                        )}
                        
                        {/* Selected material display */}
                        {selectedMaterialId && (
                          <div className="mt-2 p-2 bg-blue-50 rounded border text-sm">
                            <span className="font-medium">Selected: </span>
                            {(() => {
                              const selected = materials?.find(m => m.id.toString() === selectedMaterialId);
                              return selected ? `${selected.name} ($${selected.unitCost}/${selected.unit})` : 'Unknown material';
                            })()}
                            <button
                              type="button"
                              onClick={() => setSelectedMaterialId('')}
                              className="ml-2 text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
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
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      <div className="text-sm font-medium text-slate-700 sticky top-0 bg-white py-2 border-b border-slate-200">
                        Added Ingredients ({ingredients.length}) • Total: ${totalMaterialCost.toFixed(2)}
                      </div>
                      <div className="space-y-1">
                        {ingredients.map((ingredient, index) => (
                          <div
                            key={ingredient.id}
                            className={`flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-slate-50 ${
                              editingIngredientId === ingredient.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200'
                            }`}
                            onClick={() => {
                              setEditingIngredientId(ingredient.id);
                              setSelectedMaterialId(ingredient.materialId.toString());
                              setIngredientQuantity(ingredient.quantity.toString());
                            }}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <span className="text-sm text-slate-500 font-medium w-6">{index + 1}.</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-slate-900 truncate">{ingredient.materialName}</span>
                                  {!ingredient.includeInMarkup && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200">
                                      Excluded
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-slate-600">
                                  {ingredient.quantity} {ingredient.unit} @ ${(ingredient.unitCost || 0).toFixed(4)}/{ingredient.unit}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="font-semibold text-green-600">${(ingredient.totalCost || 0).toFixed(2)}</div>
                                <div className="text-xs text-slate-500">
                                  {totalMaterialCost > 0 ? ((ingredient.totalCost / totalMaterialCost * 100).toFixed(1)) : '0'}%
                                </div>
                              </div>
                              <Checkbox
                                checked={ingredient.includeInMarkup}
                                onCheckedChange={() => toggleIncludeInMarkup(ingredient.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); removeIngredient(ingredient.id); }}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
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
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleExitWithConfirmation(onSuccess)}
            >
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
