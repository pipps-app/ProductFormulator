import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

interface SubscriptionLimits {
  maxMaterials: number;
  maxFormulations: number;
  maxVendors: number;
  maxCategories: number;
  maxFileAttachments: number;
  maxStorageSize: number; // in MB
}

const planLimits: Record<string, SubscriptionLimits> = {
  free: {
    maxMaterials: 5,
    maxFormulations: 1,
    maxVendors: 2,
    maxCategories: 2,
    maxFileAttachments: 1,
    maxStorageSize: 5
  },
  pro: {
    maxMaterials: 100,
    maxFormulations: 25,
    maxVendors: 10,
    maxCategories: 10,
    maxFileAttachments: 10,
    maxStorageSize: 100
  },
  business: {
    maxMaterials: 500,
    maxFormulations: 100,
    maxVendors: 25,
    maxCategories: 25,
    maxFileAttachments: 50,
    maxStorageSize: 1000
  },
  enterprise: {
    maxMaterials: -1,
    maxFormulations: -1,
    maxVendors: -1,
    maxCategories: -1,
    maxFileAttachments: -1,
    maxStorageSize: 10000
  }
};

export async function checkSubscriptionLimits(
  req: Request,
  res: Response,
  next: NextFunction,
  resourceType: 'materials' | 'formulations' | 'vendors'
) {
  try {
    const userId = 1; // Mock user ID - replace with proper auth later
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const userPlan = (user as any).subscriptionPlan || 'free';
    const limits = planLimits[userPlan] || planLimits.free;
    
    let currentCount = 0;
    let maxAllowed = 0;

    switch (resourceType) {
      case 'materials':
        const materials = await storage.getRawMaterials(userId);
        currentCount = materials.length;
        maxAllowed = limits.maxMaterials;
        break;
      case 'formulations':
        const formulations = await storage.getFormulations(userId);
        currentCount = formulations.length;
        maxAllowed = limits.maxFormulations;
        break;
      case 'vendors':
        const vendors = await storage.getVendors(userId);
        currentCount = vendors.length;
        maxAllowed = limits.maxVendors;
        break;
    }

    // -1 means unlimited
    if (maxAllowed !== -1 && currentCount >= maxAllowed) {
      return res.status(403).json({
        error: `Plan limit reached`,
        message: `Your ${userPlan} plan allows up to ${maxAllowed} ${resourceType}. Upgrade to add more.`,
        currentCount,
        maxAllowed,
        plan: userPlan
      });
    }

    next();
  } catch (error) {
    console.error("Subscription check failed:", error);
    next(); // Allow request to proceed if check fails
  }
}

export function checkMaterialsLimit(req: Request, res: Response, next: NextFunction) {
  return checkSubscriptionLimits(req, res, next, 'materials');
}

export function checkFormulationsLimit(req: Request, res: Response, next: NextFunction) {
  return checkSubscriptionLimits(req, res, next, 'formulations');
}

export function checkVendorsLimit(req: Request, res: Response, next: NextFunction) {
  return checkSubscriptionLimits(req, res, next, 'vendors');
}

export async function getUserSubscriptionInfo(userId: number) {
  try {
    const user = await storage.getUser(userId);
    if (!user) return null;

    const userPlan = (user as any).subscriptionPlan || 'free';
    const limits = planLimits[userPlan] || planLimits.free;

    const [materials, formulations, vendors] = await Promise.all([
      storage.getRawMaterials(userId),
      storage.getFormulations(userId),
      storage.getVendors(userId)
    ]);

    return {
      plan: userPlan,
      status: (user as any).subscriptionStatus || 'none',
      limits,
      usage: {
        materials: materials.length,
        formulations: formulations.length,
        vendors: vendors.length
      }
    };
  } catch (error) {
    console.error("Failed to get subscription info:", error);
    return null;
  }
}