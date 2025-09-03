import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { reportsService } from "./reports";
import { registerPaymentRoutes } from "./routes/payments";
import { emailService } from "./email";
import path from "path";
import express from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { withTransaction } from "./transaction-utils";
import { db } from "./db";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { formulations, rawMaterials, formulationIngredients, users } from "@shared/schema";
import * as schema from "@shared/schema";
import jwt from "jsonwebtoken";
import { requireJWTAuth, AuthenticatedRequest } from "./auth-middleware";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Email verification utilities
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function getVerificationTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24 hours from now
  return expiry;
}

async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
  
  const subject = 'Verify Your PIPPS Maker Calc Account';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to PIPPS Maker Calc!</h2>
      <p>Thank you for registering. Please verify your email address to complete your account setup.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        <a href="${verificationUrl}">${verificationUrl}</a>
      </p>
      <p style="color: #666; font-size: 14px;">
        This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
      </p>
    </div>
  `;

  await emailService.sendEmail({
    to: email,
    subject: subject,
    html: html
  });
}

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
import { checkMaterialsLimit, checkFormulationsLimit, checkVendorsLimit, checkCategoriesLimit, 
         checkMaterialEditLimit, checkFormulationEditLimit, checkVendorEditLimit, checkCategoryEditLimit, 
         getUserSubscriptionInfo } from "./subscription-middleware";
import { getUserSoftLockStatus, checkSoftLockUsage } from "./subscription-soft-lock";
import { 
  insertVendorSchema, insertMaterialCategorySchema, insertRawMaterialSchema,
  insertFormulationSchema, insertFormulationIngredientSchema, insertUserSchema,
  insertFileSchema, insertFileAttachmentSchema
} from "@shared/schema";
import passport from "./auth";
import "./types";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Fly.io monitoring
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Authentication middleware
  // Legacy requireAuth is now replaced with requireJWTAuth from auth-middleware.ts

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      let userData;
      try {
        userData = insertUserSchema.parse(req.body);
      } catch (zodErr) {
        console.error("Zod validation error:", zodErr);
        if (zodErr instanceof Error && 'errors' in zodErr) {
          return res.status(400).json({ error: "Invalid registration data", detail: (zodErr as any).errors });
        }
        return res.status(400).json({ error: "Invalid registration data" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password!, 10);
      
      // Generate email verification token
      const verificationToken = generateVerificationToken();
      const verificationExpiry = getVerificationTokenExpiry();
      
      // Create user with email verification fields
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpiry,
        subscriptionStatus: "active",
        subscriptionPlan: "free",
        subscriptionStartDate: new Date(),
        role: "user"
      });

      // Send verification email
      try {
        await sendVerificationEmail(userData.email, verificationToken);
        console.log(`Verification email sent to: ${userData.email}`);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue with registration even if email fails
      }

      // Don't create JWT token yet - user must verify email first
      res.json({ 
        success: true, 
        message: "Registration successful! Please check your email to verify your account before logging in.",
        user: { id: user.id, email: user.email, company: user.company, emailVerified: false }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Invalid registration data" });
    }
  });

  // Resend verification email endpoint
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user
      const user = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user.length === 0) {
        // Don't reveal if email exists or not for security
        return res.json({ 
          success: true, 
          message: "If an account with that email exists and is not verified, a new verification email has been sent." 
        });
      }

      const foundUser = user[0];

      // Check if already verified
      if (foundUser.emailVerified) {
        return res.json({ 
          success: true, 
          message: "Your email is already verified. You can log in now." 
        });
      }

      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const verificationExpiry = getVerificationTokenExpiry();

      // Update user with new token
      await db.update(users)
        .set({ 
          emailVerificationToken: verificationToken, 
          emailVerificationExpires: verificationExpiry 
        })
        .where(eq(users.id, foundUser.id));

      // Send verification email
      try {
        await sendVerificationEmail(email, verificationToken);
        console.log(`Verification email resent to: ${email}`);
      } catch (emailError) {
        console.error('Failed to resend verification email:', emailError);
        return res.status(500).json({ error: "Failed to send verification email" });
      }

      res.json({ 
        success: true, 
        message: "A new verification email has been sent. Please check your email." 
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Failed to resend verification email" });
    }
  });

  // Email verification endpoint
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Invalid verification token" });
      }

      // Find user with this verification token
      const user = await db.select()
        .from(users)
        .where(eq(users.emailVerificationToken, token))
        .limit(1);

      if (user.length === 0) {
        return res.status(400).json({ error: "Invalid or expired verification token" });
      }

      const foundUser = user[0];

      // Check if token has expired
      if (foundUser.emailVerificationExpires && new Date() > foundUser.emailVerificationExpires) {
        return res.status(400).json({ error: "Verification token has expired. Please request a new one." });
      }

      // Check if already verified
      if (foundUser.emailVerified) {
        return res.status(200).json({ success: true, message: "Email already verified. You can now log in." });
      }

      // Update user as verified
      await db.update(users)
        .set({ 
          emailVerified: true, 
          emailVerificationToken: null, 
          emailVerificationExpires: null 
        })
        .where(eq(users.id, foundUser.id));

      console.log(`Email verified for user: ${foundUser.email}`);
      
      res.json({ 
        success: true, 
        message: "Email verified successfully! You can now log in to your account." 
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  app.use(cookieParser());

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body || {};
      console.log(`[Login] Incoming login request`, { emailProvided: !!email });
      if (!email || !password) {
        console.log(`[Login] Missing email or password`);
        return res.status(400).json({ error: "Email and password are required" });
      }
      const user = await storage.getUserByEmail(email);
      console.log(`[Login] User lookup`, { found: !!user, email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (!user.password) {
        console.log(`[Login] User has no password (maybe OAuth only)`);
        return res.status(401).json({ error: "Password login not available for this user" });
      }

      let validPassword = false;
      try {
        validPassword = await bcrypt.compare(password, user.password);
      } catch (cmpErr) {
        console.error(`[Login] bcrypt.compare failed`, cmpErr);
        return res.status(500).json({ error: "Password verification failed" });
      }
      console.log(`[Login] Password compare result`, { validPassword });
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        console.log(`[Login] User email not verified`, { email });
        return res.status(401).json({ 
          error: "Please verify your email address before logging in. Check your email for a verification link." 
        });
      }

      console.log(`[Login] Success`, { userId: user.id });

      // Generate JWT
      const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-change-this";
      let token: string;
      try {
        token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });
      } catch (signErr: any) {
        console.error(`[Login] JWT sign failed`, signErr);
        return res.status(500).json({ error: "Token generation failed" });
      }

      // Set JWT as HTTP-only cookie
      try {
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      } catch (cookieErr) {
        console.error(`[Login] Failed to set cookie`, cookieErr);
        return res.status(500).json({ error: "Failed to set auth cookie" });
      }

      console.log(`[Login] Success`, { userId: user.id });
      res.json({
        success: true,
        user: { id: user.id, email: user.email, company: user.company },
        token
      });
    } catch (error) {
      console.error("[Login] Login error:", error);
      const base = { error: "Login failed" } as any;
      if (process.env.NODE_ENV !== 'production') {
        base.detail = (error as any)?.message;
      }
      res.status(500).json(base);
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
    console.log("Logout endpoint hit - JWT version");
    try {
      // Clear the JWT cookie with all possible variations
      res.clearCookie('token', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      });
      
      // Also try clearing without options (fallback)
      res.clearCookie('token');
      
      console.log("Logout successful - cookies cleared");
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, try to clear the cookie and return success
      // because logout should always succeed from the client perspective
      try {
        res.clearCookie('token');
      } catch (e) {
        console.error("Error clearing cookie:", e);
      }
      res.json({ success: true, message: "Logged out (with warnings)" });
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
        const entries = Array.from(recentResetRequests.entries());
        for (const [key, timestamp] of entries) {
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
      
      console.log('🔧 Preparing to send password reset email...');
      console.log(`- Email: ${email}`);
      console.log(`- Token: ${token}`);
      console.log(`- Base URL: ${baseUrl}`);

      try {
        const emailSent = await emailService.sendPasswordResetEmail(email, token, baseUrl);

        if (emailSent) {
          console.log('✅ Password reset email sent successfully.');
          res.json({ 
            success: true, 
            message: "Password reset email has been sent to your email address."
          });
        } else {
          console.log('❌ Email service not configured, using demo mode');
          res.json({ 
            success: true, 
            message: "Email service not configured. Demo mode - token:",
            resetToken: token // Demo mode - return token for testing
          });
        }
      } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        res.status(500).json({ error: "Failed to process password reset request" });
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
      console.log(`🔧 Updating password for user ID: ${resetToken.userId}`);
      const success = await storage.updateUserPassword(resetToken.userId, hashedPassword);
      console.log(`🔧 Password update result: ${success}`);
      
      if (!success) {
        console.error(`❌ Failed to update password for user ID: ${resetToken.userId}`);
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
                if (material) {
                  const { calculateIngredientCost, calculateUnitCost } = await import('./utils/calculations.js');
                  const quantity = parseFloat(ingredient.quantity) || 0;
                  const unitCost = calculateUnitCost(material);
                  const costContribution = calculateIngredientCost(material, quantity);
                  
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
            const { calculateFormulationUnitCost, calculateProfitMargin } = await import('./utils/calculations.js');
            const batchSize = Math.max(parseFloat(formulation.batchSize) || 1, 0.001);
            const unitCost = calculateFormulationUnitCost(totalMaterialCost, batchSize);
            const markupPercentage = parseFloat(formulation.markupPercentage) || 30;
            const profitMarginPercentage = calculateProfitMargin(totalMaterialCost, markupPercentage);
            
            // Update formulation with new calculated costs
            await storage.updateFormulationCosts(formulation.id, {
              totalCost: totalMaterialCost.toFixed(2), // Store material cost only
              unitCost: unitCost.toFixed(4),
              profitMargin: profitMarginPercentage.toFixed(2), // Store percentage, not dollars
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
                  profitMarginPercentage: profitMarginPercentage.toFixed(2)
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
  app.get("/api/vendors", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id; // User ID from JWT
    const vendors = await storage.getVendors(userId);
    res.json(vendors);
  });

  app.post("/api/vendors", requireJWTAuth, checkVendorsLimit, async (req: AuthenticatedRequest, res) => {
    try {
      const vendorData = insertVendorSchema.parse({ ...req.body, userId: req.user?.id });
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

  app.put("/api/vendors/:id", requireJWTAuth, checkVendorEditLimit, async (req: AuthenticatedRequest, res) => {
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

  app.delete("/api/vendors/:id", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
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
  app.get("/api/material-categories", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const categories = await storage.getMaterialCategories(userId);
    res.json(categories);
  });

  app.post("/api/material-categories", requireJWTAuth, checkCategoriesLimit, async (req: AuthenticatedRequest, res) => {
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

  app.put("/api/material-categories/:id", requireJWTAuth, checkCategoryEditLimit, async (req: AuthenticatedRequest, res) => {
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

  app.delete("/api/material-categories/:id", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
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
  app.get("/api/raw-materials", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    const userId = req.userId;
    const materials = await storage.getRawMaterials(userId);
    const { enhanceMaterialsWithCalculatedCosts } = await import('./utils/calculations.js');
    
    // Add cache control headers to prevent stale data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('ETag', Date.now().toString());
    
    res.json(enhanceMaterialsWithCalculatedCosts(materials));
  });

  app.get("/api/raw-materials/:id", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    const id = parseInt(req.params.id);
    const material = await storage.getRawMaterial(id);
    if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }
    const { enhanceMaterialWithCalculatedCosts } = await import('./utils/calculations.js');
    res.json(enhanceMaterialWithCalculatedCosts(material));
  });

  app.post("/api/raw-materials", requireJWTAuth, checkMaterialsLimit, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('🔧 MATERIAL CREATE - Raw request body:', JSON.stringify(req.body, null, 2));
      console.log('🔧 MATERIAL CREATE - User ID:', req.user?.id);
      
      // Calculate unitCost if not provided
      const requestData = { ...req.body };
      console.log('🔧 MATERIAL CREATE - Raw totalCost:', requestData.totalCost, typeof requestData.totalCost);
      console.log('🔧 MATERIAL CREATE - Raw quantity:', requestData.quantity, typeof requestData.quantity);
      
      if (requestData.totalCost && requestData.quantity && !requestData.unitCost) {
        const totalCost = parseFloat(requestData.totalCost);
        const quantity = parseFloat(requestData.quantity);
        console.log('🔧 MATERIAL CREATE - Parsed totalCost:', totalCost, 'quantity:', quantity);
        
        if (quantity > 0) {
          requestData.unitCost = (totalCost / quantity).toFixed(4);
          console.log('🔧 MATERIAL CREATE - Calculated unitCost:', requestData.unitCost);
        } else {
          requestData.unitCost = "0.0000";
        }
      }
      
      // Ensure numeric fields are properly formatted
      if (requestData.totalCost) {
        requestData.totalCost = parseFloat(requestData.totalCost).toFixed(2);
      }
      if (requestData.quantity) {
        requestData.quantity = parseFloat(requestData.quantity).toFixed(3);
      }
      if (requestData.unitCost) {
        requestData.unitCost = parseFloat(requestData.unitCost).toFixed(4);
      }
      
      console.log('🔧 MATERIAL CREATE - Final processed data:', JSON.stringify(requestData, null, 2));
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      console.log('🔧 MATERIAL CREATE - Using userId:', userId);
      
      const materialData = insertRawMaterialSchema.parse({ ...requestData, userId });
      console.log('🔧 MATERIAL CREATE - Schema validation passed');
      console.log('🔧 MATERIAL CREATE - Validated data:', JSON.stringify(materialData, null, 2));
      
      const material = await storage.createRawMaterial(materialData);
      console.log('🔧 MATERIAL CREATE - Database insert successful');
      
      // Create audit log
      console.log('🔧 MATERIAL CREATE - Creating audit log...');
      try {
        await storage.createAuditLog({
          userId: userId,
          action: "create",
          entityType: "material",
          entityId: material.id,
          changes: JSON.stringify({
            description: `Added new raw material "${material.name}" with a total cost of $${material.totalCost} for ${material.quantity} ${material.unit}`,
            data: material
          }),
        });
        console.log('🔧 MATERIAL CREATE - Audit log created successfully');
      } catch (auditError) {
        console.error('🔧 MATERIAL CREATE - Audit log creation failed:', auditError);
      }
      
      res.json(material);
    } catch (error) {
      console.error('🔧 MATERIAL CREATE - Error:', error);
      console.error('🔧 MATERIAL CREATE - Error details:', error instanceof Error ? error.message : 'Unknown error');
      
      let errorMessage = "Invalid material data";
      let errorDetails = "Unknown error";
      
      if (error instanceof Error) {
        errorDetails = error.message;
        
        // Provide more specific error messages
        if (error.message.includes('userId')) {
          errorMessage = "Authentication error";
          errorDetails = "User not authenticated";
        } else if (error.message.includes('name')) {
          errorMessage = "Invalid material name";
          errorDetails = "Material name is required";
        } else if (error.message.includes('totalCost')) {
          errorMessage = "Invalid total cost";
          errorDetails = "Total cost must be a valid number";
        } else if (error.message.includes('quantity')) {
          errorMessage = "Invalid quantity";
          errorDetails = "Quantity must be a valid number";
        } else if (error.message.includes('unit')) {
          errorMessage = "Invalid unit";
          errorDetails = "Unit is required";
        } else if (error.message.includes('unitCost')) {
          errorMessage = "Invalid unit cost";
          errorDetails = "Unit cost must be a valid number";
        }
      }
      
      res.status(400).json({ 
        error: errorMessage,
        details: errorDetails
      });
    }
  });

  app.put("/api/raw-materials/:id", requireJWTAuth, checkMaterialEditLimit, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const originalMaterial = await storage.getRawMaterial(id);
      if (!originalMaterial) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Calculate unitCost if needed
      const requestData = { ...req.body };
      console.log('🔧 UPDATE - Received raw data:', JSON.stringify(req.body, null, 2));
      
      if (requestData.totalCost && requestData.quantity) {
        const totalCost = parseFloat(requestData.totalCost);
        const quantity = parseFloat(requestData.quantity);
        if (quantity > 0) {
          requestData.unitCost = (totalCost / quantity).toFixed(4);
        }
      }
      
      console.log('🔧 UPDATE - Processed data before validation:', JSON.stringify(requestData, null, 2));
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
          userId: req.user?.id || 11, // Use actual user ID or fallback
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
      console.log('🔧 UPDATE - Validation error:', error);
      res.status(400).json({ 
        error: "Invalid material data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.delete("/api/raw-materials/:id", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
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
      userId: req.user?.id || 1,
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
  app.get("/api/formulations", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    const userId = req.userId;
    const includeArchived = req.query.includeArchived === 'true';
    const formulations = await storage.getFormulations(userId, includeArchived);
    
    // Add cache control headers to prevent stale data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('ETag', Date.now().toString());
    
    res.json(formulations);
  });

  // Get archived formulations
  app.get("/api/formulations/archived", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    const userId = req.userId;
    const archivedFormulations = await storage.getArchivedFormulations(userId);
    
    // Add cache control headers to prevent stale data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('ETag', Date.now().toString());
    
    res.json(archivedFormulations);
  });

  // Fix material unit costs endpoint
  app.post("/api/materials/fix-unit-costs", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
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
  app.post("/api/formulations/refresh-costs", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
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
              const { calculateIngredientCost, calculateUnitCost } = await import('./utils/calculations.js');
              const quantity = parseFloat(ingredient.quantity);
              const unitCost = calculateUnitCost(material);
              const ingredientCost = calculateIngredientCost(material, quantity);
              
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
          const { calculateFormulationUnitCost, calculateProfitMargin } = await import('./utils/calculations.js');
          const batchSize = parseFloat(formulation.batchSize || '1');
          const unitCost = calculateFormulationUnitCost(totalMaterialCost, batchSize);
          const markupPercentage = parseFloat(formulation.markupPercentage || '30');
          const profitMarginPercentage = calculateProfitMargin(markupEligibleCost, markupPercentage);
          
          console.log(`Refresh: Formulation ${formulation.id} - Total Material Cost: ${totalMaterialCost}, Markup Eligible: ${markupEligibleCost}, Markup %: ${markupPercentage}, Profit Margin %: ${profitMarginPercentage}`);
          
          const updateResult = await storage.updateFormulationCosts(formulation.id, {
            totalCost: totalMaterialCost.toFixed(2), // Store material cost only
            unitCost: unitCost.toFixed(4),
            profitMargin: profitMarginPercentage.toFixed(2) // Store percentage, not dollars
          });
          
          if (updateResult) {
            updatedCount++;
            console.log(`Successfully updated formulation ${formulation.id} - Unit Cost: ${unitCost.toFixed(4)}`);
          } else {
            console.error(`Failed to update formulation ${formulation.id}`);
          }
          
        } catch (error) {
          console.error(`Error refreshing formulation ${formulation.id}:`, error);
        }
      }
      
      // Add cache control headers to prevent stale data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json({ 
        success: true, 
        message: `Refreshed costs for ${updatedCount} formulations`,
        updatedCount,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error("Error refreshing formulation costs:", error);
      res.status(500).json({ error: "Failed to refresh formulation costs" });
    }
  });

  app.get("/api/formulations/:id", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    const id = parseInt(req.params.id);
    const userId = req.userId;
    
    console.log('=== INDIVIDUAL FORMULATION REQUEST DEBUG ===');
    console.log('Requested formulation ID:', id);
    console.log('User ID from JWT:', userId);
    
    const formulation = await storage.getFormulation(id);
    console.log('Raw formulation from storage:', formulation);
    
    if (!formulation) {
      console.log('Formulation not found in storage');
      return res.status(404).json({ error: "Formulation not found" });
    }
    
    console.log('Formulation data check:');
    console.log('- totalCost:', formulation.totalCost, 'type:', typeof formulation.totalCost);
    console.log('- unitCost:', formulation.unitCost, 'type:', typeof formulation.unitCost);
    console.log('- targetPrice:', formulation.targetPrice, 'type:', typeof formulation.targetPrice);
    
    // Ensure user can only access their own formulations
    if (formulation.userId !== userId) {
      console.log(`Access denied: formulation belongs to user ${formulation.userId}, but requested by user ${userId}`);
      return res.status(403).json({ error: "Access denied" });
    }
    
    console.log('Sending formulation response');
    
    // Add cache control headers to prevent stale data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json(formulation);
  });

  app.post("/api/formulations", requireJWTAuth, checkFormulationsLimit, async (req: AuthenticatedRequest, res) => {
    try {
      const { ingredients, ...formulationData } = req.body;
      
      console.log("=== FORMULATION CREATION DEBUG ===");
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));
      console.log("Formulation data:", JSON.stringify(formulationData, null, 2));
      console.log("Ingredients:", JSON.stringify(ingredients, null, 2));
      console.log("User ID from JWT:", req.user?.id);
      
      // === ROBUST VALIDATION CHAIN ===
      
      // 1. Validate user session and ID
      if (!req.user?.id || typeof req.user.id !== 'number') {
        console.error("Invalid or missing user ID in JWT:", req.user?.id);
        return res.status(401).json({ error: "Invalid user session. Please log in again." });
      }
      
      // 2. Verify user exists in database
      console.log("Validating user ID:", req.user.id, "Type:", typeof req.user.id);
      const user = await storage.getUser(req.user.id);
      if (!user) {
        console.error("User not found in database:", req.user.id);
        // Try to debug further - let's check what users exist
        try {
          const allUsers = await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.users).limit(10);
          console.error("Sample users in database:", allUsers);
        } catch (debugError) {
          console.error("Failed to fetch sample users:", debugError);
        }
        return res.status(401).json({ error: "User authentication error. Please try logging out and back in." });
      }
      console.log("✓ User validated:", user.email);
      
      // 3. Validate basic formulation data
      if (!formulationData.name || typeof formulationData.name !== 'string' || formulationData.name.trim().length === 0) {
        return res.status(400).json({ error: "Formulation name is required and cannot be empty." });
      }
      
      if (!formulationData.batchSize || isNaN(parseFloat(formulationData.batchSize)) || parseFloat(formulationData.batchSize) <= 0) {
        return res.status(400).json({ error: "Batch size must be a positive number." });
      }
      
      if (!formulationData.batchUnit || typeof formulationData.batchUnit !== 'string') {
        return res.status(400).json({ error: "Batch unit is required." });
      }
      
      // 4. Validate ingredients array
      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ error: "A formulation must have at least one ingredient." });
      }

      // 5. Pre-validate all materials exist and are accessible
      const materialValidationPromises = ingredients.map(async (ingredient, index) => {
        if (!ingredient.materialId || typeof ingredient.materialId !== 'number' || ingredient.materialId <= 0) {
          throw new Error(`Ingredient ${index + 1}: Invalid material ID`);
        }
        
        const material = await storage.getRawMaterial(ingredient.materialId);
        if (!material) {
          throw new Error(`Ingredient ${index + 1}: Material with ID ${ingredient.materialId} not found`);
        }
        
        // Verify material belongs to the same user
        if (material.userId !== req.user?.id) {
          throw new Error(`Ingredient ${index + 1}: Material "${material.name}" is not accessible`);
        }
        
        if (!ingredient.quantity || isNaN(parseFloat(ingredient.quantity)) || parseFloat(ingredient.quantity) <= 0) {
          throw new Error(`Ingredient ${index + 1}: Invalid quantity for material "${material.name}"`);
        }
        
        return { material, ingredient };
      });
      
      const validatedMaterials = await Promise.all(materialValidationPromises);
      console.log("✓ All materials validated");
      
      // 6. Schema validation with detailed error handling
      let parsedFormulationData;
      try {
        parsedFormulationData = insertFormulationSchema.parse({ 
          ...formulationData, 
          userId: req.user.id,
          // Ensure proper type conversion
          batchSize: parseFloat(formulationData.batchSize),
          markupPercentage: formulationData.markupPercentage ? parseFloat(formulationData.markupPercentage) : 30.0,
          targetPrice: formulationData.targetPrice ? parseFloat(formulationData.targetPrice) : undefined,
        });
        console.log("✓ Schema validation passed");
      } catch (error: any) {
        console.error("Schema validation error:", error);
        if (error.errors && Array.isArray(error.errors)) {
          const errorMessages = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
          return res.status(400).json({ 
            error: "Invalid formulation data", 
            details: errorMessages,
            received: { ...formulationData, userId: req.user.id }
          });
        }
        return res.status(400).json({ error: "Invalid formulation data: " + error.message });
      }
      
      // Comprehensive validation checks
      console.log("Starting comprehensive validation...");
      
      // 1. Verify user exists and is properly authenticated
      console.log("Validating user ID:", req.user.id);
      const userExists = await db.select({ id: users.id }).from(users).where(eq(users.id, req.user.id)).limit(1);
      if (!userExists || userExists.length === 0) {
        console.error("User not found in database:", req.user.id);
        // Debug: let's see what users exist
        try {
          const allUsers = await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.users).limit(10);
          console.error("Sample users in database:", allUsers);
          
          // Let's also check the specific query
          console.error("Direct query for user ID:", req.user.id);
          const directQuery = await db.select().from(schema.users).where(eq(schema.users.id, req.user.id));
          console.error("Direct query result:", directQuery);
        } catch (debugError) {
          console.error("Failed to fetch sample users:", debugError);
        }
        return res.status(401).json({ 
          error: "User authentication error. Please log out and log back in.",
          code: "USER_NOT_FOUND"
        });
      }
      console.log("User validation passed");
      
      // 2. Validate all materials exist and belong to user
      console.log("Validating materials...");
      const materialIds = ingredients.map(ing => ing.materialId);
      const existingMaterials = await db.select({ 
        id: rawMaterials.id, 
        name: rawMaterials.name,
        userId: rawMaterials.userId 
      }).from(rawMaterials).where(inArray(rawMaterials.id, materialIds));
      
      if (existingMaterials.length !== materialIds.length) {
        const foundIds = existingMaterials.map(m => m.id);
        const missingIds = materialIds.filter(id => !foundIds.includes(id));
        console.error("Missing materials:", missingIds);
        return res.status(400).json({ 
          error: `Materials not found: ${missingIds.join(', ')}`,
          code: "MATERIALS_NOT_FOUND"
        });
      }
      
      // Check material ownership
      const unauthorizedMaterials = existingMaterials.filter(m => m.userId !== req.userId);
      console.log("Material ownership check:");
      console.log("- User ID:", req.userId);
      console.log("- Materials found:", existingMaterials.map(m => `${m.name} (ID: ${m.id}, Owner: ${m.userId})`));
      console.log("- Unauthorized materials:", unauthorizedMaterials.map(m => m.name));
      
      if (unauthorizedMaterials.length > 0) {
        console.error("Unauthorized materials:", unauthorizedMaterials.map(m => m.name));
        return res.status(403).json({ 
          error: `You don't have access to materials: ${unauthorizedMaterials.map(m => m.name).join(', ')}`,
          code: "MATERIALS_UNAUTHORIZED"
        });
      }
      console.log("Material validation passed");
      
      // 3. Validate parsed data structure
      console.log("Final data validation...");
      if (!parsedFormulationData.userId || parsedFormulationData.userId !== req.userId) {
        console.error("User ID mismatch in parsed data");
        return res.status(400).json({ 
          error: "Data validation error. Please refresh and try again.",
          code: "DATA_VALIDATION_ERROR"
        });
      }
      
      console.log("All validations passed, proceeding with transaction...");
      
      let formulation;
      await withTransaction(async (trx) => {
        console.log("Creating formulation with data:", JSON.stringify(parsedFormulationData, null, 2));
        
        // Create formulation
        const results = await trx.insert(formulations).values(parsedFormulationData).returning();
        formulation = results[0];
        console.log("Created formulation with ID:", formulation.id);
        
        let totalMaterialCost = 0;
        let markupEligibleCost = 0;
        
        // Insert ingredients robustly and calculate costs
        for (const ingredient of ingredients) {
          console.log("Processing ingredient:", JSON.stringify(ingredient, null, 2));
          
          // Fetch material details
          const [material] = await trx.select().from(rawMaterials).where(eq(rawMaterials.id, ingredient.materialId));
          if (!material) throw new Error(`Material with id ${ingredient.materialId} not found`);
          
          console.log("Found material:", material.name);
          
          const unit = material.unit;
          const unitCost = parseFloat(material.unitCost);
          const quantity = parseFloat(ingredient.quantity);
          const costContribution = unitCost * quantity;
          
          await trx.insert(formulationIngredients).values({
            formulationId: formulation.id,
            materialId: ingredient.materialId,
            quantity: ingredient.quantity,
            unit,
            costContribution: costContribution.toFixed(4),
            includeInMarkup: ingredient.includeInMarkup !== false,
          });
          
          console.log("Added ingredient:", material.name, "qty:", quantity, "cost:", costContribution.toFixed(4));
          
          // Add to total costs
          totalMaterialCost += costContribution;
          if (ingredient.includeInMarkup !== false) {
            markupEligibleCost += costContribution;
          }
        }
        
        // Calculate formulation-level costs
        const batchSize = parseFloat(parsedFormulationData.batchSize?.toString() || '1');
        const markupPercentage = parseFloat(parsedFormulationData.markupPercentage?.toString() || '30');
        
        const unitCost = batchSize > 0 ? totalMaterialCost / batchSize : 0;
        // Store markup percentage as profit margin percentage (not dollar amount)
        const profitMarginPercentage = Math.min(markupPercentage, 999.99); // Cap at database limit
        
        console.log("Calculated costs:", {
          totalMaterialCost: totalMaterialCost.toFixed(4),
          markupEligibleCost: markupEligibleCost.toFixed(4),
          unitCost: unitCost.toFixed(4),
          profitMarginPercentage: profitMarginPercentage.toFixed(2),
          totalCost: totalMaterialCost.toFixed(2)
        });
        
        // Update formulation with calculated costs (totalCost = material cost only)
        await trx.update(formulations)
          .set({
            totalCost: totalMaterialCost.toFixed(2),
            unitCost: unitCost.toFixed(4),
            profitMargin: profitMarginPercentage.toFixed(2),
          })
          .where(eq(formulations.id, formulation.id));
          
        console.log("Updated formulation costs");
      });

      // Create audit log for formulation creation
      await storage.createAuditLog({
        userId: req.userId,
        action: "create",
        entityType: "formulation",
        entityId: formulation.id,
        changes: JSON.stringify({
          description: `Created new formulation "${parsedFormulationData.name}" (${parsedFormulationData.batchSize} ${parsedFormulationData.batchUnit} batch)`,
          data: formulation
        }),
      });

      // Fetch the full formulation with ingredients
      const fullFormulation = await db.query.formulations.findFirst({
        where: eq(formulations.id, formulation.id),
        with: { ingredients: true },
      });
      res.json(fullFormulation);
    } catch (error) {
      console.error("Error creating formulation:", error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('Material with id')) {
          res.status(400).json({ error: error.message });
        } else if (error.message.includes('ingredient')) {
          res.status(400).json({ error: "Invalid ingredient data: " + error.message });
        } else {
          res.status(400).json({ error: "Failed to create formulation: " + error.message });
        }
      } else {
        res.status(500).json({ error: "An unexpected error occurred while creating the formulation" });
      }
    }
  });

  app.put("/api/formulations/:id", requireJWTAuth, checkFormulationEditLimit, checkSoftLockUsage('materials'), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const originalFormulation = await storage.getFormulation(id);
      if (!originalFormulation) {
        return res.status(404).json({ error: "Formulation not found" });
      }
      const { ingredients, ...formulationData } = req.body;
      let formulation;
      await withTransaction(async (trx) => {
        // Update formulation
        const results = await trx.update(formulations)
          .set(formulationData)
          .where(eq(formulations.id, id))
          .returning();
        formulation = results[0];
        
        // Delete all existing ingredients
        await trx.delete(formulationIngredients)
          .where(eq(formulationIngredients.formulationId, id));
        
        let totalMaterialCost = 0;
        let markupEligibleCost = 0;
        
        // Insert new ingredients robustly and calculate costs
        if (ingredients && Array.isArray(ingredients)) {
          for (const ingredient of ingredients) {
            // Fetch material details
            const [material] = await trx.select().from(rawMaterials).where(eq(rawMaterials.id, ingredient.materialId));
            if (!material) throw new Error(`Material with id ${ingredient.materialId} not found`);
            
            const unit = material.unit;
            const unitCost = parseFloat(material.unitCost);
            const quantity = parseFloat(ingredient.quantity);
            const costContribution = unitCost * quantity;
            
            await trx.insert(formulationIngredients).values({
              formulationId: id,
              materialId: ingredient.materialId,
              quantity: ingredient.quantity,
              unit,
              costContribution: costContribution.toFixed(4),
              includeInMarkup: ingredient.includeInMarkup !== false,
            });
            
            // Add to total costs
            totalMaterialCost += costContribution;
            if (ingredient.includeInMarkup !== false) {
              markupEligibleCost += costContribution;
            }
          }
        }
        
        // Calculate formulation-level costs
        const batchSize = parseFloat(formulationData.batchSize?.toString() || formulation.batchSize?.toString() || '1');
        const markupPercentage = parseFloat(formulationData.markupPercentage?.toString() || formulation.markupPercentage?.toString() || '30');
        
        const unitCost = batchSize > 0 ? totalMaterialCost / batchSize : 0;
        // Store markup percentage as profit margin percentage (not dollar amount)
        const profitMarginPercentage = Math.min(markupPercentage, 999.99); // Cap at database limit
        
        // Update formulation with calculated costs (totalCost = material cost only)
        await trx.update(formulations)
          .set({
            totalCost: totalMaterialCost.toFixed(2),
            unitCost: unitCost.toFixed(4),
            profitMargin: profitMarginPercentage.toFixed(2),
          })
          .where(eq(formulations.id, id));
      });
      // Create audit log for formulation update
      const userId = req.userId;
      await storage.createAuditLog({
        userId,
        action: "update",
        entityType: "formulation",
        entityId: id,
        changes: JSON.stringify({
          description: `Updated formulation "${formulationData.name || originalFormulation.name}"`,
          before: originalFormulation,
          after: formulation
        }),
      });

      // Fetch the full formulation with ingredients
      const fullFormulation = await db.query.formulations.findFirst({
        where: eq(formulations.id, id),
        with: { ingredients: true },
      });
      res.json(fullFormulation);
    } catch (error) {
      console.error("Error updating formulation:", error);
      res.status(400).json({ error: "Invalid formulation data" });
    }
  });

  app.delete("/api/formulations/:id", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "User authentication required" });
      }

      const formulation = await storage.getFormulation(id);
      if (!formulation) {
        return res.status(404).json({ error: "Formulation not found" });
      }

      // Check if formulation belongs to the user
      if (formulation.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check for history/usage before deciding to delete or archive
      const hasHistory = await checkFormulationHistory(id, userId);
      
      if (hasHistory.hasHistory) {
        // Archive instead of delete if there's history
        const archivedFormulation = await storage.updateFormulation(id, { isActive: false });
        
        // Create audit log for archiving
        await storage.createAuditLog({
          userId,
          action: "archive",
          entityType: "formulation",
          entityId: id,
          changes: JSON.stringify({
            description: `Archived formulation "${formulation.name}" instead of deleting due to existing history`,
            reason: hasHistory.reason,
            data: formulation,
            archivedAt: new Date().toISOString()
          }),
        });

        return res.json({ 
          success: true, 
          archived: true, 
          message: `Formulation "${formulation.name}" has been archived instead of deleted due to existing history: ${hasHistory.reason}`,
          formulation: archivedFormulation
        });
      } else {
        // Proceed with actual deletion if no history
        const deleted = await storage.deleteFormulation(id);
        
        // Create audit log for deletion
        await storage.createAuditLog({
          userId,
          action: "delete",
          entityType: "formulation",
          entityId: id,
          changes: JSON.stringify({
            description: `Permanently deleted formulation "${formulation.name}" (was ${formulation.batchSize} ${formulation.batchUnit} batch with $${formulation.totalCost} total cost)`,
            data: formulation
          }),
        });
        
        return res.json({ 
          success: true, 
          deleted: true,
          message: `Formulation "${formulation.name}" has been permanently deleted`
        });
      }
    } catch (error) {
      console.error("Error deleting/archiving formulation:", error);
      res.status(500).json({ error: "Failed to delete formulation" });
    }
  });

  // Archive formulation endpoint (manual archiving)
  app.patch("/api/formulations/:id/archive", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "User authentication required" });
      }

      const formulation = await storage.getFormulation(id);
      if (!formulation) {
        return res.status(404).json({ error: "Formulation not found" });
      }

      if (formulation.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!formulation.isActive) {
        return res.status(400).json({ error: "Formulation is already archived" });
      }

      // Archive the formulation
      const archivedFormulation = await storage.updateFormulation(id, { isActive: false });
      
      // Create audit log
      await storage.createAuditLog({
        userId,
        action: "archive",
        entityType: "formulation",
        entityId: id,
        changes: JSON.stringify({
          description: `Manually archived formulation "${formulation.name}"`,
          data: formulation,
          archivedAt: new Date().toISOString()
        }),
      });

      res.json({ 
        success: true,
        message: `Formulation "${formulation.name}" has been archived`,
        formulation: archivedFormulation
      });
    } catch (error) {
      console.error("Error archiving formulation:", error);
      res.status(500).json({ error: "Failed to archive formulation" });
    }
  });

  // Restore formulation from archive
  app.patch("/api/formulations/:id/restore", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "User authentication required" });
      }

      const formulation = await storage.getFormulation(id);
      if (!formulation) {
        return res.status(404).json({ error: "Formulation not found" });
      }

      if (formulation.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (formulation.isActive) {
        return res.status(400).json({ error: "Formulation is already active" });
      }

      // Restore the formulation
      const restoredFormulation = await storage.updateFormulation(id, { isActive: true });
      
      // Clear all formulation ingredients when restoring from archive
      // This prevents broken relationships with potentially deleted/archived materials
      const existingIngredients = await storage.getFormulationIngredients(id);
      let clearedIngredientsCount = 0;
      
      for (const ingredient of existingIngredients) {
        await storage.deleteFormulationIngredient(ingredient.id);
        clearedIngredientsCount++;
      }
      
      // Reset formulation costs to zero since ingredients are cleared
      await storage.updateFormulationCosts(id, {
        totalCost: "0.00",
        unitCost: "0.00", 
        profitMargin: "0.00"
      });
      
      // Create audit log
      await storage.createAuditLog({
        userId,
        action: "restore",
        entityType: "formulation",
        entityId: id,
        changes: JSON.stringify({
          description: `Restored formulation "${formulation.name}" from archive. Cleared ${clearedIngredientsCount} ingredients to prevent broken relationships. Formulation is ready for new ingredients.`,
          data: formulation,
          clearedIngredients: clearedIngredientsCount,
          restoredAt: new Date().toISOString()
        }),
      });

      res.json({ 
        success: true,
        message: `Formulation "${formulation.name}" has been restored from archive. ${clearedIngredientsCount} ingredient relationships were cleared to prevent broken references.`,
        formulation: restoredFormulation,
        clearedIngredients: clearedIngredientsCount
      });
    } catch (error) {
      console.error("Error restoring formulation:", error);
      res.status(500).json({ error: "Failed to restore formulation" });
    }
  });

  // Helper function to check if formulation has history
  async function checkFormulationHistory(formulationId: number, userId: number): Promise<{hasHistory: boolean, reason: string}> {
    try {
      // Check audit logs for this formulation
      const auditLogs = await storage.getAuditLogs(userId);
      const formulationAudits = auditLogs.filter(log => 
        log.entityType === 'formulation' && 
        log.entityId === formulationId && 
        log.action !== 'create' // Don't count creation as history
      );

      if (formulationAudits.length > 0) {
        return {
          hasHistory: true,
          reason: `Has ${formulationAudits.length} audit log entries`
        };
      }

      // Check if formulation was created more than 24 hours ago (indicating potential usage)
      const formulation = await storage.getFormulation(formulationId);
      if (formulation && formulation.createdAt) {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (new Date(formulation.createdAt) < dayAgo) {
          return {
            hasHistory: true,
            reason: "Formulation is older than 24 hours"
          };
        }
      }

      // Check if formulation has been updated (indicates usage)
      if (formulation && formulation.updatedAt && formulation.createdAt) {
        const created = new Date(formulation.createdAt).getTime();
        const updated = new Date(formulation.updatedAt).getTime();
        if (updated > created + 60000) { // More than 1 minute difference
          return {
            hasHistory: true,
            reason: "Formulation has been modified since creation"
          };
        }
      }

      return { hasHistory: false, reason: "No significant history found" };
    } catch (error) {
      console.error("Error checking formulation history:", error);
      // If we can't check history, err on the side of caution and archive
      return { hasHistory: true, reason: "Unable to verify history - archived for safety" };
    }
  }

  // Formulation Ingredients
  app.get("/api/formulations/:id/ingredients", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    const formulationId = parseInt(req.params.id);
    const userId = req.userId;
    
    // First verify the user owns this formulation
    const formulation = await storage.getFormulation(formulationId);
    if (!formulation) {
      return res.status(404).json({ error: "Formulation not found" });
    }
    
    if (formulation.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const ingredients = await storage.getFormulationIngredients(formulationId);
    
    // Add cache control headers to prevent stale data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
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
  app.get("/api/dashboard/stats", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    console.log(`🔧 Dashboard stats request for user ${req.userId}`);
    try {
      const userId = req.userId;
      
      // Wrap each storage call in try-catch to prevent any single query from crashing
      let materials: any[] = [];
      let formulations: any[] = [];
      let vendors: any[] = [];
      
      try {
        materials = await storage.getRawMaterials(userId!);
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
      
      try {
        formulations = await storage.getFormulations(userId!);
      } catch (error) {
        console.error('Error fetching formulations:', error);
      }
      
      try {
        vendors = await storage.getVendors(userId!);
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
      
      const totalMaterials = materials.length;
      const activeFormulations = formulations.filter(f => f.isActive).length;
      const totalInventoryValue = materials.reduce((sum, m) => sum + Number(m.totalCost || 0), 0);
      
      // Calculate average profit margin based on selling price: (Selling Price - Cost) / Selling Price * 100
      const activeFormulationsWithTarget = formulations.filter(f => f.isActive && f.targetPrice && Number(f.targetPrice) > 0);
      const avgProfitMargin = activeFormulationsWithTarget.length > 0 
        ? activeFormulationsWithTarget.reduce((sum, f) => {
            const targetPrice = Number(f.targetPrice || 0);
            const cost = Number(f.totalCost || 0);
            return sum + ((targetPrice - cost) / targetPrice * 100);
          }, 0) / activeFormulationsWithTarget.length
        : 0;

      // Ensure no NaN values are returned
      const safeAvgProfitMargin = isNaN(avgProfitMargin) ? 0 : avgProfitMargin;

      // Add cache control headers
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      console.log(`🔧 Dashboard stats calculated successfully`);
      res.json({
        totalMaterials,
        activeFormulations,
        vendorsCount: vendors.length,
        avgProfitMargin: safeAvgProfitMargin.toFixed(1),
        inventoryValue: totalInventoryValue.toFixed(2),
      });
    } catch (error) {
      console.error(`❌ Error fetching dashboard stats:`, error);
      // Return default stats to prevent dashboard crash
      res.json({
        totalMaterials: 0,
        activeFormulations: 0,
        vendorsCount: 0,
        avgProfitMargin: "0.0",
        inventoryValue: "0.00",
      });
    }
  });

  // Recent activity
  app.get("/api/dashboard/recent-activity", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    const userId = req.userId;
    console.log(`🔧 Recent activity request for user ${userId}`);
    try {
      const auditLogs = await storage.getAuditLogs(userId, 10);
      console.log(`🔧 Successfully fetched ${auditLogs.length} audit logs`);
      
      // Add debug info about the logs
      if (auditLogs.length > 0) {
        const latest = auditLogs[0];
        const minutesAgo = Math.round((Date.now() - new Date(latest.createdAt).getTime()) / 60000);
        console.log(`🔧 Latest audit log: ${latest.action} ${latest.entityType} (${minutesAgo} minutes ago)`);
      }
      
      // Add cache control headers to prevent stale data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(auditLogs);
    } catch (error) {
      console.error(`❌ Error fetching audit logs:`, error);
      // Return empty array to prevent dashboard crash
      res.json([]);
    }
  });

  // Setup vendors and categories for CSV import
  app.post("/api/setup-import-data", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
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
  app.post("/api/remove-duplicates", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
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
  app.post("/api/import/materials", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    console.log("Import materials request received");
    console.log("Auth user:", req.user);
    console.log("Auth userId:", req.userId);
    
    const userId = req.userId;
    if (!userId) {
      console.error("No userId found in request");
      return res.status(401).json({ error: "User ID not found in authenticated request" });
    }
    
    const { materials } = req.body;
    
    if (!Array.isArray(materials)) {
      return res.status(400).json({
        message: "Import failed: materials must be an array.",
        failed: 0,
        successful: 0,
        errors: ["No materials array provided in request body."],
        guidance: "Please upload a valid CSV or JSON file with an array of materials.",
        actionSteps: [
          "Check your file format. It must be a .csv or .json file with the correct columns.",
          "Download the template and compare your file structure.",
          "Try again with a corrected file."
        ],
        availableCategories: [],
        availableVendors: []
      });
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
          errors.push(`Category '${materialData.categoryName}' not found for material '${materialData.name}'.`);
          continue;
        }
        if (!vendorId) {
          failed++;
          errors.push(`Vendor '${materialData.vendorName}' not found for material '${materialData.name}'.`);
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
        await storage.createAuditLog({
          userId: req.userId,
          action: "create",
          entityType: "material",
          entityId: 0, // Will be updated after creation
          changes: JSON.stringify({
            description: `Imported raw material '${materialData.name}' via CSV import`,
            data: validatedData
          }),
        });
      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to import '${materialData.name}': ${errorMsg}`);
      }
    }

    // Always return static guidance and action steps
    const guidance = "Some materials failed to import. Please check the Setup Guide and ensure all vendors and categories exist before importing.";
    const actionSteps = [
      "Review the errors above.",
      "Create missing vendors and categories using the Setup Guide.",
      "Re-upload the same CSV or JSON file."
    ];

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
  app.get("/api/files", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const files = await storage.getFiles(req.userId);
      res.json(files);
    } catch (error) {
      console.error("Error getting files:", error);
      res.status(500).json({ error: "Failed to get files" });
    }
  });

  app.post("/api/files/upload", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const fileData = insertFileSchema.parse({
        ...req.body,
        userId: req.userId
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

  app.post("/api/:entityType/:entityId/files/attach", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { entityType, entityId } = req.params;
      const { fileId } = req.body;
      
      // Validate parameters
      if (!entityType || !entityId || !fileId) {
        return res.status(400).json({ error: "Missing required parameters: entityType, entityId, or fileId" });
      }
      
      const entityIdNum = parseInt(entityId);
      const fileIdNum = parseInt(fileId);
      
      if (isNaN(entityIdNum) || isNaN(fileIdNum)) {
        return res.status(400).json({ error: "Invalid entityId or fileId format" });
      }
      
      // Check if the file exists and belongs to the authenticated user
      const file = await storage.getFile(fileIdNum);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      if (file.userId !== req.userId) {
        return res.status(403).json({ error: "You don't have access to this file" });
      }
      
      // Check if already attached
      const existingAttachments = await storage.getFileAttachments(entityType, entityIdNum);
      const alreadyAttached = existingAttachments.some(att => att.fileId === fileIdNum);
      
      if (alreadyAttached) {
        return res.status(400).json({ error: "File is already attached to this item" });
      }
      
      const attachment = await storage.attachFile({
        fileId: fileIdNum,
        entityType,
        entityId: entityIdNum
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
  app.get("/api/reports/:tier", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
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
  app.get("/api/admin/users", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    // Check if user is admin
    const currentUser = await storage.getUser(req.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/admin/update-subscription", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Check if user is admin
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const currentUser = await storage.getUser(currentUserId);
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
        subscriptionEndDate: subscriptionStatus === 'active' ? endDate : null,
        // Clear any pending plan changes when manually updating
        // TODO: Re-enable after database migration
        // pendingPlanChange: null,
        // planChangeEffectiveDate: null
      });

      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user subscription" });
      }

      // Create audit log
      await storage.createAuditLog({
        userId: currentUser.id, // Admin who made the change
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

  // Admin endpoint to process pending downgrades manually
  // TODO: Re-enable after database migration
  /*
  app.post("/api/admin/apply-pending-downgrades", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    // Temporarily disabled - requires database migration
    return res.status(503).json({ 
      error: "Feature temporarily unavailable",
      message: "Database migration required"
    });
  });
  */

  // Test email route for debugging Gmail SMTP issues
  app.get("/api/test-email", async (req, res) => {
    try {
      console.log('🧪 Testing email configuration...');
      
      // Import email service
      const { emailService } = await import('./email');
      
      // Check if email service is configured
      if (!emailService.isConfigured()) {
        return res.status(500).json({ 
          error: "Email service not configured",
          message: "Check your .env file for GMAIL_FORGOT_EMAIL and GMAIL_FORGOT_PASS"
        });
      }
      
      // Send test email
      const testEmail = process.env.GMAIL_FORGOT_EMAIL || "test@example.com";
      const success = await emailService.sendEmail({
        to: testEmail,
        subject: 'Test Email - PIPPS Maker Calc',
        html: `
          <h2>Email Test Successful!</h2>
          <p>This is a test email from PIPPS Maker Calc.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Server:</strong> Local development</p>
          <p>If you receive this email, your Gmail SMTP configuration is working correctly.</p>
        `,
        text: `Email Test Successful! This is a test email from PIPPS Maker Calc. Timestamp: ${new Date().toISOString()}`
      });

      if (success) {
        res.json({ 
          success: true, 
          message: `Test email sent successfully to ${testEmail}`,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ 
          error: "Failed to send test email",
          message: "Check console logs for detailed error information"
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ 
        error: "Test email failed", 
        message: error.message || "Unknown error occurred"
      });
    }
  });

  // Get current user info (for frontend auth)
  // Subscribe endpoint - handles upgrades and downgrades
  app.post("/api/subscribe", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { planId } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      const currentPlan = user.subscriptionPlan || "free";
      
      // Plan price mapping for comparison
      const planPrices: Record<string, number> = {
        "free": 0,
        "starter": 7,
        "pro": 19, 
        "professional": 39,
        "business": 65,
        "enterprise": 149
      };

      const currentPrice = planPrices[currentPlan] || 0;
      const newPrice = planPrices[planId as string] || 0;

      if (newPrice > currentPrice) {
        // UPGRADE - redirect to Shopify
        const shopifyUrls: Record<string, string> = {
          "starter": "https://pipps-maker-calc-store.myshopify.com/products/starter-plan-monthly",
          "pro": "https://pipps-maker-calc-store.myshopify.com/products/pro-plan-monthly",
          "professional": "https://pipps-maker-calc-store.myshopify.com/products/professional-plan-monthly", 
          "business": "https://pipps-maker-calc-store.myshopify.com/products/business-plan-monthly",
          "enterprise": "https://pipps-maker-calc-store.myshopify.com/products/enterprise-plan-monthly"
        };

        const redirectUrl = shopifyUrls[planId as string];
        if (!redirectUrl) {
          return res.status(400).json({ error: "Invalid plan for upgrade" });
        }

        return res.json({ 
          type: "upgrade",
          redirectUrl,
          message: "Complete your purchase on Shopify. We'll apply the upgrade once payment is confirmed."
        });

      } else if (newPrice < currentPrice) {
        // DOWNGRADE - send email notifications for manual processing
        const nextBillingDate = user.subscriptionEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        const currentPlanName = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);
        const newPlanName = (planId as string).charAt(0).toUpperCase() + (planId as string).slice(1);

        try {
          // Send email to admin
          await emailService.sendEmail({
            to: process.env.GMAIL_FORGOT_EMAIL || "admin@pipps.com",
            subject: "🔽 Downgrade Request - PIPPS Maker Calc",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">Downgrade Request</h2>
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Customer:</strong> ${user.email}</p>
                  <p><strong>Company:</strong> ${user.company || 'Not specified'}</p>
                  <p><strong>Current Plan:</strong> ${currentPlanName}</p>
                  <p><strong>Requested Plan:</strong> ${newPlanName}</p>
                  <p><strong>Current Billing End:</strong> ${nextBillingDate.toLocaleDateString()}</p>
                </div>
                <p><strong>Action Required:</strong> Process this downgrade manually via the admin panel.</p>
                <p><em>Recommended: Apply the downgrade on ${nextBillingDate.toLocaleDateString()} (end of current billing cycle)</em></p>
              </div>
            `
          });

          // Send confirmation email to customer
          await emailService.sendEmail({
            to: user.email,
            subject: "Downgrade Request Received - PIPPS Maker Calc",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">Downgrade Request Confirmed</h2>
                <p>Hello,</p>
                <p>We've received your request to downgrade from <strong>${currentPlanName}</strong> to <strong>${newPlanName}</strong>.</p>
                
                <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #059669; margin-top: 0;">What happens next:</h3>
                  <ul style="margin: 10px 0;">
                    <li>✅ Your downgrade request has been submitted</li>
                    <li>📅 The change will take effect on <strong>${nextBillingDate.toLocaleDateString()}</strong></li>
                    <li>🔄 You'll keep all your current ${currentPlanName} features until then</li>
                    <li>💰 No immediate billing changes - you'll be charged the lower rate on your next billing cycle</li>
                  </ul>
                </div>

                <p>If you have any questions or need to make changes, please contact our support team.</p>
                
                <p>Thank you for using PIPPS Maker Calc!</p>
                <hr>
                <p style="color: #6b7280; font-size: 14px;">
                  This downgrade will be processed manually by our team. You'll receive a confirmation once it's applied.
                </p>
              </div>
            `
          });

          // Create audit log
          await storage.createAuditLog({
            userId: user.id,
            action: "request",
            entityType: "subscription_downgrade",
            entityId: user.id,
            changes: JSON.stringify({
              description: `Downgrade request: ${currentPlan} → ${planId}`,
              currentPlan,
              requestedPlan: planId,
              effectiveDate: nextBillingDate.toLocaleDateString(),
              processedBy: "manual"
            }),
          });

          return res.json({ 
            type: "downgrade",
            success: true,
            message: `Downgrade request submitted successfully! You'll continue to enjoy your current ${currentPlanName} features until ${nextBillingDate.toLocaleDateString()}. A confirmation email has been sent to ${user.email}.`,
            effectiveDate: nextBillingDate
          });

        } catch (emailError) {
          console.error("Email sending failed:", emailError);
          // Still return success but note email issue
          return res.json({ 
            type: "downgrade",
            success: true,
            message: `Downgrade request submitted successfully! You'll continue to enjoy your current ${currentPlanName} features until ${nextBillingDate.toLocaleDateString()}. Our team will contact you with confirmation.`,
            effectiveDate: nextBillingDate,
            warning: "Email notification may be delayed"
          });
        }

      } else {
        // Same plan
        return res.status(400).json({ error: "You're already on this plan" });
      }

    } catch (error) {
      console.error("Subscribe error:", error);
      res.status(500).json({ error: "Failed to process subscription change" });
    }
  });

  // Get subscription status endpoint
  app.get("/api/subscription/status", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        plan: user.subscriptionPlan || "free",
        status: user.subscriptionStatus || "none",
        startDate: user.subscriptionStartDate,
        endDate: user.subscriptionEndDate,
        paypalSubscriptionId: user.paypalSubscriptionId
        // TODO: Add these back after database migration
        // pendingPlanChange: (user as any).pendingPlanChange || null,
        // planChangeEffectiveDate: (user as any).planChangeEffectiveDate || null
      });
    } catch (error) {
      console.error("Error getting subscription status:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  // Get comprehensive subscription info with soft-lock status
  app.get("/api/subscription/info", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const subscriptionInfo = await getUserSubscriptionInfo(userId);
      if (!subscriptionInfo) {
        return res.status(404).json({ error: "Subscription information not found" });
      }

      res.json(subscriptionInfo);
    } catch (error) {
      console.error("Error getting subscription info:", error);
      res.status(500).json({ error: "Failed to get subscription information" });
    }
  });

  app.get("/api/user", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    // User is already authenticated through JWT middleware
    const user = await storage.getUser(req.user?.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    // Only return safe fields
    res.json({
      id: user.id,
      email: user.email,
      name: user.company || null, // Use company as display name if available
      company: user.company || null, // Add company field
      role: user.role || "user",
      subscriptionPlan: user.subscriptionPlan || "free"
    });
  });

  // Update user profile
  app.put("/api/user/profile", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const { email, company } = req.body;

      // Validate input
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Valid email is required" });
      }

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: "Email is already taken" });
        }
      }

      // Update user profile
      await storage.updateUser(userId, {
        email,
        company: company || null
      });

      // Return updated user data
      const updatedUser = await storage.getUser(userId);
      res.json({
        id: updatedUser?.id,
        email: updatedUser?.email,
        name: updatedUser?.company || null,
        company: updatedUser?.company || null,
        role: updatedUser?.role || "user",
        subscriptionPlan: updatedUser?.subscriptionPlan || "free"
      });

    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Update user password
  app.put("/api/user/password", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
      }

      // Get user and verify current password
      const user = await storage.getUser(userId);
      if (!user || !user.password) {
        return res.status(400).json({ error: "User not found or password not set" });
      }

      // Check current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const success = await storage.updateUserPassword(userId, hashedNewPassword);

      if (success) {
        res.json({ message: "Password updated successfully" });
      } else {
        res.status(500).json({ error: "Failed to update password" });
      }

    } catch (error) {
      console.error("Error updating user password:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // Cleanup formulations endpoint
  app.delete("/api/formulations/cleanup", requireJWTAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      console.log(`Cleaning up formulations for user ${userId}`);
      
      // Get all formulations for this user
      const formulations = await storage.getFormulations(userId);
      let deletedCount = 0;

      for (const formulation of formulations) {
        try {
          console.log(`Deleting formulation ${formulation.id}: ${formulation.name}`);
          
          // Delete ingredients first (foreign key constraint)
          await db.delete(formulationIngredients)
            .where(eq(formulationIngredients.formulationId, formulation.id));
          
          // Delete the formulation
          await db.delete(formulations)
            .where(eq(formulations.id, formulation.id));
          
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting formulation ${formulation.id}:`, error);
        }
      }

      // Create audit log
      await storage.createAuditLog({
        userId,
        action: "delete",
        entityType: "formulation_cleanup",
        entityId: 0,
        changes: JSON.stringify({
          description: `Cleaned up ${deletedCount} formulations`,
          deletedCount
        }),
      });

      res.json({ 
        success: true, 
        message: `Successfully deleted ${deletedCount} formulations`,
        deletedCount 
      });
    } catch (error) {
      console.error("Cleanup formulations error:", error);
      res.status(500).json({ error: "Failed to cleanup formulations" });
    }
  });

  // Serve template files for download
  app.use("/templates", express.static(path.join(__dirname, "..")));

  const httpServer = createServer(app);
  return httpServer;
}
