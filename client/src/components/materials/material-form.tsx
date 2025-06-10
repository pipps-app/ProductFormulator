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
    onError: () => {
      toast({ title: "Failed to create material", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/raw-materials/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/material-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
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
