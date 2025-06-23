import fs from 'fs/promises';
import path from 'path';
import type { IStorage } from "./storage";
import type { 
  User, InsertUser, Vendor, InsertVendor, MaterialCategory, InsertMaterialCategory,
  RawMaterial, InsertRawMaterial, Formulation, InsertFormulation, FormulationIngredient, InsertFormulationIngredient,
  File, InsertFile, FileAttachment, InsertFileAttachment, MaterialFile, InsertMaterialFile,
  AuditLog, InsertAuditLog, PasswordResetToken, InsertPasswordResetToken,
  Payment, InsertPayment
} from "@shared/schema";

interface StorageData {
  users: User[];
  vendors: Vendor[];
  materialCategories: MaterialCategory[];
  rawMaterials: RawMaterial[];
  formulations: Formulation[];
  formulationIngredients: FormulationIngredient[];
  files: File[];
  fileAttachments: FileAttachment[];
  materialFiles: MaterialFile[];
  auditLogs: AuditLog[];
  passwordResetTokens: PasswordResetToken[];
  payments: Payment[];
  nextId: number;
}

export class PersistentStorage implements IStorage {
  private data: StorageData;
  private dataFile = path.join(process.cwd(), 'storage-data.json');

  constructor() {
    this.data = {
      users: [],
      vendors: [],
      materialCategories: [],
      rawMaterials: [],
      formulations: [],
      formulationIngredients: [],
      files: [],
      fileAttachments: [],
      materialFiles: [],
      auditLogs: [],
      passwordResetTokens: [],
      payments: [],
      nextId: 1
    };
    this.loadData();
  }

  private async loadData() {
    try {
      const fileContent = await fs.readFile(this.dataFile, 'utf-8');
      this.data = JSON.parse(fileContent);
      
      // Ensure all required arrays exist
      if (!this.data.payments) {
        this.data.payments = [];
      }
      if (!this.data.files) {
        this.data.files = [];
      }
      if (!this.data.fileAttachments) {
        this.data.fileAttachments = [];
      }
      if (!this.data.materialFiles) {
        this.data.materialFiles = [];
      }
      if (!this.data.passwordResetTokens) {
        this.data.passwordResetTokens = [];
      }
      
      // Convert date strings back to Date objects
      this.data.users.forEach(u => {
        u.createdAt = new Date(u.createdAt);
        if (u.subscriptionStartDate) u.subscriptionStartDate = new Date(u.subscriptionStartDate);
        if (u.subscriptionEndDate) u.subscriptionEndDate = new Date(u.subscriptionEndDate);
      });
      this.data.vendors.forEach(v => v.createdAt = new Date(v.createdAt));
      this.data.materialCategories.forEach(c => c.createdAt = new Date(c.createdAt));
      this.data.rawMaterials.forEach(m => m.createdAt = new Date(m.createdAt));
      this.data.formulations.forEach(f => f.createdAt = new Date(f.createdAt));
      this.data.auditLogs.forEach(a => {
        a.createdAt = new Date(a.createdAt);
        if (a.timestamp) a.timestamp = new Date(a.timestamp);
      });
      if (this.data.files) {
        this.data.files.forEach(f => {
          if (f.uploadedAt) f.uploadedAt = new Date(f.uploadedAt);
        });
      }
      if (this.data.passwordResetTokens) {
        this.data.passwordResetTokens.forEach(t => {
          t.createdAt = new Date(t.createdAt);
          t.expiresAt = new Date(t.expiresAt);
        });
      }
      if (this.data.payments) {
        this.data.payments.forEach(p => {
          if (p.createdAt) p.createdAt = new Date(p.createdAt);
          if (p.refundDate) p.refundDate = new Date(p.refundDate);
        });
      }
    } catch (error) {
      // File doesn't exist or is corrupted, initialize with default user
      await this.initializeDefaultData();
    }
  }

