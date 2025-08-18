import { 
  type User, type InsertUser, type Vendor, type InsertVendor,
  type MaterialCategory, type InsertMaterialCategory,
  type RawMaterial, type InsertRawMaterial,
  type Formulation, type InsertFormulation,
  type FormulationIngredient, type InsertFormulationIngredient,
  type MaterialFile, type InsertMaterialFile,
  type File, type InsertFile,
  type FileAttachment, type InsertFileAttachment,
  type AuditLog, type InsertAuditLog,
  type PasswordResetToken, type InsertPasswordResetToken,
  type Payment, type InsertPayment
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;

  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<boolean>;
  getVendors(userId: number): Promise<Vendor[]>;
  getVendor(id: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: number): Promise<boolean>;
  getMaterialCategories(userId: number): Promise<MaterialCategory[]>;
  getMaterialCategory(id: number): Promise<MaterialCategory | undefined>;
  createMaterialCategory(category: InsertMaterialCategory): Promise<MaterialCategory>;
  updateMaterialCategory(id: number, category: Partial<InsertMaterialCategory>): Promise<MaterialCategory | undefined>;
  deleteMaterialCategory(id: number): Promise<boolean>;
  getRawMaterials(userId: number): Promise<RawMaterial[]>;
  getRawMaterial(id: number): Promise<RawMaterial | undefined>;
  createRawMaterial(material: InsertRawMaterial): Promise<RawMaterial>;
  updateRawMaterial(id: number, material: Partial<InsertRawMaterial>): Promise<RawMaterial | undefined>;
  deleteRawMaterial(id: number): Promise<boolean>;
  getFormulations(userId: number): Promise<Formulation[]>;
  getFormulation(id: number): Promise<Formulation | undefined>;
  createFormulation(formulation: InsertFormulation): Promise<Formulation>;
  updateFormulation(id: number, formulation: Partial<InsertFormulation>): Promise<Formulation | undefined>;
  updateFormulationCosts(id: number, costs: { totalCost: string; unitCost: string; profitMargin: string; }): Promise<boolean>;
  deleteFormulation(id: number): Promise<boolean>;
  getFormulationIngredients(formulationId: number): Promise<FormulationIngredient[]>;
  createFormulationIngredient(ingredient: InsertFormulationIngredient): Promise<FormulationIngredient>;
  updateFormulationIngredient(id: number, ingredient: Partial<InsertFormulationIngredient>): Promise<FormulationIngredient | undefined>;
  deleteFormulationIngredient(id: number): Promise<boolean>;
  getFiles(userId: number): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, file: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
  getFileAttachments(entityType: string, entityId: number): Promise<FileAttachment[]>;
  getAttachedFiles(entityType: string, entityId: number): Promise<File[]>;
  attachFile(attachment: InsertFileAttachment): Promise<FileAttachment>;
  detachFile(fileId: number, entityType: string, entityId: number): Promise<boolean>;
  getMaterialFiles(materialId: number): Promise<MaterialFile[]>;
  createMaterialFile(file: InsertMaterialFile): Promise<MaterialFile>;
  deleteMaterialFile(id: number): Promise<boolean>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(userId: number, limit?: number): Promise<AuditLog[]>;
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<boolean>;
  cleanupExpiredTokens(): Promise<void>;
  
  // Payment management
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined>;
  getUserPayments(userId: number): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string, refundAmount?: string): Promise<boolean>;
}

