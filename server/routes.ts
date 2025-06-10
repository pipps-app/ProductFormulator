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
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1,
        action: "create",
        entityType: "vendor",
        entityId: vendor.id,
        changes: JSON.stringify({
          description: `Added new vendor "${vendor.name}"${vendor.contactEmail ? ` with email ${vendor.contactEmail}` : ''}`,
          data: vendor
        }),
      });
      
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });

  app.put("/api/vendors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const originalVendor = await storage.getVendor(id);
      if (!originalVendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      const vendorData = insertVendorSchema.partial().parse(req.body);
      const vendor = await storage.updateVendor(id, vendorData);
      
      // Create audit log
      if (vendor) {
        const emailChange = originalVendor.contactEmail !== vendor.contactEmail 
          ? ` (email changed to ${vendor.contactEmail || 'none'})`
          : '';
        await storage.createAuditLog({
          userId: 1,
          action: "update",
          entityType: "vendor",
          entityId: id,
          changes: JSON.stringify({
            description: `Updated vendor "${vendor.name}"${emailChange}`,
            before: originalVendor,
            after: vendor
          }),
        });
      }
      
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });

  app.delete("/api/vendors/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const vendor = await storage.getVendor(id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const deleted = await storage.deleteVendor(id);
    
    // Create audit log
    await storage.createAuditLog({
      userId: 1,
      action: "delete",
      entityType: "vendor",
      entityId: id,
      changes: JSON.stringify({
        description: `Deleted vendor "${vendor.name}"${vendor.contactEmail ? ` (${vendor.contactEmail})` : ''}`,
        data: vendor
      }),
    });
    
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
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1,
        action: "create",
        entityType: "category",
        entityId: category.id,
        changes: JSON.stringify({
          description: `Created new category "${category.name}" with ${category.color} color`,
          data: category
        }),
      });
      
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.put("/api/material-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const originalCategory = await storage.getMaterialCategory(id);
      if (!originalCategory) {
        return res.status(404).json({ error: "Category not found" });
      }

      const categoryData = insertMaterialCategorySchema.partial().parse(req.body);
      const category = await storage.updateMaterialCategory(id, categoryData);
      
      // Create audit log
      if (category) {
        const colorChange = originalCategory.color !== category.color 
          ? ` (color changed to ${category.color})`
          : '';
        await storage.createAuditLog({
          userId: 1,
          action: "update",
          entityType: "category",
          entityId: id,
          changes: JSON.stringify({
            description: `Updated category "${category.name}"${colorChange}`,
            before: originalCategory,
            after: category
          }),
        });
      }
      
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.delete("/api/material-categories/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const category = await storage.getMaterialCategory(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const deleted = await storage.deleteMaterialCategory(id);
    
    // Create audit log
    await storage.createAuditLog({
      userId: 1,
      action: "delete",
      entityType: "category",
      entityId: id,
      changes: JSON.stringify({
        description: `Deleted category "${category.name}" (${category.color} color)`,
        data: category
      }),
    });
    
    res.json({ success: true });
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
        changes: JSON.stringify({
          description: `Added new raw material "${material.name}" with a total cost of $${material.totalCost} for ${material.quantity} ${material.unit}`,
          data: material
        }),
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
      if (material) {
        const unitCostChange = originalMaterial.unitCost !== material.unitCost 
          ? ` (unit cost changed from $${originalMaterial.unitCost} to $${material.unitCost})`
          : '';
        await storage.createAuditLog({
          userId: 1,
          action: "update",
          entityType: "material",
          entityId: id,
          changes: JSON.stringify({
            description: `Updated raw material "${material.name}" - total cost is now $${material.totalCost} for ${material.quantity} ${material.unit}${unitCostChange}`,
            before: originalMaterial,
            after: material
          }),
        });
      }
      
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
      changes: JSON.stringify({
        description: `Deleted raw material "${material.name}" (was $${material.totalCost} total cost for ${material.quantity} ${material.unit})`,
        data: material
      }),
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
      const { ingredients, ...formulationData } = req.body;
      const parsedFormulationData = insertFormulationSchema.parse({ ...formulationData, userId: 1 });
      const formulation = await storage.createFormulation(parsedFormulationData);
      
      // Create formulation ingredients if provided
      if (ingredients && Array.isArray(ingredients)) {
        for (const ingredient of ingredients) {
          await storage.createFormulationIngredient({
            formulationId: formulation.id,
            materialId: ingredient.materialId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            costContribution: ingredient.costContribution,
            includeInMarkup: ingredient.includeInMarkup || true,
          });
        }
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1,
        action: "create",
        entityType: "formulation",
        entityId: formulation.id,
        changes: JSON.stringify({
          description: `Created new formulation "${formulation.name}" with batch size of ${formulation.batchSize} ${formulation.batchUnit} and ${formulation.markupPercentage}% markup`,
          data: formulation,
          ingredients: ingredients
        }),
      });
      
      res.json(formulation);
    } catch (error) {
      console.error("Error creating formulation:", error);
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

      const { ingredients, ...formulationData } = req.body;
      console.log("Updating formulation with ingredients:", ingredients);
      const parsedFormulationData = insertFormulationSchema.partial().parse(formulationData);
      let formulation = await storage.updateFormulation(id, parsedFormulationData);
      
      // Update formulation ingredients if provided
      if (ingredients && Array.isArray(ingredients)) {
        // Get existing ingredients
        const existingIngredients = await storage.getFormulationIngredients(id);
        
        // Delete existing ingredients
        for (const existingIngredient of existingIngredients) {
          await storage.deleteFormulationIngredient(existingIngredient.id);
        }
        
        // Create new ingredients
        for (const ingredient of ingredients) {
          await storage.createFormulationIngredient({
            formulationId: id,
            materialId: ingredient.materialId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            costContribution: ingredient.costContribution,
            includeInMarkup: ingredient.includeInMarkup || true,
          });
        }
        
        // Recalculate formulation costs based on new ingredients
        const totalMaterialCost = ingredients.reduce((total, ing) => 
          total + Number(ing.costContribution || 0), 0);
        
        const batchSize = Number(formulation?.batchSize || 1);
        const unitCost = batchSize > 0 ? totalMaterialCost / batchSize : 0;
        const markupPercentage = Number(formulation?.markupPercentage || 30);
        const profitMargin = (markupPercentage / 100) * totalMaterialCost;
        
        // Update formulation with calculated costs using storage updateFormulationCosts method
        await storage.updateFormulationCosts(id, {
          totalCost: totalMaterialCost.toFixed(2),
          unitCost: unitCost.toFixed(4),
          profitMargin: profitMargin.toFixed(2),
        });
        
        // Refresh formulation data
        formulation = await storage.getFormulation(id);
      }
      
      // Create audit log
      if (formulation) {
        const costChange = originalFormulation.totalCost !== formulation.totalCost 
          ? ` (total cost changed from $${originalFormulation.totalCost} to $${formulation.totalCost})`
          : '';
        await storage.createAuditLog({
          userId: 1,
          action: "update",
          entityType: "formulation",
          entityId: id,
          changes: JSON.stringify({
            description: `Updated formulation "${formulation.name}" - batch size is now ${formulation.batchSize} ${formulation.batchUnit} with ${formulation.markupPercentage}% markup${costChange}`,
            before: originalFormulation,
            after: formulation,
            ingredients: ingredients
          }),
        });
      }
      
      res.json(formulation);
    } catch (error) {
      console.error("Error updating formulation:", error);
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
      changes: JSON.stringify({
        description: `Deleted formulation "${formulation.name}" (was ${formulation.batchSize} ${formulation.batchUnit} batch with $${formulation.totalCost} total cost)`,
        data: formulation
      }),
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
    });
  });

  // Recent activity
  app.get("/api/dashboard/recent-activity", async (req, res) => {
    const userId = 1;
    const auditLogs = await storage.getAuditLogs(userId, 10);
    res.json(auditLogs);
  });

  // User profile management
  app.get("/api/user/profile", async (req, res) => {
    const userId = 1; // Mock user ID
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.put("/api/user/profile", async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      const { username, email, company } = req.body;
      
      const updates = { username, email, company };
      const user = await storage.updateUser(userId, updates);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  app.put("/api/user/password", async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      const { currentPassword, newPassword } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // In a real app, you'd verify the current password
      // For now, we'll just update to the new password
      const updated = await storage.updateUserPassword(userId, newPassword);
      
      if (!updated) {
        return res.status(400).json({ error: "Failed to update password" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Invalid password data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
