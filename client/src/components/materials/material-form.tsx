import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertRawMaterialSchema, type RawMaterial, type Vendor, type MaterialCategory } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import FileAttachments from "@/components/files/file-attachments";

interface MaterialFormProps {
  material?: RawMaterial | null;
  onSuccess: () => void;
}

export default function MaterialForm({ material, onSuccess }: MaterialFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: categories } = useQuery<MaterialCategory[]>({
    queryKey: ["/api/material-categories"],
  });

  type FormData = {
    name: string;
    sku?: string;
    categoryId?: number | null;
    vendorId?: number | null;
    totalCost: string;
    quantity: string;
    unit: string;
    notes?: string;
    isActive?: boolean;
  };

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      sku: "",
      categoryId: null,
      vendorId: null,
      totalCost: "",
      quantity: "",
      unit: "kg",
      notes: "",
      isActive: true,
    },
  });

  // Calculate unit cost when total cost or quantity changes
  const totalCost = form.watch("totalCost");
  const quantity = form.watch("quantity");

  useEffect(() => {
    if (totalCost && quantity && Number(totalCost) > 0 && Number(quantity) > 0) {
      const unitCost = Number(totalCost) / Number(quantity);
      // Display unit cost (not part of form since it's calculated)
    }
  }, [totalCost, quantity]);

  // Set form values when editing
  useEffect(() => {
    if (material) {
      form.reset({
        name: material.name,
        sku: material.sku || "",
        categoryId: material.categoryId ?? null,
        vendorId: material.vendorId ?? null,
        totalCost: material.totalCost,
        quantity: material.quantity,
        unit: material.unit,
        notes: material.notes || "",
        isActive: material.isActive ?? true,
      });
    }
  }, [material, form]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/raw-materials", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Material created successfully" });
      onSuccess();
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Failed to create material';
      if (errorMessage.includes('403') && errorMessage.includes('Plan limit')) {
        const match = errorMessage.match(/Plan limit reached.*?Upgrade to add more/);
        const friendlyMessage = match ? match[0] : 'You\'ve reached your plan limit for materials. Upgrade to add more.';
        
        toast({ 
          title: "Plan Limit Reached", 
          description: friendlyMessage,
          variant: "destructive",
          action: (
            <button 
              onClick={() => window.location.href = '/subscription'}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Upgrade Plan
            </button>
          )
        });
      } else {
        toast({ title: "Failed to create material", variant: "destructive" });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/raw-materials/${id}`, data),
    onSuccess: () => {
      // Invalidate all related caches when material is updated
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/material-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      // Also invalidate any formulation ingredients queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.includes('/api/formulations') && key?.includes('/ingredients');
        }
      });
      toast({ title: "Material updated successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update material", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    if (material) {
      updateMutation.mutate({ id: material.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const unitCost = totalCost && quantity && Number(totalCost) > 0 && Number(quantity) > 0 
    ? (Number(totalCost) / Number(quantity)).toFixed(4)
    : "0.0000";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter material name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter SKU" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={(value) => field.onChange(value ? Number(value) : null)} value={field.value?.toString() || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor</FormLabel>
                <Select onValueChange={(value) => field.onChange(value ? Number(value) : null)} value={field.value?.toString() || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vendors?.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="totalCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Cost ($)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.001" placeholder="0.000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
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

        {totalCost && quantity && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              Unit Cost: <span className="font-medium">${unitCost}/{form.watch("unit")}</span>
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Additional notes about this material" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormLabel>File Attachments (Optional)</FormLabel>
          <div className="border rounded-lg p-4 bg-gray-50">
            {material?.id ? (
              <FileAttachments
                entityType="material"
                entityId={material.id}
                entityName={material.name}
              />
            ) : (
              <div className="text-sm text-gray-600 text-center py-4">
                <p className="font-medium mb-1">Files can be attached after creating the material</p>
                <p className="text-xs">Attach specifications, certificates, safety data sheets, or product images</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {material ? 'Update' : 'Create'} Material
          </Button>
        </div>
      </form>
    </Form>
  );
}