class MemoryStorage implements IStorage {
  private users: User[] = [];
  private vendors: Vendor[] = [];
  private materialCategories: MaterialCategory[] = [];
  private rawMaterials: RawMaterial[] = [];
  private formulations: Formulation[] = [];
  private formulationIngredients: FormulationIngredient[] = [];
  private files: File[] = [];
  private fileAttachments: FileAttachment[] = [];
  private materialFiles: MaterialFile[] = [];
  private auditLogs: AuditLog[] = [];
  private passwordResetTokens: PasswordResetToken[] = [];
  private nextId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  async initializeDefaultData() {
    const defaultUser: User = {
      id: 1,
      username: "Juliet",
      email: "jumelisa@yahoo.com",
      password: "$2b$10$KBiX1HqE/7L0Xm.CtGEJWO3ne.RGq2KETa0vQsuUXpEhnijyvCuZK",
      company: "J.C Epiphany Limited",
      role: "admin",
      profileImage: null,
      googleId: null,
      authProvider: "local",
      subscriptionStatus: "active",
      subscriptionPlan: "free",
      subscriptionStartDate: new Date(),
      subscriptionEndDate: null,
      paypalSubscriptionId: null,
      createdAt: new Date()
    };
    this.users.push(defaultUser);

    // Add sample vendor
    const defaultVendor: Vendor = {
      id: 1,
      name: "ABC Supplies",
      contactEmail: "orders@abcsupplies.com",
      phone: "555-0123",
      address: "123 Business St, City, State 12345",
      notes: null,
      isActive: true,
      userId: 1,
      createdAt: new Date()
    };
    this.vendors.push(defaultVendor);

    // Add sample material category
    const defaultCategory: MaterialCategory = {
      id: 1,
      name: "Raw Materials",
      description: "Basic ingredients and materials",
      color: "#3B82F6",
      userId: 1,
      createdAt: new Date()
    };
    this.materialCategories.push(defaultCategory);

    // Add sample raw materials
    const materials: RawMaterial[] = [
      {
        id: 1,
        name: "Polymer Base",
        sku: "PB-001",
        categoryId: 1,
        vendorId: 1,
        totalCost: "25.50",
        quantity: "5.000",
        unit: "kg",
        unitCost: "5.1000",
        notes: "High-grade polymer base material",
        isActive: true,
        userId: 1,
        createdAt: new Date()
      },
      {
        id: 2,
        name: "Stabilizer Compound",
        sku: "SC-001",
        categoryId: 1,
        vendorId: 1,
        totalCost: "18.75",
        quantity: "2.500",
        unit: "kg",
        unitCost: "7.5000",
        notes: "Industrial grade stabilizer compound",
        isActive: true,
        userId: 1,
        createdAt: new Date()
      },
      {
        id: 3,
        name: "Fragrance Additive",
        sku: "FA-001",
        categoryId: 1,
        vendorId: 1,
        totalCost: "15.00",
        quantity: "0.100",
        unit: "L",
        unitCost: "150.0000",
        notes: "Concentrated fragrance additive",
        isActive: true,
        userId: 1,
        createdAt: new Date()
      }
    ];
    this.rawMaterials.push(...materials);

    // Add sample formulation
    const defaultFormulation: Formulation = {
      id: 1,
      name: "Natural Body Butter",
      description: "Moisturizing body butter with natural ingredients",
      batchSize: "1.000",
      batchUnit: "unit",
      targetPrice: "45.00",
      markupPercentage: "35.00",
      totalCost: "4.80",
      unitCost: "4.8000",
      profitMargin: "1.68",
      isActive: true,
      userId: 1,
      createdAt: new Date()
    };
    this.formulations.push(defaultFormulation);

    // Add formulation ingredients
    const ingredients: FormulationIngredient[] = [
      {
        id: 1,
        formulationId: 1,
        materialId: 1,
        subFormulationId: null,
        quantity: "0.500",
        unit: "kg",
        costContribution: "2.5500",
        includeInMarkup: true,
        notes: null
      },
      {
        id: 2,
        formulationId: 1,
        materialId: 2,
        subFormulationId: null,
        quantity: "0.300",
        unit: "kg",
        costContribution: "2.2500",
        includeInMarkup: true,
        notes: null
      }
    ];
    this.formulationIngredients.push(...ingredients);

    this.nextId = 10;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return this.users.find(u => u.googleId === googleId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextId++,
      ...user,
      createdAt: new Date()
    } as User;
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    this.users[index] = { ...this.users[index], ...updates };
    return this.users[index];
  }

  async updateUserPassword(id: number, newPassword: string): Promise<boolean> {
    const user = this.users.find(u => u.id === id);
    if (!user) return false;
    user.password = newPassword;
    return true;
  }

  async getVendors(userId: number): Promise<Vendor[]> {
    return this.vendors.filter(v => v.userId === userId);
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    return this.vendors.find(v => v.id === id);
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const newVendor: Vendor = {
      id: this.nextId++,
      ...vendor,
      createdAt: new Date()
    } as Vendor;
    this.vendors.push(newVendor);
    return newVendor;
  }

  async updateVendor(id: number, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const index = this.vendors.findIndex(v => v.id === id);
    if (index === -1) return undefined;
    this.vendors[index] = { ...this.vendors[index], ...updates };
    return this.vendors[index];
  }

