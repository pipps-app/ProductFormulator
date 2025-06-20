import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc, sql, and } from "drizzle-orm";
import { 
  users, vendors, materialCategories, rawMaterials, formulations, 
  formulationIngredients, materialFiles, auditLog, files, fileAttachments,
  type User, type InsertUser, type Vendor, type InsertVendor,
  type MaterialCategory, type InsertMaterialCategory,
  type RawMaterial, type InsertRawMaterial,
  type Formulation, type InsertFormulation,
  type FormulationIngredient, type InsertFormulationIngredient,
  type MaterialFile, type InsertMaterialFile,
  type File, type InsertFile,
  type FileAttachment, type InsertFileAttachment,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";

// Database connection - construct from individual env vars since DATABASE_URL is malformed
const connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`;

// Add timeout and connection pool settings
const client = postgres(connectionString, {
  connect_timeout: 30,
  idle_timeout: 30,
  max_lifetime: 60 * 30,
});
const db = drizzle(client);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<boolean>;

  // Vendors
  getVendors(userId: number): Promise<Vendor[]>;
  getVendor(id: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: number): Promise<boolean>;

  // Material Categories
  getMaterialCategories(userId: number): Promise<MaterialCategory[]>;
  getMaterialCategory(id: number): Promise<MaterialCategory | undefined>;
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
  updateFormulationCosts(id: number, costs: { totalCost: string; unitCost: string; profitMargin: string; }): Promise<boolean>;
  deleteFormulation(id: number): Promise<boolean>;

  // Formulation Ingredients
  getFormulationIngredients(formulationId: number): Promise<FormulationIngredient[]>;
  createFormulationIngredient(ingredient: InsertFormulationIngredient): Promise<FormulationIngredient>;
  updateFormulationIngredient(id: number, ingredient: Partial<InsertFormulationIngredient>): Promise<FormulationIngredient | undefined>;
  deleteFormulationIngredient(id: number): Promise<boolean>;

  // Files (Shared File Library)
  getFiles(userId: number): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, file: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
  
  // File Attachments
  getFileAttachments(entityType: string, entityId: number): Promise<FileAttachment[]>;
  getAttachedFiles(entityType: string, entityId: number): Promise<File[]>;
  attachFile(attachment: InsertFileAttachment): Promise<FileAttachment>;
  detachFile(fileId: number, entityType: string, entityId: number): Promise<boolean>;

  // Material Files (Legacy)
  getMaterialFiles(materialId: number): Promise<MaterialFile[]>;
  createMaterialFile(file: InsertMaterialFile): Promise<MaterialFile>;
  deleteMaterialFile(id: number): Promise<boolean>;

  // Audit Log
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(userId: number, limit?: number): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeDefaultData();
  }

  async initializeDefaultData() {
    try {
      // Add subscription and authentication columns if they don't exist
      try {
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none'`);
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT`);
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP`);
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP`);
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT`);
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT`);
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT`);
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'local'`);
        await db.execute(sql`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`);
      } catch (error) {
        console.log("Database columns may already exist:", error);
      }

      // Check if default user exists
      const existingUser = await db.select().from(users).where(eq(users.username, "demo")).limit(1);
      if (existingUser.length > 0) return; // Already initialized

      // Create default user
      const [defaultUser] = await db.insert(users).values({
        username: "demo",
        email: "demo@example.com", 
        password: "password",
        company: "Artisan Soap Co.",
        role: "admin",
      }).returning();

      // Create default categories
      const categories = [
        { name: "Base Oils", color: "#3b82f6", userId: defaultUser.id },
        { name: "Essential Oils", color: "#8b5cf6", userId: defaultUser.id },
        { name: "Butters", color: "#10b981", userId: defaultUser.id },
        { name: "Waxes", color: "#f59e0b", userId: defaultUser.id },
        { name: "Additives", color: "#ef4444", userId: defaultUser.id },
      ];

      await db.insert(materialCategories).values(categories);

      // Create default vendors
      const defaultVendors = [
        { 
          name: "Natural Supplies Co.", 
          contactEmail: "orders@naturalsupplies.com",
          contactPhone: null,
          address: null,
          notes: null,
          userId: defaultUser.id 
        },
        { 
          name: "Aromatherapy Plus", 
          contactEmail: "sales@aromatherapyplus.com",
          contactPhone: null,
          address: null,
          notes: null,
          userId: defaultUser.id 
        },
        { 
          name: "Essential Elements", 
          contactEmail: "info@essentialelements.com",
          contactPhone: null,
          address: null,
          notes: null,
          userId: defaultUser.id 
        },
      ];

      await db.insert(vendors).values(defaultVendors);
    } catch (error) {
      console.log("Database initialization skipped or already exists");
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    let userData = { ...insertUser };
    
    // Hash password if provided (for local auth)
    if (userData.password) {
      const bcrypt = await import('bcryptjs');
      userData.password = await bcrypt.hash(userData.password, 12);
    }
    
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserPassword(id: number, newPassword: string): Promise<boolean> {
    const result = await db.update(users).set({ password: newPassword }).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Vendor methods
  async getVendors(userId: number): Promise<Vendor[]> {
    return await db.select().from(vendors).where(eq(vendors.userId, userId));
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    const result = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
    return result[0];
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(insertVendor).returning();
    return vendor;
  }

  async updateVendor(id: number, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const result = await db.update(vendors).set(updates).where(eq(vendors.id, id)).returning();
    return result[0];
  }

  async deleteVendor(id: number): Promise<boolean> {
    const result = await db.delete(vendors).where(eq(vendors.id, id)).returning();
    return result.length > 0;
  }

  // Material Category methods
  async getMaterialCategories(userId: number): Promise<MaterialCategory[]> {
    return await db.select().from(materialCategories).where(eq(materialCategories.userId, userId));
  }

  async getMaterialCategory(id: number): Promise<MaterialCategory | undefined> {
    const result = await db.select().from(materialCategories).where(eq(materialCategories.id, id)).limit(1);
    return result[0];
  }

  async createMaterialCategory(insertCategory: InsertMaterialCategory): Promise<MaterialCategory> {
    const [category] = await db.insert(materialCategories).values(insertCategory).returning();
    return category;
  }

  async updateMaterialCategory(id: number, updates: Partial<InsertMaterialCategory>): Promise<MaterialCategory | undefined> {
    const result = await db.update(materialCategories).set(updates).where(eq(materialCategories.id, id)).returning();
    return result[0];
  }

  async deleteMaterialCategory(id: number): Promise<boolean> {
    const result = await db.delete(materialCategories).where(eq(materialCategories.id, id)).returning();
    return result.length > 0;
  }

  // Raw Material methods
  async getRawMaterials(userId: number): Promise<any[]> {
    return await db
      .select({
        id: rawMaterials.id,
        name: rawMaterials.name,
        sku: rawMaterials.sku,
        categoryId: rawMaterials.categoryId,
        vendorId: rawMaterials.vendorId,
        totalCost: rawMaterials.totalCost,
        quantity: rawMaterials.quantity,
        unit: rawMaterials.unit,
        unitCost: rawMaterials.unitCost,
        notes: rawMaterials.notes,
        isActive: rawMaterials.isActive,
        userId: rawMaterials.userId,
        createdAt: rawMaterials.createdAt,
        category: {
          id: materialCategories.id,
          name: materialCategories.name,
          color: materialCategories.color,
        },
        vendor: {
          id: vendors.id,
          name: vendors.name,
          contactEmail: vendors.contactEmail,
        }
      })
      .from(rawMaterials)
      .leftJoin(materialCategories, eq(rawMaterials.categoryId, materialCategories.id))
      .leftJoin(vendors, eq(rawMaterials.vendorId, vendors.id))
      .where(eq(rawMaterials.userId, userId));
  }

  async getRawMaterial(id: number): Promise<RawMaterial | undefined> {
    const result = await db.select().from(rawMaterials).where(eq(rawMaterials.id, id)).limit(1);
    return result[0];
  }

  async createRawMaterial(insertMaterial: InsertRawMaterial): Promise<RawMaterial> {
    const unitCost = Number(insertMaterial.totalCost) / Number(insertMaterial.quantity);
    const materialWithUnitCost = {
      ...insertMaterial,
      unitCost: unitCost.toFixed(4),
    };
    const [material] = await db.insert(rawMaterials).values(materialWithUnitCost).returning();
    return material;
  }

  async updateRawMaterial(id: number, updates: Partial<InsertRawMaterial>): Promise<RawMaterial | undefined> {
    // Get existing material to calculate unit cost if needed
    const existing = await this.getRawMaterial(id);
    if (!existing) return undefined;

    let finalUpdates: Partial<InsertRawMaterial> & { unitCost?: string } = { ...updates };
    
    // Recalculate unit cost if total cost or quantity changed
    if (updates.totalCost !== undefined || updates.quantity !== undefined) {
      const totalCost = Number(updates.totalCost ?? existing.totalCost);
      const quantity = Number(updates.quantity ?? existing.quantity);
      finalUpdates.unitCost = (totalCost / quantity).toFixed(4);
    }

    const result = await db.update(rawMaterials).set(finalUpdates).where(eq(rawMaterials.id, id)).returning();
    return result[0];
  }

  async deleteRawMaterial(id: number): Promise<boolean> {
    // First update any formulation ingredients that reference this material to set materialId to null
    await db.update(formulationIngredients)
      .set({ materialId: null })
      .where(eq(formulationIngredients.materialId, id));
    
    // Then delete the raw material
    const result = await db.delete(rawMaterials).where(eq(rawMaterials.id, id)).returning();
    return result.length > 0;
  }

  // Formulation methods
  async getFormulations(userId: number): Promise<Formulation[]> {
    return await db.select().from(formulations).where(eq(formulations.userId, userId));
  }

  async getFormulation(id: number): Promise<Formulation | undefined> {
    const result = await db.select().from(formulations).where(eq(formulations.id, id)).limit(1);
    return result[0];
  }

  async createFormulation(insertFormulation: InsertFormulation): Promise<Formulation> {
    const [formulation] = await db.insert(formulations).values(insertFormulation).returning();
    return formulation;
  }

  async updateFormulation(id: number, updates: Partial<InsertFormulation>): Promise<Formulation | undefined> {
    const result = await db.update(formulations).set(updates).where(eq(formulations.id, id)).returning();
    return result[0];
  }

  async updateFormulationCosts(id: number, costs: { totalCost: string; unitCost: string; profitMargin: string; }): Promise<boolean> {
    const result = await db.update(formulations)
      .set({
        totalCost: costs.totalCost,
        unitCost: costs.unitCost,
        profitMargin: costs.profitMargin,
      })
      .where(eq(formulations.id, id))
      .returning();
    return result.length > 0;
  }

  async deleteFormulation(id: number): Promise<boolean> {
    // First delete all dependent formulation ingredients
    await db.delete(formulationIngredients).where(eq(formulationIngredients.formulationId, id));
    
    // Then delete the formulation
    const result = await db.delete(formulations).where(eq(formulations.id, id)).returning();
    return result.length > 0;
  }

  // Formulation Ingredient methods
  async getFormulationIngredients(formulationId: number): Promise<any[]> {
    return await db
      .select({
        id: formulationIngredients.id,
        formulationId: formulationIngredients.formulationId,
        materialId: formulationIngredients.materialId,
        subFormulationId: formulationIngredients.subFormulationId,
        quantity: formulationIngredients.quantity,
        unit: formulationIngredients.unit,
        costContribution: formulationIngredients.costContribution,
        includeInMarkup: formulationIngredients.includeInMarkup,
        notes: formulationIngredients.notes,
        material: {
          id: rawMaterials.id,
          name: rawMaterials.name,
          unitCost: rawMaterials.unitCost,
          unit: rawMaterials.unit,
        }
      })
      .from(formulationIngredients)
      .leftJoin(rawMaterials, eq(formulationIngredients.materialId, rawMaterials.id))
      .where(eq(formulationIngredients.formulationId, formulationId));
  }

  async createFormulationIngredient(insertIngredient: InsertFormulationIngredient): Promise<FormulationIngredient> {
    const [ingredient] = await db.insert(formulationIngredients).values(insertIngredient).returning();
    return ingredient;
  }

  async updateFormulationIngredient(id: number, updates: Partial<InsertFormulationIngredient>): Promise<FormulationIngredient | undefined> {
    const result = await db.update(formulationIngredients).set(updates).where(eq(formulationIngredients.id, id)).returning();
    return result[0];
  }

  async deleteFormulationIngredient(id: number): Promise<boolean> {
    const result = await db.delete(formulationIngredients).where(eq(formulationIngredients.id, id)).returning();
    return result.length > 0;
  }

  // Material File methods
  async getMaterialFiles(materialId: number): Promise<MaterialFile[]> {
    return await db.select().from(materialFiles).where(eq(materialFiles.materialId, materialId));
  }

  async createMaterialFile(insertFile: InsertMaterialFile): Promise<MaterialFile> {
    const [file] = await db.insert(materialFiles).values(insertFile).returning();
    return file;
  }

  async deleteMaterialFile(id: number): Promise<boolean> {
    const result = await db.delete(materialFiles).where(eq(materialFiles.id, id)).returning();
    return result.length > 0;
  }

  // Audit Log methods
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLog).values(insertLog).returning();
    return log;
  }

  // Shared File Library Methods - simplified for now
  async getFiles(userId: number): Promise<File[]> {
    try {
      const result = await db.select().from(files)
        .where(eq(files.userId, userId))
        .orderBy(desc(files.uploadedAt));
      return result;
    } catch (error) {
      console.error("Error getting files:", error);
      return [];
    }
  }

  async getFile(id: number): Promise<File | undefined> {
    try {
      const result = await db.select().from(files).where(eq(files.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting file:", error);
      return undefined;
    }
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const result = await db.insert(files).values(insertFile).returning();
    return result[0];
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined> {
    try {
      const result = await db.update(files)
        .set(updates)
        .where(eq(files.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating file:", error);
      return undefined;
    }
  }

  async deleteFile(id: number): Promise<boolean> {
    try {
      await db.delete(files).where(eq(files.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  // File Attachments Methods - simplified for now  
  async getFileAttachments(entityType: string, entityId: number): Promise<FileAttachment[]> {
    try {
      // For now, return empty array - will implement after database is properly set up
      return [];
    } catch (error) {
      console.error("Error getting file attachments:", error);
      return [];
    }
  }

  async getAttachedFiles(entityType: string, entityId: number): Promise<File[]> {
    try {
      // For now, return empty array - will implement after database is properly set up
      return [];
    } catch (error) {
      console.error("Error getting attached files:", error);
      return [];
    }
  }

  async attachFile(attachment: InsertFileAttachment): Promise<FileAttachment> {
    const result = await db.insert(fileAttachments).values(attachment).returning();
    return result[0];
  }

  async detachFile(fileId: number, entityType: string, entityId: number): Promise<boolean> {
    try {
      // For now, return true - will implement after database is properly set up
      return true;
    } catch (error) {
      console.error("Error detaching file:", error);
      return false;
    }
  }

  async getAuditLogs(userId: number, limit = 50): Promise<AuditLog[]> {
    return await db.select().from(auditLog)
      .where(eq(auditLog.userId, userId))
      .orderBy(desc(auditLog.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();