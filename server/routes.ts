import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertVendorSchema, insertMaterialCategorySchema, insertRawMaterialSchema,
  insertFormulationSchema, insertFormulationIngredientSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Vendors
  app.get("/api/vendors", async (req, res) => {
    const userId = 1; // Mock user ID for now
    const vendors = await storage.getVendors(userId);
    res.json(vendors);
  });

  app.post("/api/vendors", async (req, res) => {
    try {
      const vendorData = insertVendorSchema.parse({ ...req.body, userId: 1 });
      const vendor = await storage.createVendor(vendorData);
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });

  app.put("/api/vendors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vendorData = insertVendorSchema.partial().parse(req.body);
      const vendor = await storage.updateVendor(id, vendorData);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });

  app.delete("/api/vendors/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteVendor(id);
    if (!deleted) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json({ success: true });
  });

  // Material Categories
  app.get("/api/material-categories", async (req, res) => {
    const userId = 1;
    const categories = await storage.getMaterialCategories(userId);
    res.json(categories);
  });

  app.post("/api/material-categories", async (req, res) => {
    try {
      const categoryData = insertMaterialCategorySchema.parse({ ...req.body, userId: 1 });
      const category = await storage.createMaterialCategory(categoryData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  // Raw Materials
  app.get("/api/raw-materials", async (req, res) => {
    const userId = 1;
    const materials = await storage.getRawMaterials(userId);
    res.json(materials);
  });

  app.get("/api/raw-materials/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const material = await storage.getRawMaterial(id);
    if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }
    res.json(material);
  });

  app.post("/api/raw-materials", async (req, res) => {
    try {
      const materialData = insertRawMaterialSchema.parse({ ...req.body, userId: 1 });
      const material = await storage.createRawMaterial(materialData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1,
        action: "create",
        entityType: "material",
        entityId: material.id,
        changes: JSON.stringify(material),
      });
      
      res.json(material);
    } catch (error) {
      res.status(400).json({ error: "Invalid material data" });
    }
  });

  app.put("/api/raw-materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const originalMaterial = await storage.getRawMaterial(id);
      if (!originalMaterial) {
        return res.status(404).json({ error: "Material not found" });
      }

      const materialData = insertRawMaterialSchema.partial().parse(req.body);
      const material = await storage.updateRawMaterial(id, materialData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1,
        action: "update",
        entityType: "material",
        entityId: id,
        changes: JSON.stringify({ before: originalMaterial, after: material }),
      });
      
      res.json(material);
    } catch (error) {
      res.status(400).json({ error: "Invalid material data" });
    }
  });

  app.delete("/api/raw-materials/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const material = await storage.getRawMaterial(id);
    if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }

    const deleted = await storage.deleteRawMaterial(id);
    
    // Create audit log
    await storage.createAuditLog({
      userId: 1,
      action: "delete",
      entityType: "material",
      entityId: id,
      changes: JSON.stringify(material),
    });
    
    res.json({ success: true });
  });

  // Formulations
  app.get("/api/formulations", async (req, res) => {
    const userId = 1;
    const formulations = await storage.getFormulations(userId);
    res.json(formulations);
  });

  app.get("/api/formulations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const formulation = await storage.getFormulation(id);
    if (!formulation) {
      return res.status(404).json({ error: "Formulation not found" });
    }
    res.json(formulation);
  });

  app.post("/api/formulations", async (req, res) => {
    try {
      const formulationData = insertFormulationSchema.parse({ ...req.body, userId: 1 });
      const formulation = await storage.createFormulation(formulationData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1,
        action: "create",
        entityType: "formulation",
        entityId: formulation.id,
        changes: JSON.stringify(formulation),
      });
      
      res.json(formulation);
    } catch (error) {
      res.status(400).json({ error: "Invalid formulation data" });
    }
  });

  app.put("/api/formulations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const originalFormulation = await storage.getFormulation(id);
      if (!originalFormulation) {
        return res.status(404).json({ error: "Formulation not found" });
      }

      const formulationData = insertFormulationSchema.partial().parse(req.body);
      const formulation = await storage.updateFormulation(id, formulationData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1,
        action: "update",
        entityType: "formulation",
        entityId: id,
        changes: JSON.stringify({ before: originalFormulation, after: formulation }),
      });
      
      res.json(formulation);
    } catch (error) {
      res.status(400).json({ error: "Invalid formulation data" });
    }
  });

  app.delete("/api/formulations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const formulation = await storage.getFormulation(id);
    if (!formulation) {
      return res.status(404).json({ error: "Formulation not found" });
    }

    const deleted = await storage.deleteFormulation(id);
    
    // Create audit log
    await storage.createAuditLog({
      userId: 1,
      action: "delete",
      entityType: "formulation",
      entityId: id,
      changes: JSON.stringify(formulation),
    });
    
    res.json({ success: true });
  });

  // Formulation Ingredients
  app.get("/api/formulations/:id/ingredients", async (req, res) => {
    const formulationId = parseInt(req.params.id);
    const ingredients = await storage.getFormulationIngredients(formulationId);
    res.json(ingredients);
  });

  app.post("/api/formulations/:id/ingredients", async (req, res) => {
    try {
      const formulationId = parseInt(req.params.id);
      const ingredientData = insertFormulationIngredientSchema.parse({ 
        ...req.body, 
        formulationId 
      });
      const ingredient = await storage.createFormulationIngredient(ingredientData);
      res.json(ingredient);
    } catch (error) {
      res.status(400).json({ error: "Invalid ingredient data" });
    }
  });

  app.put("/api/formulation-ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ingredientData = insertFormulationIngredientSchema.partial().parse(req.body);
      const ingredient = await storage.updateFormulationIngredient(id, ingredientData);
      if (!ingredient) {
        return res.status(404).json({ error: "Ingredient not found" });
      }
      res.json(ingredient);
    } catch (error) {
      res.status(400).json({ error: "Invalid ingredient data" });
    }
  });

  app.delete("/api/formulation-ingredients/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteFormulationIngredient(id);
    if (!deleted) {
      return res.status(404).json({ error: "Ingredient not found" });
    }
    res.json({ success: true });
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    const userId = 1;
    const materials = await storage.getRawMaterials(userId);
    const formulations = await storage.getFormulations(userId);
    const vendors = await storage.getVendors(userId);
    
    const totalMaterials = materials.length;
    const activeFormulations = formulations.filter(f => f.isActive).length;
    const totalInventoryValue = materials.reduce((sum, m) => sum + Number(m.totalCost), 0);
    
    // Calculate average profit margin
    const activeFormulationsWithMargin = formulations.filter(f => f.isActive && Number(f.profitMargin) > 0);
    const avgProfitMargin = activeFormulationsWithMargin.length > 0 
      ? activeFormulationsWithMargin.reduce((sum, f) => sum + Number(f.profitMargin), 0) / activeFormulationsWithMargin.length
      : 0;

    res.json({
      totalMaterials,
      activeFormulations,
      vendorsCount: vendors.length,
      avgProfitMargin: avgProfitMargin.toFixed(1),
      inventoryValue: totalInventoryValue.toFixed(2),
    });
  });

  // Recent activity
  app.get("/api/dashboard/recent-activity", async (req, res) => {
    const userId = 1;
    const auditLogs = await storage.getAuditLogs(userId, 10);
    res.json(auditLogs);
  });

  const httpServer = createServer(app);
  return httpServer;
}
