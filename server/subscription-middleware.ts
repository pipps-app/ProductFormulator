import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { getUserSoftLockStatus, checkSoftLockCreate, checkSoftLockEdit, planLimits as softLockPlanLimits } from "./subscription-soft-lock";

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
  starter: {
    maxMaterials: 20,
    maxFormulations: 8,
    maxVendors: 5,
    maxCategories: 5,
    maxFileAttachments: 5,
    maxStorageSize: 30
  },
  pro: {
    maxMaterials: 100,
    maxFormulations: 25,
    maxVendors: 10,
    maxCategories: 10,
    maxFileAttachments: 10,
    maxStorageSize: 100
  },
  professional: {
    maxMaterials: 300,
    maxFormulations: 60,
    maxVendors: 20,
    maxCategories: 20,
    maxFileAttachments: 25,
    maxStorageSize: 500
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
    maxMaterials: 1000,
    maxFormulations: 250,
    maxVendors: 50,
    maxCategories: 50,
    maxFileAttachments: 100,
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
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
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
        plan: userPlan,
        upgradeUrl: '/subscription'
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

export function checkCategoriesLimit(req: Request, res: Response, next: NextFunction) {
  return checkSoftLockCreate('categories')(req, res, next);
}

export function checkFileAttachmentsLimit(req: Request, res: Response, next: NextFunction) {
  return checkSoftLockCreate('fileAttachments')(req, res, next);
}

// Enhanced middleware for editing with soft-lock protection
export function checkMaterialEditLimit(req: Request, res: Response, next: NextFunction) {
  return checkSoftLockEdit('materials')(req, res, next);
}

export function checkFormulationEditLimit(req: Request, res: Response, next: NextFunction) {
  return checkSoftLockEdit('formulations')(req, res, next);
}

export function checkVendorEditLimit(req: Request, res: Response, next: NextFunction) {
  return checkSoftLockEdit('vendors')(req, res, next);
}

export function checkCategoryEditLimit(req: Request, res: Response, next: NextFunction) {
  return checkSoftLockEdit('categories')(req, res, next);
}

export async function getUserSubscriptionInfo(userId: number) {
  try {
    const user = await storage.getUser(userId);
    if (!user) return null;

    const userPlan = (user as any).subscriptionPlan || 'free';
    const limits = planLimits[userPlan] || planLimits.free;

    const [materials, formulations, vendors, categories, files] = await Promise.all([
      storage.getRawMaterials(userId),
      storage.getFormulations(userId),
      storage.getVendors(userId),
      storage.getMaterialCategories(userId),
      storage.getFiles(userId)
    ]);

    // Calculate storage usage
    const storageUsage = files.reduce((total, file) => total + file.fileSize, 0) / (1024 * 1024); // Convert to MB

    // Get soft-lock status for enhanced information
    const softLockStatus = await getUserSoftLockStatus(userId);

    return {
      plan: userPlan,
      status: (user as any).subscriptionStatus || 'none',
      limits,
      usage: {
        materials: materials.length,
        formulations: formulations.length,
        vendors: vendors.length,
        categories: categories.length,
        fileAttachments: files.length,
        storageSize: storageUsage
      },
      softLock: softLockStatus?.softLock || {
        materials: false,
        formulations: false,
        vendors: false,
        categories: false,
        fileAttachments: false
      },
      overLimitItems: softLockStatus?.overLimitItems || {
        materials: [],
        formulations: [],
        vendors: [],
        categories: [],
        files: []
      }
    };
  } catch (error) {
    console.error("Failed to get subscription info:", error);
    return null;
  }
}