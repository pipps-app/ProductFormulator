import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVendorSchema, type Vendor } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ConfirmationModal from "@/components/common/confirmation-modal";

export default function Vendors() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendors, isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/vendors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Vendor created successfully" });
      handleCloseModal();
    },
    onError: () => {
      toast({ title: "Failed to create vendor", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/vendors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Vendor updated successfully" });
      handleCloseModal();
    },
    onError: () => {
      toast({ title: "Failed to update vendor", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Vendor deleted successfully" });
      setDeletingVendor(null);
    },
    onError: () => {
      toast({ title: "Failed to delete vendor", variant: "destructive" });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertVendorSchema.omit({ userId: true })),
    defaultValues: {
      name: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      notes: "",
    },
  });

  const filteredVendors = vendors?.filter(vendor =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    form.reset({
      name: vendor.name,
      contactEmail: vendor.contactEmail || "",
      contactPhone: vendor.contactPhone || "",
      address: vendor.address || "",
      notes: vendor.notes || "",
    });
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingVendor(null);
    form.reset();
  };

  const onSubmit = (data: any) => {
    if (editingVendor) {
      updateMutation.mutate({ id: editingVendor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (vendor: Vendor) => {
    setDeletingVendor(vendor);
  };

  const confirmDelete = () => {
    if (deletingVendor) {
      deleteMutation.mutate(deletingVendor.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Vendors</h2>
          <p className="text-slate-600 mt-1">Manage your supplier relationships</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredVendors.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-500">No vendors found</p>
          </div>
        ) : (
          filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{vendor.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(vendor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(vendor)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {vendor.contactEmail && (
                    <p className="text-slate-600">{vendor.contactEmail}</p>
                  )}
                  {vendor.contactPhone && (
                    <p className="text-slate-600">{vendor.contactPhone}</p>
                  )}
                  {vendor.address && (
                    <p className="text-slate-500 text-xs">{vendor.address}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Vendor Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter vendor name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="contact@vendor.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+1 (555) 123-4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Vendor address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Additional notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingVendor ? 'Update' : 'Create'} Vendor
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingVendor}
        onClose={() => setDeletingVendor(null)}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        description={`Are you sure you want to delete "${deletingVendor?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
