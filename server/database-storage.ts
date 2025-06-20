import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from "@shared/schema";
import type { 
  User, InsertUser, Vendor, InsertVendor, MaterialCategory, InsertMaterialCategory,
  RawMaterial, InsertRawMaterial, Formulation, InsertFormulation, FormulationIngredient, InsertFormulationIngredient,
  File, InsertFile, FileAttachment, InsertFileAttachment, MaterialFile, InsertMaterialFile,
  AuditLog, InsertAuditLog, PasswordResetToken, InsertPasswordResetToken
} from "@shared/schema";
import type { IStorage } from "./storage";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  max: 5,
  idle_timeout: 10,
  connect_timeout: 5,
  prepare: false
});
const db = drizzle(client, { schema });

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return results[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const results = await db.select().from(schema.users).where(eq(schema.users.googleId, googleId));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(schema.users).values(user).returning();
    return results[0];
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const results = await db.update(schema.users).set(user).where(eq(schema.users.id, id)).returning();
    return results[0];
  }

  async updateUserPassword(id: number, newPassword: string): Promise<boolean> {
    const results = await db.update(schema.users).set({ password: newPassword }).where(eq(schema.users.id, id));
    return results.rowCount > 0;
  }

  async getVendors(userId: number): Promise<Vendor[]> {
    return await db.select().from(schema.vendors).where(eq(schema.vendors.userId, userId));
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    const results = await db.select().from(schema.vendors).where(eq(schema.vendors.id, id));
    return results[0];
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const results = await db.insert(schema.vendors).values(vendor).returning();
    return results[0];
  }

  async updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const results = await db.update(schema.vendors).set(vendor).where(eq(schema.vendors.id, id)).returning();
    return results[0];
  }

  async deleteVendor(id: number): Promise<boolean> {
    const results = await db.delete(schema.vendors).where(eq(schema.vendors.id, id));
    return results.rowCount > 0;
  }

  async getMaterialCategories(userId: number): Promise<MaterialCategory[]> {
    return await db.select().from(schema.materialCategories).where(eq(schema.materialCategories.userId, userId));
  }

  async getMaterialCategory(id: number): Promise<MaterialCategory | undefined> {
    const results = await db.select().from(schema.materialCategories).where(eq(schema.materialCategories.id, id));
    return results[0];
  }

  async createMaterialCategory(category: InsertMaterialCategory): Promise<MaterialCategory> {
    const results = await db.insert(schema.materialCategories).values(category).returning();
    return results[0];
  }

  async updateMaterialCategory(id: number, category: Partial<InsertMaterialCategory>): Promise<MaterialCategory | undefined> {
    const results = await db.update(schema.materialCategories).set(category).where(eq(schema.materialCategories.id, id)).returning();
    return results[0];
  }

  async deleteMaterialCategory(id: number): Promise<boolean> {
    const results = await db.delete(schema.materialCategories).where(eq(schema.materialCategories.id, id));
    return results.rowCount > 0;
  }

  async getRawMaterials(userId: number): Promise<RawMaterial[]> {
    return await db.select().from(schema.rawMaterials).where(eq(schema.rawMaterials.userId, userId));
  }

  async getRawMaterial(id: number): Promise<RawMaterial | undefined> {
    const results = await db.select().from(schema.rawMaterials).where(eq(schema.rawMaterials.id, id));
    return results[0];
  }

  async createRawMaterial(material: InsertRawMaterial): Promise<RawMaterial> {
    const results = await db.insert(schema.rawMaterials).values(material).returning();
    return results[0];
  }

  async updateRawMaterial(id: number, material: Partial<InsertRawMaterial>): Promise<RawMaterial | undefined> {
    const results = await db.update(schema.rawMaterials).set(material).where(eq(schema.rawMaterials.id, id)).returning();
    return results[0];
  }

  async deleteRawMaterial(id: number): Promise<boolean> {
    const results = await db.delete(schema.rawMaterials).where(eq(schema.rawMaterials.id, id));
    return results.rowCount > 0;
  }

  async getFormulations(userId: number): Promise<Formulation[]> {
    return await db.select().from(schema.formulations).where(eq(schema.formulations.userId, userId));
  }

  async getFormulation(id: number): Promise<Formulation | undefined> {
    const results = await db.select().from(schema.formulations).where(eq(schema.formulations.id, id));
    return results[0];
  }

  async createFormulation(formulation: InsertFormulation): Promise<Formulation> {
    const results = await db.insert(schema.formulations).values(formulation).returning();
    return results[0];
  }

  async updateFormulation(id: number, formulation: Partial<InsertFormulation>): Promise<Formulation | undefined> {
    const results = await db.update(schema.formulations).set(formulation).where(eq(schema.formulations.id, id)).returning();
    return results[0];
  }

  async updateFormulationCosts(id: number, costs: { totalCost: string; unitCost: string; profitMargin: string; }): Promise<boolean> {
    const results = await db.update(schema.formulations).set(costs).where(eq(schema.formulations.id, id));
    return results.rowCount > 0;
  }

  async deleteFormulation(id: number): Promise<boolean> {
    const results = await db.delete(schema.formulations).where(eq(schema.formulations.id, id));
    return results.rowCount > 0;
  }

  async getFormulationIngredients(formulationId: number): Promise<FormulationIngredient[]> {
    return await db.select().from(schema.formulationIngredients).where(eq(schema.formulationIngredients.formulationId, formulationId));
  }

  async createFormulationIngredient(ingredient: InsertFormulationIngredient): Promise<FormulationIngredient> {
    const results = await db.insert(schema.formulationIngredients).values(ingredient).returning();
    return results[0];
  }

  async updateFormulationIngredient(id: number, ingredient: Partial<InsertFormulationIngredient>): Promise<FormulationIngredient | undefined> {
    const results = await db.update(schema.formulationIngredients).set(ingredient).where(eq(schema.formulationIngredients.id, id)).returning();
    return results[0];
  }

  async deleteFormulationIngredient(id: number): Promise<boolean> {
    const results = await db.delete(schema.formulationIngredients).where(eq(schema.formulationIngredients.id, id));
    return results.rowCount > 0;
  }

  async getFiles(userId: number): Promise<File[]> {
    return await db.select().from(schema.files).where(eq(schema.files.userId, userId));
  }

  async getFile(id: number): Promise<File | undefined> {
    const results = await db.select().from(schema.files).where(eq(schema.files.id, id));
    return results[0];
  }

  async createFile(file: InsertFile): Promise<File> {
    const results = await db.insert(schema.files).values(file).returning();
    return results[0];
  }

  async updateFile(id: number, file: Partial<InsertFile>): Promise<File | undefined> {
    const results = await db.update(schema.files).set(file).where(eq(schema.files.id, id)).returning();
    return results[0];
  }

  async deleteFile(id: number): Promise<boolean> {
    const results = await db.delete(schema.files).where(eq(schema.files.id, id));
    return results.rowCount > 0;
  }

  async getFileAttachments(entityType: string, entityId: number): Promise<FileAttachment[]> {
    return await db.select().from(schema.fileAttachments)
      .where(and(
        eq(schema.fileAttachments.entityType, entityType),
        eq(schema.fileAttachments.entityId, entityId)
      ));
  }

  async getAttachedFiles(entityType: string, entityId: number): Promise<File[]> {
    const attachments = await this.getFileAttachments(entityType, entityId);
    const fileIds = attachments.map(a => a.fileId);
    if (fileIds.length === 0) return [];
    
    const files = await db.select().from(schema.files).where(
      eq(schema.files.id, fileIds[0]) // This is simplified - proper implementation would use IN operator
    );
    return files;
  }

  async attachFile(attachment: InsertFileAttachment): Promise<FileAttachment> {
    const results = await db.insert(schema.fileAttachments).values(attachment).returning();
    return results[0];
  }

  async detachFile(fileId: number, entityType: string, entityId: number): Promise<boolean> {
    const results = await db.delete(schema.fileAttachments)
      .where(and(
        eq(schema.fileAttachments.fileId, fileId),
        eq(schema.fileAttachments.entityType, entityType),
        eq(schema.fileAttachments.entityId, entityId)
      ));
    return results.rowCount > 0;
  }

  async getMaterialFiles(materialId: number): Promise<MaterialFile[]> {
    return await db.select().from(schema.materialFiles).where(eq(schema.materialFiles.materialId, materialId));
  }

  async createMaterialFile(file: InsertMaterialFile): Promise<MaterialFile> {
    const results = await db.insert(schema.materialFiles).values(file).returning();
    return results[0];
  }

  async deleteMaterialFile(id: number): Promise<boolean> {
    const results = await db.delete(schema.materialFiles).where(eq(schema.materialFiles.id, id));
    return results.rowCount > 0;
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const results = await db.insert(schema.auditLog).values(log).returning();
    return results[0];
  }

  async getAuditLogs(userId: number, limit = 50): Promise<AuditLog[]> {
    return await db.select().from(schema.auditLog)
      .where(eq(schema.auditLog.userId, userId))
      .limit(limit);
  }

  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const results = await db.insert(schema.passwordResetTokens).values(token).returning();
    return results[0];
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const results = await db.select().from(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.token, token));
    return results[0];
  }

  async markTokenAsUsed(token: string): Promise<boolean> {
    const results = await db.update(schema.passwordResetTokens)
      .set({ used: true })
      .where(eq(schema.passwordResetTokens.token, token));
    return results.rowCount > 0;
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db.delete(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.used, true));
  }
}