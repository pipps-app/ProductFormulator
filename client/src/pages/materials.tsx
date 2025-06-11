import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";
import MaterialList from "@/components/materials/material-list";
import MaterialForm from "@/components/materials/material-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMaterials } from "@/hooks/use-materials";

export default function Materials() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: materials, isLoading, refetch } = useMaterials();

  const filteredMaterials = materials?.filter(material =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (material: any) => {
    setEditingMaterial(material);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingMaterial(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Raw Materials</h2>
          <p className="text-slate-600 mt-1">Manage your materials and material costs</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Materials List */}
      <Card>
        <CardHeader>
          <CardTitle>Materials Library</CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialList 
            materials={filteredMaterials}
            isLoading={isLoading}
            onEdit={handleEdit}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Material Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </DialogTitle>
          </DialogHeader>
          <MaterialForm 
            material={editingMaterial}
            onSuccess={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
