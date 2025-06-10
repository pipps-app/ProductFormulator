import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc } from "drizzle-orm";
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

// Database connection
const connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`;
const client = postgres(connectionString);
const db = drizzle(client);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeDefaultData();
  }

  async initializeDefaultData() {
    try {
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
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
  async getRawMaterials(userId: number): Promise<RawMaterial[]> {
    return await db.select().from(rawMaterials).where(eq(rawMaterials.userId, userId));
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

  async deleteFormulation(id: number): Promise<boolean> {
    const result = await db.delete(formulations).where(eq(formulations.id, id)).returning();
    return result.length > 0;
  }

  // Formulation Ingredient methods
  async getFormulationIngredients(formulationId: number): Promise<FormulationIngredient[]> {
    return await db.select().from(formulationIngredients).where(eq(formulationIngredients.formulationId, formulationId));
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

  async getAuditLogs(userId: number, limit = 50): Promise<AuditLog[]> {
    return await db.select().from(auditLog)
      .where(eq(auditLog.userId, userId))
      .orderBy(desc(auditLog.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();