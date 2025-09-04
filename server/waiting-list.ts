import { Request, Response } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { emailService } from "./email";
import { insertWaitingListSchema, type InsertWaitingListEntry } from "@shared/schema";

// Validation schema for joining waiting list
const joinWaitingListSchema = insertWaitingListSchema.extend({
  name: z.string().min(2, "Name is required"),
  company: z.string().optional(),
  currentUsageEstimate: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().max(500, "Message cannot exceed 500 characters").optional(),
});

/**
 * Join the waiting list for higher-tier plans
 */
export async function joinWaitingList(req: Request, res: Response) {
  try {
    const validatedData = joinWaitingListSchema.parse(req.body);
    
    // Check if email already exists in waiting list for this plan
    const existing = await storage.getWaitingListByEmail(validatedData.email, validatedData.planInterest);
    if (existing) {
      return res.status(409).json({
        error: "Already on waiting list",
        message: `You're already on the waiting list for the ${validatedData.planInterest} plan. We'll notify you when it becomes available.`
      });
    }

    // Check for duplicate email for this plan
    const existingEntry = await storage.getWaitingListByEmail(validatedData.email, validatedData.planInterest);
    if (existingEntry) {
      return res.status(409).json({
        error: "Duplicate email",
        message: `You're already on the waiting list for the ${validatedData.planInterest} plan!`
      });
    }

    // Add to waiting list
    const waitingListEntry = await storage.addToWaitingList(validatedData);

    // Send confirmation email to user
    await emailService.sendEmail({
      to: validatedData.email,
      subject: `Thanks for joining the ${validatedData.planInterest} plan waiting list!`,
      html: generateUserConfirmationEmail(validatedData)
    });

    // Send notification email to admin
    await emailService.sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@productformulator.com',
      subject: `New waiting list signup: ${validatedData.planInterest} plan`,
      html: generateAdminNotificationEmail(validatedData)
    });

    res.status(201).json({
      success: true,
      message: `You've been added to the ${validatedData.planInterest} plan waiting list. We'll notify you as soon as it becomes available!`,
      estimatedWaitTime: getEstimatedWaitTime(validatedData.planInterest)
    });

  } catch (error) {
    console.error("Failed to join waiting list:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors
      });
    }

    res.status(500).json({
      error: "Failed to join waiting list",
      message: "Please try again later or contact support."
    });
  }
}

/**
 * Get waiting list statistics (admin only)
 */
export async function getWaitingListStats(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const user = await storage.getUser(userId);
    
    if (!user || (user as any).role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const stats = await storage.getWaitingListStats();
    res.json(stats);

  } catch (error) {
    console.error("Failed to get waiting list stats:", error);
    res.status(500).json({ error: "Failed to get waiting list stats" });
  }
}

/**
 * Get waiting list entries (admin only)
 */
export async function getWaitingListEntries(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const user = await storage.getUser(userId);
    
    if (!user || (user as any).role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { plan, status, page = 1, limit = 50 } = req.query;
    const entries = await storage.getWaitingListEntries({
      plan: plan as string,
      status: status as string,
      page: Number(page),
      limit: Number(limit)
    });

    res.json(entries);

  } catch (error) {
    console.error("Failed to get waiting list entries:", error);
    res.status(500).json({ error: "Failed to get waiting list entries" });
  }
}

/**
 * Update waiting list entry status (admin only)
 */
export async function updateWaitingListStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const user = await storage.getUser(userId);
    
    if (!user || (user as any).role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'contacted', 'converted', 'declined'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await storage.updateWaitingListStatus(Number(id), status, notes);
    
    res.json({
      success: true,
      message: "Waiting list entry updated successfully"
    });

  } catch (error) {
    console.error("Failed to update waiting list status:", error);
    res.status(500).json({ error: "Failed to update waiting list status" });
  }
}

/**
 * Check if app is in soft launch mode
 */
export async function getSoftLaunchStatus(req: Request, res: Response) {
  try {
    const softLaunchMode = await storage.getAppSetting('soft_launch_mode');
    const availablePlans = await storage.getAppSetting('available_plans');

    res.json({
      softLaunchMode: softLaunchMode === 'true',
      availablePlans: availablePlans ? JSON.parse(availablePlans) : ['free'],
      message: softLaunchMode === 'true' 
        ? "We're currently in soft launch mode. Higher-tier plans are coming soon!"
        : "All plans are available"
    });

  } catch (error) {
    console.error("Failed to get soft launch status:", error);
    res.status(500).json({ error: "Failed to get soft launch status" });
  }
}

// Helper functions
function generateUserConfirmationEmail(data: InsertWaitingListEntry) {
  return `
    <h2>Thanks for your interest in the ${data.planInterest} plan!</h2>
    
    <p>Hi ${data.name},</p>
    
    <p>You've been successfully added to the waiting list for our <strong>${data.planInterest} plan</strong>.</p>
    
    <p><strong>What happens next:</strong></p>
    <ul>
      <li>We'll notify you as soon as the ${data.planInterest} plan becomes available</li>
      <li>Early access subscribers get special launch pricing</li>
      <li>You'll be among the first to access advanced features</li>
    </ul>
    
    <p><strong>Estimated wait time:</strong> ${getEstimatedWaitTime(data.planInterest)}</p>
    
    <p>In the meantime, feel free to explore all the features available in our free plan!</p>
    
    <p>Best regards,<br>
    The ProductFormulator Team</p>
    
    <p><small>You can manage your waiting list preferences by contacting support.</small></p>
  `;
}

function generateAdminNotificationEmail(data: InsertWaitingListEntry) {
  return `
    <h2>New Waiting List Signup</h2>
    
    <p><strong>Plan Interest:</strong> ${data.planInterest}</p>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Company:</strong> ${data.company || 'Not provided'}</p>
    <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
    <p><strong>Current Usage Estimate:</strong> ${data.currentUsageEstimate || 'Not provided'}</p>
    
    ${data.message ? `<p><strong>Message:</strong><br>${data.message}</p>` : ''}
    
    <p><a href="${process.env.FRONTEND_URL}/admin/waiting-list">View in Admin Dashboard</a></p>
  `;
}

function getEstimatedWaitTime(plan: string): string {
  const waitTimes: Record<string, string> = {
    starter: "2-4 weeks",
    pro: "4-6 weeks", 
    professional: "6-8 weeks",
    business: "8-10 weeks",
    enterprise: "10-12 weeks"
  };
  
  return waitTimes[plan] || "4-8 weeks";
}
