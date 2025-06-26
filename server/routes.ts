import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { reportsService } from "./reports";
import { registerPaymentRoutes } from "./routes/payments";
import { emailService } from "./email";

function hasAccessToTier(userTier: string, requiredTier: string): boolean {
  const tierHierarchy = ['free', 'pro', 'business', 'enterprise'];
  const userTierIndex = tierHierarchy.indexOf(userTier);
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
  
  // Higher tier users can access lower tier features
  // e.g., enterprise users can access pro, business, and free features
  return userTierIndex >= requiredTierIndex;
}

function getReportsPreview(userTier: string, requestedTier: string) {
  const reportPreviews: Record<string, any> = {
    starter: {
      title: "Starter Plan Reports",
      description: "Basic reporting features:",
      reports: [
        { title: "Basic Cost Summary", description: "Simple cost calculations and material usage" },
        { title: "Formulation Overview", description: "Basic formulation cost breakdown" }
      ]
    },
    pro: {
      title: "Pro Plan Reports",
      description: "All Starter reports plus:",
      reports: [
        { title: "Cost Analysis by Category", description: "Detailed breakdown of material costs by category with trends" },
        { title: "Vendor Performance Report", description: "Analysis of vendor pricing, reliability, and cost efficiency" },
        { title: "Monthly Expense Summary", description: "Comprehensive monthly spending analysis with comparisons" },
        { title: "Price Trend Analysis", description: "Historical price movements and forecasting for materials" }
      ]
    },
    professional: {
      title: "Professional Plan Reports",
      description: "All Pro reports plus:",
      reports: [
        { title: "Advanced Cost Analytics", description: "Enhanced cost modeling and trend analysis" },
        { title: "Batch Optimization Report", description: "Batch size and efficiency optimization insights" },
        { title: "Margin Analysis", description: "Detailed profit margin tracking and forecasting" }
      ]
    },
    business: {
      title: "Business Plan Reports", 
      description: "All Professional reports plus:",
      reports: [
        { title: "Profit Margin Analysis", description: "Detailed profit analysis by product and formulation" },
        { title: "Advanced Inventory Insights", description: "Stock optimization and reorder recommendations" },
        { title: "Formulation Efficiency Report", description: "Analysis of formulation performance and cost optimization" },
        { title: "Quarterly Business Review", description: "Comprehensive quarterly performance and trends analysis" }
      ]
    },
    enterprise: {
      title: "Enterprise Plan Reports",
      description: "All Business reports plus:",
      reports: [
        { title: "Advanced Financial Analytics", description: "Comprehensive financial modeling and forecasting" },
        { title: "Multi-Location Analysis", description: "Cross-location performance and cost comparisons" },
        { title: "Custom KPI Dashboard", description: "Personalized metrics and business intelligence insights" },
        { title: "Executive Summary Report", description: "High-level strategic insights and recommendations" },
        { title: "Competitive Analysis", description: "Market positioning and competitive benchmarking" }
      ]
    }
  };

  return reportPreviews[requestedTier] || { title: "Unknown Plan", description: "", reports: [] };
}
import { checkMaterialsLimit, checkFormulationsLimit, checkVendorsLimit, getUserSubscriptionInfo } from "./subscription-middleware";
import { 
  insertVendorSchema, insertMaterialCategorySchema, insertRawMaterialSchema,
  insertFormulationSchema, insertFormulationIngredientSchema, insertUserSchema,
  insertFileSchema, insertFileAttachmentSchema
} from "@shared/schema";
import passport from "./auth";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";
import "./types";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  function requireAuth(req: any, res: any, next: any) {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    req.userId = req.session.userId;
    next();
  }

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password!, 10);
      
      // Create user with default subscription
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        subscriptionStatus: "active",
        subscriptionPlan: "free",
        subscriptionStartDate: new Date(),
        role: "user"
      });

      // Set up session
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Session error" });
        }
        res.json({ success: true, user: { id: user.id, email: user.email } });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set up session
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Session error" });
        }
        res.json({ success: true, user: { id: user.id, email: user.email } });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Support email endpoint (before auth middleware)
  app.post("/api/support", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      console.log("Support request received:", { name, email, subject });

      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: "All fields are required" });
      }

      console.log("Email service configured:", emailService.isConfigured());
      const success = await emailService.sendSupportEmail(name, email, subject, message);
      
      if (success) {
        console.log("Support email sent successfully");
        res.json({ success: true, message: "Support request sent successfully" });
      } else {
        console.log("Failed to send support email");
        res.status(500).json({ error: "Failed to send support request" });
      }
    } catch (error) {
      console.error("Support email error:", error);
      res.status(500).json({ error: "Failed to send support request" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    console.log("Logout endpoint hit - new version");
    try {
      // Clear session data
      if (req.session) {
        console.log("Session exists, clearing userId");
        req.session.userId = undefined;
        delete req.session.userId;
      }
      
      // Clear the session cookie
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: false
      });
      
      console.log("Logout successful");
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, clear the cookie and return success
      res.clearCookie('connect.sid');
      res.json({ success: true });
    }
  });

  // In-memory cache to prevent duplicate requests
  const recentResetRequests = new Map<string, number>();

  // Request password reset token
  app.post("/api/auth/request-password-reset", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Prevent duplicate requests within 30 seconds
      const now = Date.now();
      const lastRequest = recentResetRequests.get(email);
      if (lastRequest && (now - lastRequest) < 30000) {
        return res.json({ 
          success: true, 
          message: "Password reset email has been sent to your email address." 
        });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ success: true, message: "If an account with that email exists, we've sent a password reset link." });
      }

      // Mark this request
      recentResetRequests.set(email, now);
      
      // Clean up old requests (older than 5 minutes)
      setTimeout(() => {
        for (const [key, timestamp] of recentResetRequests.entries()) {
          if (now - timestamp > 300000) {
            recentResetRequests.delete(key);
          }
        }
      }, 1000);

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Clean up old tokens
      await storage.cleanupExpiredTokens();

      // Store the token
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
        used: false
      });

      // Import email service
      const { emailService } = await import('./email');
      
      // Get base URL for the reset link
      const baseUrl = req.headers.origin || `${req.protocol}://${req.get('host')}`;
      
      // Send email
      const emailSent = await emailService.sendPasswordResetEmail(email, token, baseUrl);
      
      if (emailSent) {
        res.json({ 
          success: true, 
          message: "Password reset email has been sent to your email address."
        });
      } else {
        // If email service is not configured, fall back to demo mode
        console.log('Email service not configured, using demo mode');
        res.json({ 
          success: true, 
          message: "Email service not configured. Demo mode - token:",
          // Demo mode - return token for testing
          resetToken: token
        });
      }
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Find and validate token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update the password
      const success = await storage.updateUserPassword(resetToken.userId, hashedPassword);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to update password" });
      }

      // Mark token as used
      await storage.markTokenAsUsed(token);

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Password reset failed" });
    }
  });

  // Helper function to recalculate formulation costs when material prices change
  async function updateFormulationsUsingMaterial(materialId: number) {
    try {
      console.log(`Updating formulations that use material ${materialId}`);
      
      // Get all formulations for user (using mock user ID 1)
      const formulations = await storage.getFormulations(1);
      console.log(`Found ${formulations.length} formulations to check`);
      
      for (const formulation of formulations) {
        try {
          // Get ingredients for this formulation
          const ingredients = await storage.getFormulationIngredients(formulation.id);
          
          // Check if this formulation uses the updated material
          const usesUpdatedMaterial = ingredients.some(ing => ing.materialId === materialId);
          
          if (usesUpdatedMaterial) {
            console.log(`Updating formulation "${formulation.name}" which uses material ${materialId}`);
            
            // Recalculate costs for this formulation
            let totalMaterialCost = 0;
            let updatedIngredients = [];
            
            for (const ingredient of ingredients) {
              if (ingredient.materialId) {
                const material = await storage.getRawMaterial(ingredient.materialId);
                if (material && material.unitCost) {
                  const quantity = parseFloat(ingredient.quantity) || 0;
                  const unitCost = parseFloat(material.unitCost) || 0;
                  const costContribution = quantity * unitCost;
                  
                  // Only include in markup if specified
                  if (ingredient.includeInMarkup !== false) {
                    totalMaterialCost += costContribution;
                  }
                  
                  console.log(`Ingredient ${ingredient.id}: ${quantity} x ${unitCost} = ${costContribution.toFixed(4)} (Include in markup: ${ingredient.includeInMarkup !== false})`);
                  
                  // Update the ingredient's cost contribution
                  await storage.updateFormulationIngredient(ingredient.id, {
                    costContribution: costContribution.toFixed(2)
                  });
                  
                  updatedIngredients.push({
                    materialId: ingredient.materialId,
                    materialName: material.name,
                    quantity: ingredient.quantity,
                    unit: ingredient.unit,
                    costContribution: costContribution.toFixed(2),
                    includeInMarkup: ingredient.includeInMarkup !== false
                  });
                }
              }
            }
            
            // Calculate new formulation costs with robust validation
            const batchSize = Math.max(parseFloat(formulation.batchSize) || 1, 0.001);
            const unitCost = totalMaterialCost / batchSize;
            const markupPercentage = parseFloat(formulation.markupPercentage) || 30;
            const profitMargin = (markupPercentage / 100) * totalMaterialCost;
            
            // Update formulation with new calculated costs
            await storage.updateFormulationCosts(formulation.id, {
              totalCost: totalMaterialCost.toFixed(2),
              unitCost: unitCost.toFixed(4),
              profitMargin: profitMargin.toFixed(2),
            });
            
            // Create comprehensive audit log for the automatic update
            await storage.createAuditLog({
              userId: 1,
              action: "update",
              entityType: "formulation",
              entityId: formulation.id,
              changes: JSON.stringify({
                description: `Automatically updated formulation "${formulation.name}" costs due to material price change. New total cost: $${totalMaterialCost.toFixed(2)}`,
                reason: "Material price change",
                materialId: materialId,
                previousTotalCost: formulation.totalCost,
                newTotalCost: totalMaterialCost.toFixed(2),
                updatedIngredients: updatedIngredients,
                calculationDetails: {
                  batchSize: batchSize,
                  unitCost: unitCost.toFixed(4),
                  markupPercentage: markupPercentage,
                  profitMargin: profitMargin.toFixed(2)
                }
              }),
            });
            
            console.log(`Successfully updated formulation "${formulation.name}" - New total cost: $${totalMaterialCost.toFixed(2)}`);
          }
        } catch (formulationError) {
          console.error(`Error updating formulation ${formulation.id}:`, formulationError);
        }
      }
    } catch (error) {
      console.error("Error updating formulations after material price change:", error);
    }
  }

  // Vendors
  app.get("/api/vendors", requireAuth, async (req: any, res) => {
    const userId = req.userId; // Mock user ID for now
    const vendors = await storage.getVendors(userId);
    res.json(vendors);
  });

  app.post("/api/vendors", requireAuth, checkVendorsLimit, async (req: any, res) => {
    try {
      const vendorData = insertVendorSchema.parse({ ...req.body, userId: req.userId });
      const vendor = await storage.createVendor(vendorData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.userId,
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
  app.get("/api/material-categories", requireAuth, async (req: any, res) => {
    const userId = req.userId;
    const categories = await storage.getMaterialCategories(userId);
    res.json(categories);
  });

  app.post("/api/material-categories", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      
      // Validate category name is not empty
      if (!req.body.name || req.body.name.trim() === '') {
        return res.status(400).json({ error: "Category name is required" });
      }
      
      // Check subscription limits
      const user = await storage.getUser(userId);
      const userTier = user?.subscriptionPlan || 'free';
      const existingCategories = await storage.getMaterialCategories(userId);
      
      const tierLimits: Record<string, number> = {
        free: 2,
        starter: 5,
        pro: 10,
        professional: 20,
        business: 25,
        enterprise: 50
      };
      
      const limit = tierLimits[userTier] || tierLimits.free;
      console.log(`Category limit check: User ${userId}, Tier: ${userTier}, Current: ${existingCategories.length}, Limit: ${limit}`);
      
      if (existingCategories.length >= limit) {
        console.log(`Blocking category creation - limit reached`);
        return res.status(403).json({ 
          error: "Plan limit reached", 
          message: `Your ${userTier} plan allows up to ${limit} categories. You currently have ${existingCategories.length}.`,
          currentCount: existingCategories.length,
          limit: limit
        });
      }
      
      const categoryData = insertMaterialCategorySchema.parse({ ...req.body, userId });
      const category = await storage.createMaterialCategory(categoryData);
      
      // Create audit log
      await storage.createAuditLog({
        userId,
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

  app.put("/api/material-categories/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.userId;
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
          userId,
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

  app.delete("/api/material-categories/:id", requireAuth, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const userId = req.userId;
    const category = await storage.getMaterialCategory(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const deleted = await storage.deleteMaterialCategory(id);
    
    // Create audit log
    await storage.createAuditLog({
      userId,
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
  app.get("/api/raw-materials", requireAuth, async (req: any, res) => {
    const userId = req.userId;
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

  app.post("/api/raw-materials", requireAuth, checkMaterialsLimit, async (req: any, res) => {
    try {
      // Calculate unitCost if not provided
      const requestData = { ...req.body, userId: 1 };
      if (requestData.totalCost && requestData.quantity && !requestData.unitCost) {
        const totalCost = parseFloat(requestData.totalCost);
        const quantity = parseFloat(requestData.quantity);
        if (quantity > 0) {
          requestData.unitCost = (totalCost / quantity).toFixed(4);
        } else {
          requestData.unitCost = "0.0000";
        }
      }
      
      const materialData = insertRawMaterialSchema.parse({ ...requestData, userId: req.userId });
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
      res.status(400).json({ 
        error: "Invalid material data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/raw-materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const originalMaterial = await storage.getRawMaterial(id);
      if (!originalMaterial) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Calculate unitCost if needed
      const requestData = { ...req.body };
      if (requestData.totalCost && requestData.quantity) {
        const totalCost = parseFloat(requestData.totalCost);
        const quantity = parseFloat(requestData.quantity);
        if (quantity > 0) {
          requestData.unitCost = (totalCost / quantity).toFixed(4);
        }
      }
      
      const materialData = insertRawMaterialSchema.partial().parse(requestData);
      const material = await storage.updateRawMaterial(id, materialData);
      
      // If any cost-related field changed, update all formulations that use this material
      if (material && (originalMaterial.unitCost !== material.unitCost || 
                       originalMaterial.totalCost !== material.totalCost ||
                       originalMaterial.quantity !== material.quantity)) {
        console.log(`Material ${id} cost changed, updating formulations...`);
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

    // Check if material is used in any formulations
    try {
      const allFormulations = await storage.getFormulations(material.userId);
      const formulationsUsingMaterial = [];
      
      for (const formulation of allFormulations) {
        const ingredients = await storage.getFormulationIngredients(formulation.id);
        const hasIngredient = ingredients.some(ingredient => ingredient.materialId === id);
        if (hasIngredient) {
          formulationsUsingMaterial.push(formulation.name);
        }
      }
      
      if (formulationsUsingMaterial.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete material that is used in formulations",
          message: `This material is currently used in the following formulations: ${formulationsUsingMaterial.join(', ')}. Please remove it from these formulations first.`,
          formulationsUsing: formulationsUsingMaterial
        });
      }
    } catch (error) {
      console.error("Error checking formulation usage:", error);
      return res.status(500).json({ error: "Error checking material usage" });
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
  app.get("/api/formulations", requireAuth, async (req: any, res) => {
    const userId = req.userId;
    const formulations = await storage.getFormulations(userId);
    res.json(formulations);
  });

  // Fix material unit costs endpoint
  app.post("/api/materials/fix-unit-costs", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const materials = await storage.getRawMaterials(userId);
      let fixedCount = 0;
      
      for (const material of materials) {
        const totalCost = parseFloat(material.totalCost || '0');
        const quantity = parseFloat(material.quantity || '1');
        const currentUnitCost = parseFloat(material.unitCost || '0');
        
        if (quantity > 0 && totalCost > 0) {
          const calculatedUnitCost = totalCost / quantity;
          
          if (Math.abs(currentUnitCost - calculatedUnitCost) > 0.0001) {
            await storage.updateRawMaterial(material.id, {
              unitCost: calculatedUnitCost.toFixed(4)
            });
            fixedCount++;
            console.log(`Fixed material ${material.id} (${material.name}): Unit cost ${currentUnitCost} -> ${calculatedUnitCost.toFixed(4)}`);
          }
        }
      }
      
      res.json({ 
        success: true, 
        message: `Fixed unit costs for ${fixedCount} materials`,
        fixedCount 
      });
      
    } catch (error) {
      console.error("Error fixing material unit costs:", error);
      res.status(500).json({ error: "Failed to fix material unit costs" });
    }
  });

  // Refresh formulation costs endpoint
  app.post("/api/formulations/refresh-costs", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const formulations = await storage.getFormulations(userId);
      let updatedCount = 0;
      
      for (const formulation of formulations) {
        try {
          const ingredients = await storage.getFormulationIngredients(formulation.id);
          
          if (ingredients.length === 0) continue;
          
          let totalMaterialCost = 0;
          let markupEligibleCost = 0;
          let updatedIngredients = [];
          
          for (const ingredient of ingredients) {
            const material = await storage.getRawMaterial(ingredient.materialId);
            if (material) {
              const quantity = parseFloat(ingredient.quantity);
              const unitCost = parseFloat(material.unitCost || '0');
              const ingredientCost = quantity * unitCost;
              
              console.log(`Refresh: Ingredient ${ingredient.materialId}, Qty: ${quantity}, Unit Cost: ${unitCost}, Total: ${ingredientCost}, Include Markup: ${ingredient.includeInMarkup}`);
              
              // Add all ingredient costs to total
              totalMaterialCost += ingredientCost;
              
              // Only include in markup calculation if includeInMarkup is true
              if (ingredient.includeInMarkup) {
                markupEligibleCost += ingredientCost;
              }
              
              updatedIngredients.push({
                ...ingredient,
                materialName: material.name,
                unitCost: material.unitCost,
                cost: ingredientCost.toFixed(4)
              });
            }
          }
          
          // Calculate profit margin and final costs
          const batchSize = parseFloat(formulation.batchSize || '1');
          const unitCost = totalMaterialCost / batchSize;
          const markupPercentage = parseFloat(formulation.markupPercentage || '30');
          const profitMargin = (markupEligibleCost * markupPercentage) / 100;
          const finalCost = totalMaterialCost + profitMargin;
          
          console.log(`Refresh: Formulation ${formulation.id} - Total Material Cost: ${totalMaterialCost}, Markup Eligible: ${markupEligibleCost}, Markup %: ${markupPercentage}, Profit Margin: ${profitMargin}, Final Cost: ${finalCost}`);
          
          await storage.updateFormulationCosts(formulation.id, {
            totalCost: finalCost.toFixed(2),
            unitCost: unitCost.toFixed(4),
            profitMargin: profitMargin.toFixed(2)
          });
          
          updatedCount++;
          
        } catch (error) {
          console.error(`Error refreshing formulation ${formulation.id}:`, error);
        }
      }
      
      res.json({ 
        success: true, 
        message: `Refreshed costs for ${updatedCount} formulations`,
        updatedCount 
      });
      
    } catch (error) {
      console.error("Error refreshing formulation costs:", error);
      res.status(500).json({ error: "Failed to refresh formulation costs" });
    }
  });

  app.get("/api/formulations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const formulation = await storage.getFormulation(id);
    if (!formulation) {
      return res.status(404).json({ error: "Formulation not found" });
    }
    res.json(formulation);
  });

  app.post("/api/formulations", requireAuth, checkFormulationsLimit, async (req: any, res) => {
    try {
      const { ingredients, ...formulationData } = req.body;
      const parsedFormulationData = insertFormulationSchema.parse({ ...formulationData, userId: req.userId });
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
            includeInMarkup: ingredient.includeInMarkup !== false,
          });
        }
        
        // Calculate formulation costs based on ingredients
        const totalMaterialCost = ingredients.reduce((total, ing) => 
          total + Number(ing.costContribution || 0), 0);
        
        // Calculate markup-eligible cost (only ingredients marked for markup)
        const markupEligibleCost = ingredients.reduce((total, ing) => 
          (ing.includeInMarkup !== false) ? total + Number(ing.costContribution || 0) : total, 0);
        
        const batchSize = Number(formulation.batchSize || 1);
        const unitCost = batchSize > 0 ? totalMaterialCost / batchSize : 0;
        const markupPercentage = Number(formulation.markupPercentage || 30);
        const profitMargin = (markupPercentage / 100) * markupEligibleCost;
        
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
        userId: req.userId,
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
            includeInMarkup: ingredient.includeInMarkup !== false,
          });
        }
        
        // Recalculate formulation costs based on new ingredients
        const totalMaterialCost = ingredients.reduce((total, ing) => 
          total + Number(ing.costContribution || 0), 0);
        
        // Calculate markup-eligible cost (only ingredients marked for markup)
        const markupEligibleCost = ingredients.reduce((total, ing) => 
          (ing.includeInMarkup !== false) ? total + Number(ing.costContribution || 0) : total, 0);
        
        const batchSize = Number(formulation?.batchSize || 1);
        const unitCost = batchSize > 0 ? totalMaterialCost / batchSize : 0;
        const markupPercentage = Number(formulation?.markupPercentage || 30);
        const profitMargin = (markupPercentage / 100) * markupEligibleCost;
        
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
  app.get("/api/dashboard/stats", requireAuth, async (req: any, res) => {
    const userId = req.userId;
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
  app.get("/api/dashboard/recent-activity", requireAuth, async (req: any, res) => {
    const userId = req.userId;
    const auditLogs = await storage.getAuditLogs(userId, 10);
    res.json(auditLogs);
  });

  // Setup vendors and categories for CSV import
  app.post("/api/setup-import-data", requireAuth, async (req: any, res) => {
    const userId = req.userId;
    
    try {
      const existingVendors = await storage.getVendors(userId);
      const existingCategories = await storage.getMaterialCategories(userId);
      
      res.json({
        success: true,
        message: "No automatic setup performed. Create vendors and categories manually based on your CSV data.",
        currentVendors: existingVendors.length,
        currentCategories: existingCategories.length,
        vendorsCreated: 0,
        categoriesCreated: 0
      });
      
    } catch (error) {
      console.error("Setup error:", error);
      res.status(500).json({ error: "Failed to check existing data" });
    }
  });

  // Remove duplicate materials
  app.post("/api/remove-duplicates", requireAuth, async (req: any, res) => {
    const userId = req.userId;
    
    try {
      const materials = await storage.getRawMaterials(userId);
      const nameMap = new Map();
      const duplicates = [];
      
      // Find duplicates by name - keep only the first occurrence
      const seen = new Set();
      for (const material of materials) {
        const key = material.name.toLowerCase().trim();
        if (seen.has(key)) {
          duplicates.push(material.id);
        } else {
          seen.add(key);
        }
      }
      
      // Delete duplicates
      let deleted = 0;
      for (const duplicateId of duplicates) {
        const success = await storage.deleteRawMaterial(duplicateId);
        if (success) deleted++;
      }
      
      // Add cache control headers to prevent stale data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json({
        success: true,
        message: `Removed ${deleted} duplicate materials`,
        duplicatesRemoved: deleted
      });
      
    } catch (error) {
      console.error("Remove duplicates error:", error);
      res.status(500).json({ error: "Failed to remove duplicates" });
    }
  });

  // Import materials
  app.post("/api/import/materials", requireAuth, async (req: any, res) => {
    const userId = req.userId;
    const { materials } = req.body;
    
    if (!Array.isArray(materials)) {
      return res.status(400).json({ error: "Materials must be an array" });
    }

    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    // Get all categories and vendors for validation
    const categories = await storage.getMaterialCategories(userId);
    const vendors = await storage.getVendors(userId);
    
    // Create case-insensitive lookup maps
    const categoryMap = new Map();
    categories.forEach(c => {
      categoryMap.set(c.name.toLowerCase(), c.id);
      categoryMap.set(c.name, c.id); // Keep exact case too
    });
    
    const vendorMap = new Map();
    vendors.forEach(v => {
      vendorMap.set(v.name.toLowerCase(), v.id);
      vendorMap.set(v.name, v.id); // Keep exact case too
    });

    for (const materialData of materials) {
      try {
        // Validate required fields
        if (!materialData.name || !materialData.categoryName || !materialData.vendorName) {
          failed++;
          errors.push(`Material missing required fields: ${materialData.name || 'unnamed'} - needs name, categoryName, vendorName`);
          continue;
        }

        // Find category and vendor IDs with case-insensitive matching
        let categoryId = categoryMap.get(materialData.categoryName) || categoryMap.get(materialData.categoryName.toLowerCase());
        let vendorId = vendorMap.get(materialData.vendorName) || vendorMap.get(materialData.vendorName.toLowerCase());

        if (!categoryId) {
          failed++;
          errors.push(`Category "${materialData.categoryName}" not found for material "${materialData.name}". Available: ${categories.map(c => c.name).join(', ')}`);
          continue;
        }

        if (!vendorId) {
          failed++;
          errors.push(`Vendor "${materialData.vendorName}" not found for material "${materialData.name}". Available: ${vendors.map(v => v.name).join(', ')}`);
          continue;
        }

        // Calculate unit cost
        const totalCost = parseFloat(materialData.totalCost || '0');
        const quantity = parseFloat(materialData.quantity || '1');
        const unitCost = quantity > 0 ? (totalCost / quantity).toFixed(4) : "0.0000";

        // Prepare material data
        const newMaterial = {
          name: materialData.name,
          sku: materialData.sku || null,
          categoryId,
          vendorId,
          totalCost: totalCost.toString(),
          quantity: quantity.toString(),
          unit: materialData.unit || 'pc',
          unitCost,
          notes: materialData.notes || null,
          isActive: true,
          userId
        };

        // Validate with schema
        const validatedData = insertRawMaterialSchema.parse(newMaterial);
        await storage.createRawMaterial(validatedData);
        
        successful++;
        
        // Create audit log
        await storage.createAuditLog({
          userId,
          action: "create",
          entityType: "material",
          entityId: 0, // Will be updated after creation
          changes: JSON.stringify({
            description: `Imported raw material "${materialData.name}" via CSV import`,
            data: validatedData
          }),
        });
        
      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to import "${materialData.name}": ${errorMsg}`);
      }
    }

    // Create crystal-clear error guidance for clients
    let guidance = "";
    let actionSteps = [];
    
    if (failed > 0) {
      const missingVendors = [...new Set(errors.filter(e => e.includes('vendor')).map(e => e.match(/"([^"]+)"/)?.[1]).filter(Boolean))];
      const missingCategories = [...new Set(errors.filter(e => e.includes('category')).map(e => e.match(/"([^"]+)"/)?.[1]).filter(Boolean))];
      
      if (missingVendors.length > 0) {
        guidance += `MISSING VENDORS: ${missingVendors.join(', ')}`;
        actionSteps.push(`Go to VENDORS section → Click ADD VENDOR → Create: ${missingVendors.join(', ')}`);
      }
      if (missingCategories.length > 0) {
        if (guidance) guidance += " | ";
        guidance += `MISSING CATEGORIES: ${missingCategories.join(', ')}`;
        actionSteps.push(`Go to CATEGORIES section → Click ADD CATEGORY → Create: ${missingCategories.join(', ')}`);
      }
      
      actionSteps.push("Re-upload the SAME CSV file - only failed materials will be imported");
    }

    res.json({
      message: `Import completed: ${successful} successful, ${failed} failed`,
      successful,
      failed,
      errors: errors.slice(0, 20),
      guidance,
      actionSteps,
      availableCategories: categories.map(c => c.name),
      availableVendors: vendors.map(v => v.name)
    });
  });

  // User endpoints
  app.get("/api/user", async (req, res) => {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // User profile management
  app.get("/api/user/profile", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.put("/api/user/profile", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.session.userId;
      const { email, company } = req.body;
      
      const updates = { email, company };
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
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const userId = req.session.userId;

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
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
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
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const userId = req.session.userId;

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

  // Duplicate support endpoint removed (moved above auth middleware)

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

  // Database reset endpoint for production deployment
  app.post("/api/admin/reset-database", async (req, res) => {
    try {
      const { confirmCode } = req.body;
      
      // Simple protection - require specific code
      if (confirmCode !== "RESET_FOR_PRODUCTION_2024") {
        return res.status(401).json({ error: "Invalid confirmation code" });
      }

      // Delete all data in reverse dependency order
      await storage.createAuditLog({
        userId: 1,
        action: "delete",
        entityType: "system",
        entityId: 0,
        changes: JSON.stringify({ description: "Database reset for production deployment" })
      });

      // Get count before deletion
      const stats = {
        users: (await storage.getFormulations(1)).length > 0 ? "Data exists" : "No data",
        materials: (await storage.getRawMaterials(1)).length,
        formulations: (await storage.getFormulations(1)).length,
        vendors: (await storage.getVendors(1)).length,
        categories: (await storage.getMaterialCategories(1)).length
      };

      // Note: This is a simplified approach - in production you'd use direct SQL
      // For now, this endpoint exists but actual reset should be done manually
      
      res.json({ 
        success: true, 
        message: "Database reset endpoint ready",
        currentStats: stats,
        note: "For safety, manual database reset is recommended for production"
      });
    } catch (error) {
      console.error("Database reset error:", error);
      res.status(500).json({ error: "Failed to reset database" });
    }
  });

  // File Management API Routes
  app.get("/api/files", async (req, res) => {
    try {
      const userId = 1; // Mock user ID for demo
      const files = await storage.getFiles(userId);
      res.json(files);
    } catch (error) {
      console.error("Error getting files:", error);
      res.status(500).json({ error: "Failed to get files" });
    }
  });

  app.post("/api/files/upload", async (req, res) => {
    try {
      const userId = 1; // Mock user ID for demo
      const fileData = insertFileSchema.parse({
        ...req.body,
        userId
      });
      
      const file = await storage.createFile(fileData);
      res.json(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(400).json({ error: "Failed to upload file" });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      res.json(file);
    } catch (error) {
      console.error("Error getting file:", error);
      res.status(500).json({ error: "Failed to get file" });
    }
  });

  app.put("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const file = await storage.updateFile(id, updates);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      res.json(file);
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(400).json({ error: "Failed to update file" });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFile(id);
      
      if (!success) {
        return res.status(404).json({ error: "File not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // File attachment routes for materials and formulations
  app.get("/api/:entityType/:entityId/files", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const files = await storage.getAttachedFiles(entityType, parseInt(entityId));
      res.json(files);
    } catch (error) {
      console.error("Error getting attached files:", error);
      res.status(500).json({ error: "Failed to get attached files" });
    }
  });

  app.post("/api/:entityType/:entityId/files/attach", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const { fileId } = req.body;
      
      const attachment = await storage.attachFile({
        fileId,
        entityType,
        entityId: parseInt(entityId)
      });
      
      res.json(attachment);
    } catch (error) {
      console.error("Error attaching file:", error);
      res.status(400).json({ error: "Failed to attach file" });
    }
  });

  app.delete("/api/:entityType/:entityId/files/:fileId", async (req, res) => {
    try {
      const { entityType, entityId, fileId } = req.params;
      
      const success = await storage.detachFile(
        parseInt(fileId),
        entityType,
        parseInt(entityId)
      );
      
      if (!success) {
        return res.status(404).json({ error: "File attachment not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error detaching file:", error);
      res.status(500).json({ error: "Failed to detach file" });
    }
  });

  // Reports routes
  app.get("/api/reports/:tier", requireAuth, async (req: any, res) => {
    const userId = req.userId;
    const tier = req.params.tier;
    
    try {
      // Get user's subscription info
      const user = await storage.getUser(userId);
      const userTier = user?.subscriptionPlan || 'free';
      
      // If user doesn't have access to the requested tier, show preview
      if (!hasAccessToTier(userTier, tier)) {
        const preview = getReportsPreview(userTier, tier);
        return res.json({
          preview: true,
          currentTier: userTier,
          requestedTier: tier,
          message: `Your ${userTier} plan does not include ${tier} tier reports. Upgrade to unlock these features.`,
          ...preview
        });
      }
      
      const reports = await reportsService.generateAllReportsForTier(userId, tier);
      
      res.json({ reports });
    } catch (error) {
      console.error("Reports generation error:", error);
      res.status(500).json({ error: "Failed to generate reports" });
    }
  });

  // Register payment routes
  registerPaymentRoutes(app);

  // Admin routes
  app.get("/api/admin/users", requireAuth, async (req: any, res) => {
    // Check if user is admin
    const currentUser = await storage.getUser(req.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/admin/update-subscription", requireAuth, async (req: any, res) => {
    try {
      // Check if user is admin
      const currentUser = await storage.getUser(req.userId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { email, subscriptionTier, subscriptionStatus, duration } = req.body;
      
      if (!email || !subscriptionTier || !subscriptionStatus || !duration) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found with this email" });
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + parseInt(duration));

      // Update user subscription
      const updatedUser = await storage.updateUser(user.id, {
        subscriptionPlan: subscriptionTier,
        subscriptionStatus: subscriptionStatus,
        subscriptionStartDate: startDate,
        subscriptionEndDate: subscriptionStatus === 'active' ? endDate : null
      });

      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user subscription" });
      }

      // Create audit log
      await storage.createAuditLog({
        userId: req.userId, // Admin who made the change
        action: "update",
        entityType: "user_subscription",
        entityId: user.id,
        changes: JSON.stringify({
          description: `Subscription updated for ${email}`,
          subscriptionTier,
          subscriptionStatus,
          duration: `${duration} months`,
          updatedBy: "admin"
        }),
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Subscription update error:", error);
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