  private async saveData() {
    try {
      await fs.writeFile(this.dataFile, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  private async initializeDefaultData() {
    // Only create default user if no users exist
    if (this.data.users.length === 0) {
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
      this.data.users.push(defaultUser);
      this.data.nextId = 2;
      await this.saveData();
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.data.users.find(u => u.id === id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.data.users;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.data.users.find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.data.users.find(u => u.email === email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return this.data.users.find(u => u.googleId === googleId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.data.nextId++,
      ...user,
      createdAt: new Date()
    } as User;
    this.data.users.push(newUser);
    await this.saveData();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    await this.saveData();
    return this.data.users[index];
  }

  async updateUserPassword(id: number, newPassword: string): Promise<boolean> {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return false;
    user.password = newPassword;
    await this.saveData();
    return true;
  }

  async getVendors(userId: number): Promise<Vendor[]> {
    return this.data.vendors.filter(v => v.userId === userId);
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    return this.data.vendors.find(v => v.id === id);
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const newVendor: Vendor = {
      id: this.data.nextId++,
      ...vendor,
      createdAt: new Date()
    } as Vendor;
    this.data.vendors.push(newVendor);
    await this.saveData();
    return newVendor;
  }

  async updateVendor(id: number, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const index = this.data.vendors.findIndex(v => v.id === id);
    if (index === -1) return undefined;
    this.data.vendors[index] = { ...this.data.vendors[index], ...updates };
    await this.saveData();
    return this.data.vendors[index];
  }

  async deleteVendor(id: number): Promise<boolean> {
    const index = this.data.vendors.findIndex(v => v.id === id);
    if (index === -1) return false;
    this.data.vendors.splice(index, 1);
    await this.saveData();
    return true;
  }

  async getMaterialCategories(userId: number): Promise<MaterialCategory[]> {
    return this.data.materialCategories.filter(c => c.userId === userId);
  }

  async getMaterialCategory(id: number): Promise<MaterialCategory | undefined> {
    return this.data.materialCategories.find(c => c.id === id);
  }

  async createMaterialCategory(category: InsertMaterialCategory): Promise<MaterialCategory> {
    const newCategory: MaterialCategory = {
      id: this.data.nextId++,
      ...category,
      createdAt: new Date()
    } as MaterialCategory;
    this.data.materialCategories.push(newCategory);
    await this.saveData();
    return newCategory;
  }

  async updateMaterialCategory(id: number, updates: Partial<InsertMaterialCategory>): Promise<MaterialCategory | undefined> {
    const index = this.data.materialCategories.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    this.data.materialCategories[index] = { ...this.data.materialCategories[index], ...updates };
    await this.saveData();
    return this.data.materialCategories[index];
  }

  async deleteMaterialCategory(id: number): Promise<boolean> {
    const index = this.data.materialCategories.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.data.materialCategories.splice(index, 1);
    await this.saveData();
    return true;
  }

  async getRawMaterials(userId: number): Promise<any[]> {
    const materials = this.data.rawMaterials.filter(m => m.userId === userId);
    return materials.map(material => {
      const category = this.data.materialCategories.find(c => c.id === material.categoryId);
      const vendor = this.data.vendors.find(v => v.id === material.vendorId);
      return {
        ...material,
        unitCost: material.quantity && Number(material.quantity) > 0 
          ? (Number(material.totalCost) / Number(material.quantity)).toFixed(4)
          : "0.0000",
        category: category ? { id: category.id, name: category.name, color: category.color } : undefined,
        vendor: vendor ? { id: vendor.id, name: vendor.name, contactEmail: vendor.contactEmail } : undefined
      };
    });
  }

  async getRawMaterial(id: number): Promise<RawMaterial | undefined> {
    return this.data.rawMaterials.find(m => m.id === id);
  }

  async createRawMaterial(material: InsertRawMaterial): Promise<RawMaterial> {
    const newMaterial: RawMaterial = {
      id: this.data.nextId++,
      ...material,
      createdAt: new Date()
    } as RawMaterial;
    this.data.rawMaterials.push(newMaterial);
    await this.saveData();
    return newMaterial;
  }

  async updateRawMaterial(id: number, updates: Partial<InsertRawMaterial>): Promise<RawMaterial | undefined> {
    const index = this.data.rawMaterials.findIndex(m => m.id === id);
    if (index === -1) return undefined;
    this.data.rawMaterials[index] = { ...this.data.rawMaterials[index], ...updates };
    await this.saveData();
    return this.data.rawMaterials[index];
  }

  async deleteRawMaterial(id: number): Promise<boolean> {
    const index = this.data.rawMaterials.findIndex(m => m.id === id);
    if (index === -1) return false;
    this.data.rawMaterials.splice(index, 1);
    await this.saveData();
    return true;
  }

  async getFormulations(userId: number): Promise<Formulation[]> {
    return this.data.formulations.filter(f => f.userId === userId);
  }

  async getFormulation(id: number): Promise<Formulation | undefined> {
    return this.data.formulations.find(f => f.id === id);
  }

  async createFormulation(formulation: InsertFormulation): Promise<Formulation> {
    const newFormulation: Formulation = {
      id: this.data.nextId++,
      ...formulation,
      createdAt: new Date()
    } as Formulation;
    this.data.formulations.push(newFormulation);
    await this.saveData();
    return newFormulation;
  }

  async updateFormulation(id: number, updates: Partial<InsertFormulation>): Promise<Formulation | undefined> {
    const index = this.data.formulations.findIndex(f => f.id === id);
    if (index === -1) return undefined;
    this.data.formulations[index] = { ...this.data.formulations[index], ...updates };
    await this.saveData();
    return this.data.formulations[index];
  }

  async updateFormulationCosts(id: number, costs: { totalCost: string; unitCost: string; profitMargin: string; }): Promise<boolean> {
    const formulation = this.data.formulations.find(f => f.id === id);
    if (!formulation) return false;
    Object.assign(formulation, costs);
    await this.saveData();
    return true;
  }

  async deleteFormulation(id: number): Promise<boolean> {
    const index = this.data.formulations.findIndex(f => f.id === id);
    if (index === -1) return false;
    this.data.formulations.splice(index, 1);
    await this.saveData();
    return true;
  }

  async getFormulationIngredients(formulationId: number): Promise<any[]> {
    const ingredients = this.data.formulationIngredients.filter(i => i.formulationId === formulationId);
    return ingredients.map(ingredient => {
      const material = this.data.rawMaterials.find(m => m.id === ingredient.materialId);
      const subFormulation = this.data.formulations.find(f => f.id === ingredient.subFormulationId);
      return {
        ...ingredient,
        material: material ? {
          id: material.id,
          name: material.name,
          unitCost: material.quantity && Number(material.quantity) > 0 
            ? (Number(material.totalCost) / Number(material.quantity)).toFixed(4)
            : "0.0000",
          unit: material.unit
        } : undefined,
        subFormulation: subFormulation ? {
          id: subFormulation.id,
          name: subFormulation.name,
          unitCost: subFormulation.unitCost,
          batchUnit: subFormulation.batchUnit
        } : undefined
      };
    });
  }

  async createFormulationIngredient(ingredient: InsertFormulationIngredient): Promise<FormulationIngredient> {
    const newIngredient: FormulationIngredient = {
      id: this.data.nextId++,
      ...ingredient
    } as FormulationIngredient;
    this.data.formulationIngredients.push(newIngredient);
    await this.saveData();
    return newIngredient;
  }

  async updateFormulationIngredient(id: number, updates: Partial<InsertFormulationIngredient>): Promise<FormulationIngredient | undefined> {
    const index = this.data.formulationIngredients.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    this.data.formulationIngredients[index] = { ...this.data.formulationIngredients[index], ...updates };
    await this.saveData();
    return this.data.formulationIngredients[index];
  }

  async deleteFormulationIngredient(id: number): Promise<boolean> {
    const index = this.data.formulationIngredients.findIndex(i => i.id === id);
    if (index === -1) return false;
    this.data.formulationIngredients.splice(index, 1);
    await this.saveData();
    return true;
  }

  async getFiles(userId: number): Promise<File[]> {
    return this.data.files.filter(f => f.userId === userId);
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.data.files.find(f => f.id === id);
  }

  async createFile(file: InsertFile): Promise<File> {
    const newFile: File = {
      id: this.data.nextId++,
      ...file,
      uploadedAt: new Date()
    } as File;
    this.data.files.push(newFile);
    await this.saveData();
    return newFile;
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined> {
    const index = this.data.files.findIndex(f => f.id === id);
    if (index === -1) return undefined;
    this.data.files[index] = { ...this.data.files[index], ...updates };
    await this.saveData();
    return this.data.files[index];
  }

  async deleteFile(id: number): Promise<boolean> {
    const index = this.data.files.findIndex(f => f.id === id);
    if (index === -1) return false;
    this.data.files.splice(index, 1);
    await this.saveData();
    return true;
  }

  async getFileAttachments(entityType: string, entityId: number): Promise<FileAttachment[]> {
    return this.data.fileAttachments.filter(a => a.entityType === entityType && a.entityId === entityId);
  }

  async getAttachedFiles(entityType: string, entityId: number): Promise<File[]> {
    const attachments = await this.getFileAttachments(entityType, entityId);
    const fileIds = attachments.map(a => a.fileId);
    return this.data.files.filter(f => fileIds.includes(f.id));
  }

  async attachFile(attachment: InsertFileAttachment): Promise<FileAttachment> {
    const newAttachment: FileAttachment = {
      id: this.data.nextId++,
      ...attachment,
      createdAt: new Date()
    } as FileAttachment;
    this.data.fileAttachments.push(newAttachment);
    await this.saveData();
    return newAttachment;
  }

  async detachFile(fileId: number, entityType: string, entityId: number): Promise<boolean> {
    const index = this.data.fileAttachments.findIndex(a => 
      a.fileId === fileId && a.entityType === entityType && a.entityId === entityId);
    if (index === -1) return false;
    this.data.fileAttachments.splice(index, 1);
    await this.saveData();
    return true;
  }

  async getMaterialFiles(materialId: number): Promise<MaterialFile[]> {
    return this.data.materialFiles.filter(f => f.materialId === materialId);
  }

  async createMaterialFile(file: InsertMaterialFile): Promise<MaterialFile> {
    const newFile: MaterialFile = {
      id: this.data.nextId++,
      ...file,
      uploadedAt: new Date()
    } as MaterialFile;
    this.data.materialFiles.push(newFile);
    await this.saveData();
    return newFile;
  }

  async deleteMaterialFile(id: number): Promise<boolean> {
    const index = this.data.materialFiles.findIndex(f => f.id === id);
    if (index === -1) return false;
    this.data.materialFiles.splice(index, 1);
    await this.saveData();
    return true;
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const now = new Date();
    const newLog: AuditLog = {
      id: this.data.nextId++,
      ...log,
      createdAt: now,
      timestamp: now
    } as AuditLog;
    this.data.auditLogs.push(newLog);
    await this.saveData();
    return newLog;
  }

  async getAuditLogs(userId: number, limit = 50): Promise<AuditLog[]> {
    return this.data.auditLogs
      .filter(l => l.userId === userId)
      .map(log => ({
        ...log,
        createdAt: new Date(log.createdAt),
        timestamp: new Date(log.timestamp || log.createdAt)
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const newToken: PasswordResetToken = {
      id: this.data.nextId++,
      ...token,
      createdAt: new Date()
    } as PasswordResetToken;
    this.data.passwordResetTokens.push(newToken);
    await this.saveData();
    return newToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    return this.data.passwordResetTokens.find(t => t.token === token);
  }

  async markTokenAsUsed(token: string): Promise<boolean> {
    const tokenObj = this.data.passwordResetTokens.find(t => t.token === token);
    if (!tokenObj) return false;
    tokenObj.used = true;
    await this.saveData();
    return true;
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    this.data.passwordResetTokens = this.data.passwordResetTokens.filter(t => t.expiresAt > now && !t.used);
    await this.saveData();
  }

  // Payment management methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const newPayment: Payment = {
      id: this.data.nextId++,
      ...payment,
      createdAt: new Date()
    } as Payment;
    this.data.payments.push(newPayment);
    await this.saveData();
    return newPayment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.data.payments.find(p => p.id === id);
  }

  async getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined> {
    return this.data.payments.find(p => p.transactionId === transactionId);
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    return this.data.payments.filter(p => p.userId === userId);
  }

  async updatePaymentStatus(id: number, status: string, refundAmount?: string): Promise<boolean> {
    const payment = this.data.payments.find(p => p.id === id);
    if (!payment) return false;

    payment.paymentStatus = status;
    if (status === 'refunded' && refundAmount) {
      payment.refundAmount = refundAmount;
      payment.refundDate = new Date();
    }
    
    await this.saveData();
    return true;
  }
}