import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertFormulationSchema, type Formulation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface FormulationFormProps {
  formulation?: Formulation | null;
  onSuccess: () => void;
}

export default function FormulationForm({ formulation, onSuccess }: FormulationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertFormulationSchema.omit({ userId: true })),
    defaultValues: {
      name: "",
      description: "",
      batchSize: "",
      batchUnit: "kg",
      targetPrice: "",
      markupPercentage: "30.00",
      isActive: true,
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (formulation) {
      form.reset({
        name: formulation.name,
        description: formulation.description || "",
        batchSize: formulation.batchSize,
        batchUnit: formulation.batchUnit,
        targetPrice: formulation.targetPrice || "",
        markupPercentage: formulation.markupPercentage || "30.00",
        isActive: formulation.isActive,
      });
    }
  }, [formulation, form]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/formulations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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
      toast({ title: "Formulation updated successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update formulation", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    if (formulation) {
      updateMutation.mutate({ id: formulation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="targetPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Price ($) (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {formulation ? 'Update' : 'Create'} Formulation
          </Button>
        </div>
      </form>
    </Form>
  );
}
