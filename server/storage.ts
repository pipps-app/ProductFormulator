import { 
  users, vendors, materialCategories, rawMaterials, formulations, 
  formulationIngredients, materialFiles, auditLog,
  type User, type InsertUser, type Vendor, type InsertVendor,
  type MaterialCategory, type InsertMaterialCategory,
  type RawMaterial, type InsertRawMaterial,
  type Formulation, type InsertFormulation,
  type FormulationIngredient, type InsertFormulationIngredient,
  type MaterialFile, type InsertMaterialFile,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Vendors
  getVendors(userId: number): Promise<Vendor[]>;
  getVendor(id: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: number): Promise<boolean>;

  // Material Categories
  getMaterialCategories(userId: number): Promise<MaterialCategory[]>;
  createMaterialCategory(category: InsertMaterialCategory): Promise<MaterialCategory>;
  updateMaterialCategory(id: number, category: Partial<InsertMaterialCategory>): Promise<MaterialCategory | undefined>;
  deleteMaterialCategory(id: number): Promise<boolean>;

  // Raw Materials
  getRawMaterials(userId: number): Promise<RawMaterial[]>;
  getRawMaterial(id: number): Promise<RawMaterial | undefined>;
  createRawMaterial(material: InsertRawMaterial): Promise<RawMaterial>;
  updateRawMaterial(id: number, material: Partial<InsertRawMaterial>): Promise<RawMaterial | undefined>;
  deleteRawMaterial(id: number): Promise<boolean>;

  // Formulations
  getFormulations(userId: number): Promise<Formulation[]>;
  getFormulation(id: number): Promise<Formulation | undefined>;
  createFormulation(formulation: InsertFormulation): Promise<Formulation>;
  updateFormulation(id: number, formulation: Partial<InsertFormulation>): Promise<Formulation | undefined>;
  deleteFormulation(id: number): Promise<boolean>;

  // Formulation Ingredients
  getFormulationIngredients(formulationId: number): Promise<FormulationIngredient[]>;
  createFormulationIngredient(ingredient: InsertFormulationIngredient): Promise<FormulationIngredient>;
  updateFormulationIngredient(id: number, ingredient: Partial<InsertFormulationIngredient>): Promise<FormulationIngredient | undefined>;
  deleteFormulationIngredient(id: number): Promise<boolean>;

  // Material Files
  getMaterialFiles(materialId: number): Promise<MaterialFile[]>;
  createMaterialFile(file: InsertMaterialFile): Promise<MaterialFile>;
  deleteMaterialFile(id: number): Promise<boolean>;

  // Audit Log
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(userId: number, limit?: number): Promise<AuditLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private vendors: Map<number, Vendor> = new Map();
  private materialCategories: Map<number, MaterialCategory> = new Map();
  private rawMaterials: Map<number, RawMaterial> = new Map();
  private formulations: Map<number, Formulation> = new Map();
  private formulationIngredients: Map<number, FormulationIngredient> = new Map();
  private materialFiles: Map<number, MaterialFile> = new Map();
  private auditLogs: Map<number, AuditLog> = new Map();
  
  private currentUserId = 1;
  private currentVendorId = 1;
  private currentCategoryId = 1;
  private currentMaterialId = 1;
  private currentFormulationId = 1;
  private currentIngredientId = 1;
  private currentFileId = 1;
  private currentAuditId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default user
    const defaultUser: User = {
      id: this.currentUserId++,
      username: "demo",
      email: "demo@example.com",
      password: "password",
      company: "Artisan Soap Co.",
      role: "admin",
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create default categories
    const categories = [
      { name: "Base Oils", color: "#3b82f6" },
      { name: "Essential Oils", color: "#8b5cf6" },
      { name: "Butters", color: "#10b981" },
      { name: "Waxes", color: "#f59e0b" },
      { name: "Additives", color: "#ef4444" },
    ];

    categories.forEach(cat => {
      const category: MaterialCategory = {
        id: this.currentCategoryId++,
        ...cat,
        userId: defaultUser.id,
      };
      this.materialCategories.set(category.id, category);
    });

    // Create default vendors
    const defaultVendors = [
      { name: "Natural Supplies Co.", contactEmail: "orders@naturalsupplies.com" },
      { name: "Aromatherapy Plus", contactEmail: "sales@aromatherapyplus.com" },
      { name: "Essential Elements", contactEmail: "info@essentialelements.com" },
    ];

    defaultVendors.forEach(vendor => {
      const newVendor: Vendor = {
        id: this.currentVendorId++,
        ...vendor,
        contactPhone: null,
        address: null,
        notes: null,
        userId: defaultUser.id,
        createdAt: new Date(),
      };
      this.vendors.set(newVendor.id, newVendor);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Vendor methods
  async getVendors(userId: number): Promise<Vendor[]> {
    return Array.from(this.vendors.values()).filter(vendor => vendor.userId === userId);
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    return this.vendors.get(id);
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const vendor: Vendor = {
      ...insertVendor,
      id: this.currentVendorId++,
      createdAt: new Date(),
    };
    this.vendors.set(vendor.id, vendor);
    return vendor;
  }

  async updateVendor(id: number, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const vendor = this.vendors.get(id);
    if (!vendor) return undefined;
    
    const updatedVendor = { ...vendor, ...updates };
    this.vendors.set(id, updatedVendor);
    return updatedVendor;
  }

  async deleteVendor(id: number): Promise<boolean> {
    return this.vendors.delete(id);
  }

  // Material Category methods
  async getMaterialCategories(userId: number): Promise<MaterialCategory[]> {
    return Array.from(this.materialCategories.values()).filter(cat => cat.userId === userId);
  }

  async createMaterialCategory(insertCategory: InsertMaterialCategory): Promise<MaterialCategory> {
    const category: MaterialCategory = {
      ...insertCategory,
      id: this.currentCategoryId++,
    };
    this.materialCategories.set(category.id, category);
    return category;
  }

  async updateMaterialCategory(id: number, updates: Partial<InsertMaterialCategory>): Promise<MaterialCategory | undefined> {
    const category = this.materialCategories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...updates };
    this.materialCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteMaterialCategory(id: number): Promise<boolean> {
    return this.materialCategories.delete(id);
  }

  // Raw Material methods
  async getRawMaterials(userId: number): Promise<RawMaterial[]> {
    return Array.from(this.rawMaterials.values()).filter(material => material.userId === userId);
  }

  async getRawMaterial(id: number): Promise<RawMaterial | undefined> {
    return this.rawMaterials.get(id);
  }

  async createRawMaterial(insertMaterial: InsertRawMaterial): Promise<RawMaterial> {
    const unitCost = Number(insertMaterial.totalCost) / Number(insertMaterial.quantity);
    const material: RawMaterial = {
      ...insertMaterial,
      id: this.currentMaterialId++,
      unitCost: unitCost.toFixed(4),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rawMaterials.set(material.id, material);
    return material;
  }

  async updateRawMaterial(id: number, updates: Partial<InsertRawMaterial>): Promise<RawMaterial | undefined> {
    const material = this.rawMaterials.get(id);
    if (!material) return undefined;
    
    const updatedMaterial = { ...material, ...updates, updatedAt: new Date() };
    
    // Recalculate unit cost if total cost or quantity changed
    if (updates.totalCost !== undefined || updates.quantity !== undefined) {
      const totalCost = Number(updates.totalCost ?? material.totalCost);
      const quantity = Number(updates.quantity ?? material.quantity);
      updatedMaterial.unitCost = (totalCost / quantity).toFixed(4);
    }
    
    this.rawMaterials.set(id, updatedMaterial);
    return updatedMaterial;
  }

  async deleteRawMaterial(id: number): Promise<boolean> {
    return this.rawMaterials.delete(id);
  }

  // Formulation methods
  async getFormulations(userId: number): Promise<Formulation[]> {
    return Array.from(this.formulations.values()).filter(formulation => formulation.userId === userId);
  }

  async getFormulation(id: number): Promise<Formulation | undefined> {
    return this.formulations.get(id);
  }

  async createFormulation(insertFormulation: InsertFormulation): Promise<Formulation> {
    const formulation: Formulation = {
      ...insertFormulation,
      id: this.currentFormulationId++,
      totalCost: "0.00",
      unitCost: "0.00",
      profitMargin: "0.00",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.formulations.set(formulation.id, formulation);
    return formulation;
  }

  async updateFormulation(id: number, updates: Partial<InsertFormulation>): Promise<Formulation | undefined> {
    const formulation = this.formulations.get(id);
    if (!formulation) return undefined;
    
    const updatedFormulation = { ...formulation, ...updates, updatedAt: new Date() };
    this.formulations.set(id, updatedFormulation);
    return updatedFormulation;
  }

  async deleteFormulation(id: number): Promise<boolean> {
    return this.formulations.delete(id);
  }

  // Formulation Ingredient methods
  async getFormulationIngredients(formulationId: number): Promise<FormulationIngredient[]> {
    return Array.from(this.formulationIngredients.values())
      .filter(ingredient => ingredient.formulationId === formulationId);
  }

  async createFormulationIngredient(insertIngredient: InsertFormulationIngredient): Promise<FormulationIngredient> {
    const ingredient: FormulationIngredient = {
      ...insertIngredient,
      id: this.currentIngredientId++,
      costContribution: "0.00",
    };
    this.formulationIngredients.set(ingredient.id, ingredient);
    return ingredient;
  }

  async updateFormulationIngredient(id: number, updates: Partial<InsertFormulationIngredient>): Promise<FormulationIngredient | undefined> {
    const ingredient = this.formulationIngredients.get(id);
    if (!ingredient) return undefined;
    
    const updatedIngredient = { ...ingredient, ...updates };
    this.formulationIngredients.set(id, updatedIngredient);
    return updatedIngredient;
  }

  async deleteFormulationIngredient(id: number): Promise<boolean> {
    return this.formulationIngredients.delete(id);
  }

  // Material File methods
  async getMaterialFiles(materialId: number): Promise<MaterialFile[]> {
    return Array.from(this.materialFiles.values())
      .filter(file => file.materialId === materialId);
  }

  async createMaterialFile(insertFile: InsertMaterialFile): Promise<MaterialFile> {
    const file: MaterialFile = {
      ...insertFile,
      id: this.currentFileId++,
      uploadedAt: new Date(),
    };
    this.materialFiles.set(file.id, file);
    return file;
  }

  async deleteMaterialFile(id: number): Promise<boolean> {
    return this.materialFiles.delete(id);
  }

  // Audit Log methods
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const log: AuditLog = {
      ...insertLog,
      id: this.currentAuditId++,
      timestamp: new Date(),
    };
    this.auditLogs.set(log.id, log);
    return log;
  }

  async getAuditLogs(userId: number, limit = 50): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