  async deleteVendor(id: number): Promise<boolean> {
    const index = this.vendors.findIndex(v => v.id === id);
    if (index === -1) return false;
    this.vendors.splice(index, 1);
    return true;
  }

  async getMaterialCategories(userId: number): Promise<MaterialCategory[]> {
    return this.materialCategories.filter(c => c.userId === userId);
  }

  async getMaterialCategory(id: number): Promise<MaterialCategory | undefined> {
    return this.materialCategories.find(c => c.id === id);
  }

  async createMaterialCategory(category: InsertMaterialCategory): Promise<MaterialCategory> {
    const newCategory: MaterialCategory = {
      id: this.nextId++,
      ...category,
      createdAt: new Date()
    } as MaterialCategory;
    this.materialCategories.push(newCategory);
    return newCategory;
  }

  async updateMaterialCategory(id: number, updates: Partial<InsertMaterialCategory>): Promise<MaterialCategory | undefined> {
    const index = this.materialCategories.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    this.materialCategories[index] = { ...this.materialCategories[index], ...updates };
    return this.materialCategories[index];
  }

  async deleteMaterialCategory(id: number): Promise<boolean> {
    const index = this.materialCategories.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.materialCategories.splice(index, 1);
    return true;
  }

  async getRawMaterials(userId: number): Promise<any[]> {
    return this.rawMaterials.filter(m => m.userId === userId);
  }

  async getRawMaterial(id: number): Promise<RawMaterial | undefined> {
    return this.rawMaterials.find(m => m.id === id);
  }

  async createRawMaterial(material: InsertRawMaterial): Promise<RawMaterial> {
    const newMaterial: RawMaterial = {
      id: this.nextId++,
      ...material,
      createdAt: new Date()
    } as RawMaterial;
    this.rawMaterials.push(newMaterial);
    return newMaterial;
  }

  async updateRawMaterial(id: number, updates: Partial<InsertRawMaterial>): Promise<RawMaterial | undefined> {
    const index = this.rawMaterials.findIndex(m => m.id === id);
    if (index === -1) return undefined;
    this.rawMaterials[index] = { ...this.rawMaterials[index], ...updates };
    return this.rawMaterials[index];
  }

  async deleteRawMaterial(id: number): Promise<boolean> {
    const index = this.rawMaterials.findIndex(m => m.id === id);
    if (index === -1) return false;
    this.rawMaterials.splice(index, 1);
    return true;
  }

  async getFormulations(userId: number): Promise<Formulation[]> {
    // For each formulation, attach an ingredients array (empty if none)
    return this.formulations
      .filter(f => f.userId === userId)
      .map(f => ({
        ...f,
        ingredients: this.formulationIngredients.filter(i => i.formulationId === f.id)
      }));
  }

  async getFormulation(id: number): Promise<Formulation | undefined> {
    return this.formulations.find(f => f.id === id);
  }

  async createFormulation(formulation: InsertFormulation): Promise<Formulation> {
    // Backend validation: prevent saving if no ingredients
    if (!('ingredients' in formulation) || !Array.isArray((formulation as any).ingredients) || (formulation as any).ingredients.length === 0) {
      throw new Error('A formulation must have at least one ingredient.');
    }
    const newFormulation: Formulation = {
      id: this.nextId++,
      ...formulation,
      createdAt: new Date()
    } as Formulation;
    this.formulations.push(newFormulation);
    return newFormulation;
  }

  async updateFormulation(id: number, updates: Partial<InsertFormulation>): Promise<Formulation | undefined> {
    const index = this.formulations.findIndex(f => f.id === id);
    if (index === -1) return undefined;
    this.formulations[index] = { ...this.formulations[index], ...updates };
    return this.formulations[index];
  }

  async updateFormulationCosts(id: number, costs: { totalCost: string; unitCost: string; profitMargin: string; }): Promise<boolean> {
    const formulation = this.formulations.find(f => f.id === id);
    if (!formulation) return false;
    Object.assign(formulation, costs);
    return true;
  }

  async deleteFormulation(id: number): Promise<boolean> {
    const index = this.formulations.findIndex(f => f.id === id);
    if (index === -1) return false;
    this.formulations.splice(index, 1);
    return true;
  }

  async getFormulationIngredients(formulationId: number): Promise<any[]> {
    return this.formulationIngredients.filter(i => i.formulationId === formulationId);
  }

