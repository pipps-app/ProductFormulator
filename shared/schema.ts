import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"), // Optional for OAuth users
  company: text("company"),
  role: text("role").notNull().default("user"), // "admin" or "user"
  profileImage: text("profile_image"), // For OAuth profile pictures
  googleId: text("google_id").unique(), // Google OAuth ID
  authProvider: text("auth_provider").notNull().default("local"), // "local", "google"
  subscriptionStatus: text("subscription_status").default("none"),
  subscriptionPlan: text("subscription_plan"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  paypalSubscriptionId: text("paypal_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  notes: text("notes"),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const materialCategories = pgTable("material_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  userId: integer("user_id").notNull().references(() => users.id),
});

export const rawMaterials = pgTable("raw_materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku"),
  categoryId: integer("category_id").references(() => materialCategories.id),
  vendorId: integer("vendor_id").references(() => vendors.id),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(), // kg, L, g, ml, etc.
  unitCost: decimal("unit_cost", { precision: 10, scale: 4 }).notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const formulations = pgTable("formulations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  batchSize: decimal("batch_size", { precision: 10, scale: 3 }).notNull(),
  batchUnit: text("batch_unit").notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }),
  markupPercentage: decimal("markup_percentage", { precision: 5, scale: 2 }).default("30.00"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull().default("0.00"),
  unitCost: decimal("unit_cost", { precision: 10, scale: 4 }).notNull().default("0.00"),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const formulationIngredients = pgTable("formulation_ingredients", {
  id: serial("id").primaryKey(),
  formulationId: integer("formulation_id").notNull().references(() => formulations.id, { onDelete: "cascade" }),
  materialId: integer("material_id").references(() => rawMaterials.id, { onDelete: "set null" }),
  subFormulationId: integer("sub_formulation_id").references(() => formulations.id, { onDelete: "set null" }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  costContribution: decimal("cost_contribution", { precision: 10, scale: 4 }).notNull().default("0.00"),
  includeInMarkup: boolean("include_in_markup").default(true),
  notes: text("notes"),
});

// Central file library for shared files
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  description: text("description"),
  tags: text("tags").array(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// File attachments linking files to entities
export const fileAttachments = pgTable("file_attachments", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull().references(() => files.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(), // "material", "formulation"
  entityId: integer("entity_id").notNull(),
  attachedAt: timestamp("attached_at").defaultNow(),
});

// Keep legacy table for backward compatibility
export const materialFiles = pgTable("material_files", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull().references(() => rawMaterials.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // "create", "update", "delete"
  entityType: text("entity_type").notNull(), // "material", "formulation", "vendor"
  entityId: integer("entity_id").notNull(),
  changes: text("changes"), // JSON string with description and changes
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
});

export const insertMaterialCategorySchema = createInsertSchema(materialCategories).omit({
  id: true,
});

export const insertRawMaterialSchema = createInsertSchema(rawMaterials).omit({
  id: true,
  unitCost: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFormulationSchema = createInsertSchema(formulations).omit({
  id: true,
  totalCost: true,
  unitCost: true,
  profitMargin: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFormulationIngredientSchema = createInsertSchema(formulationIngredients).omit({
  id: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadedAt: true,
});

export const insertFileAttachmentSchema = createInsertSchema(fileAttachments).omit({
  id: true,
  attachedAt: true,
});

export const insertMaterialFileSchema = createInsertSchema(materialFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type MaterialCategory = typeof materialCategories.$inferSelect;
export type InsertMaterialCategory = z.infer<typeof insertMaterialCategorySchema>;

export type RawMaterial = typeof rawMaterials.$inferSelect;
export type InsertRawMaterial = z.infer<typeof insertRawMaterialSchema>;

export type Formulation = typeof formulations.$inferSelect;
export type InsertFormulation = z.infer<typeof insertFormulationSchema>;

export type FormulationIngredient = typeof formulationIngredients.$inferSelect;
export type InsertFormulationIngredient = z.infer<typeof insertFormulationIngredientSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type FileAttachment = typeof fileAttachments.$inferSelect;
export type InsertFileAttachment = z.infer<typeof insertFileAttachmentSchema>;

export type MaterialFile = typeof materialFiles.$inferSelect;
export type InsertMaterialFile = z.infer<typeof insertMaterialFileSchema>;

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
