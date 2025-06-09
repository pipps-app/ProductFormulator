export interface DashboardStats {
  totalMaterials: number;
  activeFormulations: number;
  vendorsCount: number;
  avgProfitMargin: string;
  inventoryValue: string;
}

export interface FormulationWithIngredients {
  id: number;
  name: string;
  description?: string;
  batchSize: string;
  batchUnit: string;
  targetPrice?: string;
  markupPercentage: string;
  totalCost: string;
  unitCost: string;
  profitMargin: string;
  isActive: boolean;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  ingredients?: FormulationIngredientWithDetails[];
}

export interface FormulationIngredientWithDetails {
  id: number;
  formulationId: number;
  materialId?: number;
  subFormulationId?: number;
  quantity: string;
  unit: string;
  costContribution: string;
  includeInMarkup: boolean;
  notes?: string;
  material?: {
    id: number;
    name: string;
    unitCost: string;
    unit: string;
  };
  subFormulation?: {
    id: number;
    name: string;
    unitCost: string;
    batchUnit: string;
  };
}

export interface MaterialWithDetails {
  id: number;
  name: string;
  sku?: string;
  categoryId?: number;
  vendorId?: number;
  totalCost: string;
  quantity: string;
  unit: string;
  unitCost: string;
  notes?: string;
  isActive: boolean;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: number;
    name: string;
    color: string;
  };
  vendor?: {
    id: number;
    name: string;
    contactEmail?: string;
  };
  files?: MaterialFileInfo[];
}

export interface MaterialFileInfo {
  id: number;
  materialId: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface ImportData {
  materials?: any[];
  formulations?: any[];
  vendors?: any[];
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  includeFiles?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface CostCalculation {
  totalMaterialCost: number;
  totalCost: number;
  unitCost: number;
  profitMargin: number;
  sellingPrice: number;
  markupAmount: number;
}

export interface StockAlert {
  materialId: number;
  materialName: string;
  currentStock: number;
  unit: string;
  threshold: number;
  severity: 'low' | 'critical';
}

export interface AuditLogEntry {
  id: number;
  userId: number;
  action: 'create' | 'update' | 'delete';
  entityType: 'material' | 'formulation' | 'vendor';
  entityId: number;
  changes?: string;
  timestamp: Date;
}

export interface UserPreferences {
  defaultUnit: string;
  defaultMarkup: number;
  lowStockThreshold: number;
  currency: string;
  notifications: {
    lowStock: boolean;
    costChanges: boolean;
    formulationUpdates: boolean;
  };
}