  async createFormulationIngredient(ingredient: InsertFormulationIngredient): Promise<FormulationIngredient> {
    const newIngredient: FormulationIngredient = {
      id: this.nextId++,
      ...ingredient,
      createdAt: new Date()
    } as FormulationIngredient;
    this.formulationIngredients.push(newIngredient);
    return newIngredient;
  }

  async updateFormulationIngredient(id: number, updates: Partial<InsertFormulationIngredient>): Promise<FormulationIngredient | undefined> {
    const index = this.formulationIngredients.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    this.formulationIngredients[index] = { ...this.formulationIngredients[index], ...updates };
    return this.formulationIngredients[index];
  }

  async deleteFormulationIngredient(id: number): Promise<boolean> {
    const index = this.formulationIngredients.findIndex(i => i.id === id);
    if (index === -1) return false;
    this.formulationIngredients.splice(index, 1);
    return true;
  }

  async getFiles(userId: number): Promise<File[]> {
    return this.files.filter(f => f.userId === userId);
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.find(f => f.id === id);
  }

  async createFile(file: InsertFile): Promise<File> {
    const newFile: File = {
      id: this.nextId++,
      ...file,
      uploadedAt: new Date()
    } as File;
    this.files.push(newFile);
    return newFile;
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined> {
    const index = this.files.findIndex(f => f.id === id);
    if (index === -1) return undefined;
    this.files[index] = { ...this.files[index], ...updates };
    return this.files[index];
  }

  async deleteFile(id: number): Promise<boolean> {
    const index = this.files.findIndex(f => f.id === id);
    if (index === -1) return false;
    this.files.splice(index, 1);
    return true;
  }

  async getFileAttachments(entityType: string, entityId: number): Promise<FileAttachment[]> {
    return this.fileAttachments.filter(a => a.entityType === entityType && a.entityId === entityId);
  }

  async getAttachedFiles(entityType: string, entityId: number): Promise<File[]> {
    const attachments = await this.getFileAttachments(entityType, entityId);
    return this.files.filter(f => attachments.some(a => a.fileId === f.id));
  }

  async attachFile(attachment: InsertFileAttachment): Promise<FileAttachment> {
    const newAttachment: FileAttachment = {
      id: this.nextId++,
      ...attachment,
      attachedAt: new Date()
    } as FileAttachment;
    this.fileAttachments.push(newAttachment);
    return newAttachment;
  }

  async detachFile(fileId: number, entityType: string, entityId: number): Promise<boolean> {
    const index = this.fileAttachments.findIndex(a => 
      a.fileId === fileId && a.entityType === entityType && a.entityId === entityId
    );
    if (index === -1) return false;
    this.fileAttachments.splice(index, 1);
    return true;
  }

  async getMaterialFiles(materialId: number): Promise<MaterialFile[]> {
    return this.materialFiles.filter(f => f.materialId === materialId);
  }

  async createMaterialFile(file: InsertMaterialFile): Promise<MaterialFile> {
    const newFile: MaterialFile = {
      id: this.nextId++,
      ...file,
      uploadedAt: new Date()
    } as MaterialFile;
    this.materialFiles.push(newFile);
    return newFile;
  }

  async deleteMaterialFile(id: number): Promise<boolean> {
    const index = this.materialFiles.findIndex(f => f.id === id);
    if (index === -1) return false;
    this.materialFiles.splice(index, 1);
    return true;
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: this.nextId++,
      ...log,
      timestamp: new Date()
    } as AuditLog;
    this.auditLogs.push(newLog);
    return newLog;
  }

  async getAuditLogs(userId: number, limit = 50): Promise<AuditLog[]> {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const newToken: PasswordResetToken = {
      id: this.nextId++,
      ...token,
      createdAt: new Date()
    } as PasswordResetToken;
    this.passwordResetTokens.push(newToken);
    return newToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    return this.passwordResetTokens.find(t => t.token === token && !t.used && t.expiresAt > new Date());
  }

  async markTokenAsUsed(token: string): Promise<boolean> {
    const resetToken = this.passwordResetTokens.find(t => t.token === token);
    if (!resetToken) return false;
    resetToken.used = true;
    return true;
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    this.passwordResetTokens = this.passwordResetTokens.filter(t => t.expiresAt > now && !t.used);
  }
}

// Import the persistent file-based storage implementation
import { PersistentStorage } from "./persistent-storage";

// Use persistent file-based storage to preserve data across restarts
export const storage = new PersistentStorage();