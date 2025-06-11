import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { checkMaterialsLimit, checkFormulationsLimit, checkVendorsLimit, getUserSubscriptionInfo } from "./subscription-middleware";
import { 
  insertVendorSchema, insertMaterialCategorySchema, insertRawMaterialSchema,
  insertFormulationSchema, insertFormulationIngredientSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to recalculate formulation costs when material prices change
  async function updateFormulationsUsingMaterial(materialId: number) {
    try {
      // Get all formulations for user (using mock user ID 1)
      const formulations = await storage.getFormulations(1);
      
      for (const formulation of formulations) {
        // Get ingredients for this formulation
        const ingredients = await storage.getFormulationIngredients(formulation.id);
        
        // Check if this formulation uses the updated material
        const usesUpdatedMaterial = ingredients.some(ing => ing.materialId === materialId);
        
        if (usesUpdatedMaterial) {
          // Recalculate costs for this formulation
          let totalMaterialCost = 0;
          
          for (const ingredient of ingredients) {
            if (ingredient.materialId) {
              const material = await storage.getRawMaterial(ingredient.materialId);
              if (material) {
                const costContribution = Number(ingredient.quantity) * Number(material.unitCost);
                totalMaterialCost += costContribution;
                
                // Update the ingredient's cost contribution
                await storage.updateFormulationIngredient(ingredient.id, {
                  costContribution: costContribution.toFixed(2)
                });
              }
            }
          }
          
          // Calculate new formulation costs
          const batchSize = Number(formulation.batchSize || 1);
          const unitCost = batchSize > 0 ? totalMaterialCost / batchSize : 0;
          const markupPercentage = Number(formulation.markupPercentage || 30);
          const profitMargin = (markupPercentage / 100) * totalMaterialCost;
          
          // Update formulation with new calculated costs
          await storage.updateFormulationCosts(formulation.id, {
            totalCost: totalMaterialCost.toFixed(2),
            unitCost: unitCost.toFixed(4),
            profitMargin: profitMargin.toFixed(2),
          });
          
          // Create audit log for the automatic update
          await storage.createAuditLog({
            userId: 1,
            action: "update",
            entityType: "formulation",
            entityId: formulation.id,
            changes: JSON.stringify({
              description: `Automatically updated formulation "${formulation.name}" costs due to material price change. New total cost: $${totalMaterialCost.toFixed(2)}`,
              reason: "Material price change",
              materialId: materialId
            }),
          });
        }
      }
    } catch (error) {
      console.error("Error updating formulations after material price change:", error);
    }
  }

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
      
      // If unit cost changed, update all formulations that use this material
      if (material && originalMaterial.unitCost !== material.unitCost) {
        await updateFormulationsUsingMaterial(id);
      }
      
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
      let formulation = await storage.createFormulation(parsedFormulationData);
      
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
        
        // Calculate formulation costs based on ingredients
        const totalMaterialCost = ingredients.reduce((total, ing) => 
          total + Number(ing.costContribution || 0), 0);
        
        const batchSize = Number(formulation.batchSize || 1);
        const unitCost = batchSize > 0 ? totalMaterialCost / batchSize : 0;
        const markupPercentage = Number(formulation.markupPercentage || 30);
        const profitMargin = (markupPercentage / 100) * totalMaterialCost;
        
        // Update formulation with calculated costs
        await storage.updateFormulationCosts(formulation.id, {
          totalCost: totalMaterialCost.toFixed(2),
          unitCost: unitCost.toFixed(4),
          profitMargin: profitMargin.toFixed(2),
        });
        
        // Refresh formulation data
        formulation = await storage.getFormulation(formulation.id);
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
    
    // Calculate average profit margin based on selling price: (Selling Price - Cost) / Selling Price * 100
    const activeFormulationsWithTarget = formulations.filter(f => f.isActive && f.targetPrice && Number(f.targetPrice) > 0);
    const avgProfitMargin = activeFormulationsWithTarget.length > 0 
      ? activeFormulationsWithTarget.reduce((sum, f) => {
          const targetPrice = Number(f.targetPrice);
          const cost = Number(f.totalCost);
          return sum + ((targetPrice - cost) / targetPrice * 100);
        }, 0) / activeFormulationsWithTarget.length
      : 0;

    // Add cache control headers to prevent stale data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

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

  app.put("/api/user/subscription", async (req, res) => {
    try {
      const userId = 1; // Mock user ID for demo
      const { plan, status } = req.body;
      
      const updates = { 
        subscriptionPlan: plan, 
        subscriptionStatus: status,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: plan === 'unlimited' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      };
      const user = await storage.updateUser(userId, updates);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ success: true, message: "Subscription updated successfully" });
    } catch (error) {
      res.status(400).json({ error: "Invalid subscription data" });
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

  // PayPal routes
  app.get("/setup", loadPaypalDefault);
  app.post("/order", createPaypalOrder);
  app.post("/order/:orderID/capture", capturePaypalOrder);

  // Shopify subscription redirect (replaces PayPal integration)
  app.post("/api/subscribe", async (req, res) => {
    try {
      const { planId } = req.body;
      
      // Return Shopify store URLs for each plan
      const shopifyUrls: Record<string, string> = {
        starter: process.env.SHOPIFY_STARTER_URL || 'https://your-store.myshopify.com/products/pipps-starter',
        professional: process.env.SHOPIFY_PROFESSIONAL_URL || 'https://your-store.myshopify.com/products/pipps-professional'
      };
      
      const redirectUrl = shopifyUrls[planId as string];
      if (!redirectUrl) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }
      
      res.json({ 
        success: true, 
        message: "Redirecting to Shopify for secure payment",
        redirectUrl: redirectUrl,
        planId: planId
      });
    } catch (error) {
      console.error("Failed to create subscription redirect:", error);
      res.status(500).json({ error: "Failed to process subscription request" });
    }
  });

  app.post("/api/subscription/activate", async (req, res) => {
    const userId = 1; // Mock user ID - replace with proper auth later

    try {
      const { orderId, planId } = req.body;
      
      // Handle free tier activation
      if (orderId === "free") {
        await storage.updateUser(userId, {
          subscriptionStatus: 'active',
          subscriptionPlan: planId,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: null // Free tier doesn't expire
        } as any);

        res.json({ success: true, subscription: { status: 'active', plan: planId } });
        return;
      }
      
      // Capture the payment for paid plans
      const captureResponse = await fetch(`${req.protocol}://${req.get('host')}/order/${orderId}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const captureData = await captureResponse.json();
      
      if (captureData.status === 'COMPLETED') {
        // Activate subscription
        await storage.updateUser(userId, {
          subscriptionStatus: 'active',
          subscriptionPlan: planId,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        } as any);

        res.json({ success: true, subscription: { status: 'active', plan: planId } });
      } else {
        res.status(400).json({ error: "Payment not completed" });
      }
    } catch (error) {
      console.error("Subscription activation failed:", error);
      res.status(500).json({ error: "Failed to activate subscription" });
    }
  });

  app.get("/api/subscription/status", async (req, res) => {
    const userId = 1; // Mock user ID - replace with proper auth later

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        status: (user as any).subscriptionStatus || 'free',
        plan: (user as any).subscriptionPlan || 'free',
        startDate: (user as any).subscriptionStartDate,
        endDate: (user as any).subscriptionEndDate
      });
    } catch (error) {
      console.error("Failed to get subscription status:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  app.get("/api/subscription/info", async (req, res) => {
    const userId = 1; // Mock user ID - replace with proper auth later

    try {
      const subscriptionInfo = await getUserSubscriptionInfo(userId);
      if (!subscriptionInfo) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(subscriptionInfo);
    } catch (error) {
      console.error("Failed to get subscription info:", error);
      res.status(500).json({ error: "Failed to get subscription info" });
    }
  });

  // Shopify webhook endpoints for subscription management
  app.post("/webhooks/shopify/subscription/created", async (req, res) => {
    try {
      const { customer_email, line_items, id: order_id } = req.body;
      
      // Find user by email or create new user
      let user = await storage.getUserByEmail(customer_email);
      if (!user) {
        // Create new user account
        user = await storage.createUser({
          username: customer_email.split('@')[0],
          email: customer_email,
          password: 'temp_password', // User will need to set password on first login
          company: '',
          role: 'user'
        });
      }

      // Determine subscription plan based on Shopify product
      let planId = 'free';
      const productTitle = line_items[0]?.title?.toLowerCase() || '';
      
      if (productTitle.includes('starter')) {
        planId = 'starter';
      } else if (productTitle.includes('professional')) {
        planId = 'professional';
      }

      // Activate subscription
      await storage.updateUser(user.id, {
        subscriptionStatus: 'active',
        subscriptionPlan: planId,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        paypalSubscriptionId: order_id.toString()
      } as any);

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "create",
        entityType: "vendor",
        entityId: 0,
        changes: JSON.stringify({
          description: `Subscription activated via Shopify: ${planId} plan for ${customer_email}`,
          shopifyOrderId: order_id,
          plan: planId
        }),
      });

      res.json({ success: true, message: `${planId} subscription activated for ${customer_email}` });
    } catch (error) {
      console.error("Shopify webhook error:", error);
      res.status(500).json({ error: "Failed to process subscription" });
    }
  });

  app.post("/webhooks/shopify/subscription/cancelled", async (req, res) => {
    try {
      const { customer_email } = req.body;
      
      const user = await storage.getUserByEmail(customer_email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Downgrade to free plan
      await storage.updateUser(user.id, {
        subscriptionStatus: 'active',
        subscriptionPlan: 'free',
        subscriptionEndDate: null
      } as any);

      res.json({ success: true, message: `Subscription cancelled for ${customer_email}, downgraded to free plan` });
    } catch (error) {
      console.error("Shopify webhook error:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Instant trial account creation
  app.post("/api/users/create-trial", async (req, res) => {
    try {
      const { email } = req.body;
      const trialEmail = email || `trial_${Date.now()}@trial.local`;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(trialEmail);
      if (existingUser) {
        return res.json({ 
          success: true, 
          message: "Account exists, logging in",
          userId: existingUser.id
        });
      }

      // Create new trial user
      const user = await storage.createUser({
        username: trialEmail.split('@')[0],
        email: trialEmail,
        password: 'trial_password', // Simple password for trials
        company: '',
        role: 'user'
      });

      // Set free plan
      await storage.updateUser(user.id, {
        subscriptionStatus: 'active',
        subscriptionPlan: 'free',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: null
      } as any);

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "create",
        entityType: "vendor",
        entityId: 0,
        changes: JSON.stringify({
          description: `Trial account created: ${trialEmail}`,
          plan: 'free'
        }),
      });

      res.json({ 
        success: true, 
        message: "Trial account created",
        userId: user.id
      });
    } catch (error) {
      console.error("Trial creation error:", error);
      res.status(500).json({ error: "Failed to create trial account" });
    }
  });

  // User account creation endpoint for Shopify integration
  app.post("/api/users/create-from-shopify", async (req, res) => {
    try {
      const { email, planId = 'free' } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.json({ 
          success: true, 
          message: "User already exists",
          userId: existingUser.id,
          loginUrl: `${req.protocol}://${req.get('host')}/login?email=${email}`
        });
      }

      // Create new user
      const user = await storage.createUser({
        username: email.split('@')[0],
        email: email,
        password: 'temp_password', // User will set password on first login
        company: '',
        role: 'user'
      });

      // Set subscription plan
      await storage.updateUser(user.id, {
        subscriptionStatus: 'active',
        subscriptionPlan: planId,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: planId === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      } as any);

      res.json({ 
        success: true, 
        message: "User account created",
        userId: user.id,
        loginUrl: `${req.protocol}://${req.get('host')}/login?email=${email}`
      });
    } catch (error) {
      console.error("User creation error:", error);
      res.status(500).json({ error: "Failed to create user account" });
    }
  });

  // Export routes
  app.get("/api/export/materials", async (req, res) => {
    try {
      const format = req.query.format as string || 'json';
      const materials = await storage.getRawMaterials(1);
      const categories = await storage.getMaterialCategories(1);
      const vendors = await storage.getVendors(1);

      // Create comprehensive export data
      const exportData = materials.map(material => ({
        ...material,
        categoryName: categories.find(c => c.id === material.categoryId)?.name || '',
        vendorName: vendors.find(v => v.id === material.vendorId)?.name || ''
      }));

      if (format === 'csv') {
        // Convert to CSV format
        const headers = ['Name', 'SKU', 'Category', 'Vendor', 'Total Cost', 'Quantity', 'Unit', 'Unit Cost', 'Notes', 'Active'];
        const csvData = [
          headers.join(','),
          ...exportData.map(material => [
            `"${material.name}"`,
            `"${material.sku || ''}"`,
            `"${material.categoryName}"`,
            `"${material.vendorName}"`,
            material.totalCost,
            material.quantity,
            `"${material.unit}"`,
            material.unitCost,
            `"${material.notes || ''}"`,
            material.isActive
          ].join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="materials.csv"');
        res.send(csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="materials.json"');
        res.json(exportData);
      }
    } catch (error) {
      console.error("Export materials error:", error);
      res.status(500).json({ error: "Failed to export materials" });
    }
  });

  app.get("/api/export/formulations", async (req, res) => {
    try {
      const formulations = await storage.getFormulations(1);
      
      // Get detailed formulation data with ingredients
      const exportData = await Promise.all(
        formulations.map(async (formulation) => {
          const ingredients = await storage.getFormulationIngredients(formulation.id);
          return {
            ...formulation,
            ingredients
          };
        })
      );

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="formulations.json"');
      res.json(exportData);
    } catch (error) {
      console.error("Export formulations error:", error);
      res.status(500).json({ error: "Failed to export formulations" });
    }
  });

  app.get("/api/export/backup", async (req, res) => {
    try {
      const materials = await storage.getRawMaterials(1);
      const formulations = await storage.getFormulations(1);
      const vendors = await storage.getVendors(1);
      const categories = await storage.getMaterialCategories(1);

      // Get detailed formulation data with ingredients
      const formulationsWithIngredients = await Promise.all(
        formulations.map(async (formulation) => {
          const ingredients = await storage.getFormulationIngredients(formulation.id);
          return {
            ...formulation,
            ingredients
          };
        })
      );

      const backupData = {
        exportDate: new Date().toISOString(),
        materials,
        formulations: formulationsWithIngredients,
        vendors,
        categories
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="pipps-backup.json"');
      res.json(backupData);
    } catch (error) {
      console.error("Export backup error:", error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  // Template download routes
  app.get("/api/templates/materials", async (req, res) => {
    try {
      const categories = await storage.getMaterialCategories(1);
      const vendors = await storage.getVendors(1);

      const template = {
        materials: [
          {
            name: "Example Material",
            sku: "EX001",
            categoryId: categories[0]?.id || 1,
            vendorId: vendors[0]?.id || null,
            totalCost: "100.00",
            quantity: "50.000",
            unit: "kg",
            notes: "Example material for import template",
            isActive: true
          }
        ],
        instructions: {
          name: "Material name (required)",
          sku: "Stock keeping unit (optional)",
          categoryId: `Category ID - Available options: ${categories.map(c => `${c.id}="${c.name}"`).join(', ')}`,
          vendorId: `Vendor ID - Available options: ${vendors.map(v => `${v.id}="${v.name}"`).join(', ')} or null`,
          totalCost: "Total cost as decimal string",
          quantity: "Quantity as decimal string",
          unit: "Unit of measurement (kg, g, L, ml, pcs, etc.)",
          notes: "Optional notes",
          isActive: "Boolean - true or false"
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="materials-template.json"');
      res.json(template);
    } catch (error) {
      console.error("Template download error:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  app.get("/api/templates/formulations", async (req, res) => {
    try {
      const materials = await storage.getRawMaterials(1);

      const template = {
        formulations: [
          {
            name: "Example Formulation",
            description: "Sample product formulation",
            batchSize: "1.000",
            batchUnit: "unit",
            targetPrice: "100.00",
            markupPercentage: "30.00",
            ingredients: [
              {
                materialId: materials[0]?.id || 1,
                quantity: "10.000",
                unit: "g",
                includeInMarkup: true,
                notes: "Main ingredient"
              }
            ]
          }
        ],
        instructions: {
          name: "Formulation name (required)",
          description: "Product description (optional)",
          batchSize: "Batch size as decimal string",
          batchUnit: "Batch unit (unit, kg, L, etc.)",
          targetPrice: "Target selling price",
          markupPercentage: "Markup percentage for profit calculation",
          ingredients: "Array of ingredients",
          materialId: `Material ID - Available options: ${materials.slice(0, 5).map(m => `${m.id}="${m.name}"`).join(', ')}`,
          quantity: "Ingredient quantity as decimal string",
          unit: "Ingredient unit of measurement",
          includeInMarkup: "Boolean - whether to include in markup calculation",
          notes: "Optional ingredient notes"
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="formulations-template.json"');
      res.json(template);
    } catch (error) {
      console.error("Template download error:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  // Import routes
  app.post("/api/import/materials", async (req, res) => {
    try {
      const { materials } = req.body;
      
      if (!Array.isArray(materials)) {
        return res.status(400).json({ error: "Invalid materials data format" });
      }

      const importResults = {
        success: 0,
        errors: [] as string[]
      };

      for (const materialData of materials) {
        try {
          const materialToCreate = insertRawMaterialSchema.parse({
            ...materialData,
            userId: 1
          });
          
          await storage.createRawMaterial(materialToCreate);
          importResults.success++;
        } catch (error) {
          importResults.errors.push(`Failed to import material "${materialData.name}": ${error}`);
        }
      }

      res.json({
        message: `Import completed: ${importResults.success} materials imported successfully`,
        ...importResults
      });
    } catch (error) {
      console.error("Import materials error:", error);
      res.status(500).json({ error: "Failed to import materials" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
