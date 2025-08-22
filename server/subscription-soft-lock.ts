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

interface ResourceUsage {
  materials: number;
  formulations: number;
  vendors: number;
  categories: number;
  fileAttachments: number;
  storageSize: number;
}

interface SoftLockStatus {
  plan: string;
  limits: SubscriptionLimits;
  usage: ResourceUsage;
  softLock: {
    materials: boolean;
    formulations: boolean;
    vendors: boolean;
    categories: boolean;
    fileAttachments: boolean;
  };
  overLimitItems: {
    materials: any[];
    formulations: any[];
    vendors: any[];
    categories: any[];
    files: any[];
  };
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

/**
 * Get comprehensive subscription status including soft-lock information
 */
export async function getUserSoftLockStatus(userId: number): Promise<SoftLockStatus | null> {
  try {
    const user = await storage.getUser(userId);
    if (!user) return null;

    const userPlan = (user as any).subscriptionPlan || 'free';
    const limits = planLimits[userPlan] || planLimits.free;

    // Get all user resources
    const [materials, formulations, vendors, categories, files] = await Promise.all([
      storage.getRawMaterials(userId),
      storage.getFormulations(userId),
      storage.getVendors(userId),
      storage.getMaterialCategories(userId),
      storage.getFiles(userId)
    ]);

    // Calculate storage usage
    const storageUsage = files.reduce((total, file) => total + file.fileSize, 0) / (1024 * 1024); // Convert to MB

    const usage: ResourceUsage = {
      materials: materials.length,
      formulations: formulations.length,
      vendors: vendors.length,
      categories: categories.length,
      fileAttachments: files.length,
      storageSize: storageUsage
    };

    // Determine soft-lock status for each resource type
    const softLock = {
      materials: usage.materials > limits.maxMaterials,
      formulations: usage.formulations > limits.maxFormulations,
      vendors: usage.vendors > limits.maxVendors,
      categories: usage.categories > limits.maxCategories,
      fileAttachments: usage.fileAttachments > limits.maxFileAttachments
    };

    // Get over-limit items (items beyond the allowed count)
    const overLimitItems = {
      materials: softLock.materials ? materials.slice(limits.maxMaterials) : [],
      formulations: softLock.formulations ? formulations.slice(limits.maxFormulations) : [],
      vendors: softLock.vendors ? vendors.slice(limits.maxVendors) : [],
      categories: softLock.categories ? categories.slice(limits.maxCategories) : [],
      files: softLock.fileAttachments ? files.slice(limits.maxFileAttachments) : []
    };

    return {
      plan: userPlan,
      limits,
      usage,
      softLock,
      overLimitItems
    };
  } catch (error) {
    console.error("Failed to get soft-lock status:", error);
    return null;
  }
}

/**
 * Check if a specific item is in read-only mode due to soft-lock
 */
export async function isItemReadOnly(userId: number, resourceType: string, itemId: number): Promise<boolean> {
  const softLockStatus = await getUserSoftLockStatus(userId);
  if (!softLockStatus) return false;

  const overLimitItems = softLockStatus.overLimitItems[resourceType as keyof typeof softLockStatus.overLimitItems] || [];
  return overLimitItems.some((item: any) => item.id === itemId);
}

/**
 * Middleware to check if user can create new items (not in soft-lock)
 */
export function checkSoftLockCreate(resourceType: 'materials' | 'formulations' | 'vendors' | 'categories' | 'fileAttachments') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const softLockStatus = await getUserSoftLockStatus(userId);
      if (!softLockStatus) {
        return res.status(500).json({ error: 'Failed to check subscription status' });
      }

      const resourceKey = resourceType === 'fileAttachments' ? 'fileAttachments' : resourceType;
      const isAtLimit = softLockStatus.usage[resourceKey as keyof ResourceUsage] >= softLockStatus.limits[`max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}` as keyof SubscriptionLimits];

      if (isAtLimit) {
        return res.status(403).json({
          error: 'Plan limit reached',
          message: `Your ${softLockStatus.plan} plan allows up to ${softLockStatus.limits[`max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}` as keyof SubscriptionLimits]} ${resourceType}. Upgrade to add more.`,
          currentCount: softLockStatus.usage[resourceKey as keyof ResourceUsage],
          maxAllowed: softLockStatus.limits[`max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}` as keyof SubscriptionLimits],
          plan: softLockStatus.plan,
          upgradeUrl: '/subscription',
          softLock: true
        });
      }

      next();
    } catch (error) {
      console.error("Soft-lock check failed:", error);
      next(); // Allow request to proceed if check fails
    }
  };
}

/**
 * Middleware to check if user can edit an item (not in read-only due to soft-lock)
 */
export function checkSoftLockEdit(resourceType: 'materials' | 'formulations' | 'vendors' | 'categories') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const itemId = parseInt(req.params.id);

      if (!userId || !itemId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const isReadOnly = await isItemReadOnly(userId, resourceType, itemId);
      
      if (isReadOnly) {
        const softLockStatus = await getUserSoftLockStatus(userId);
        return res.status(403).json({
          error: 'Item is read-only',
          message: `This ${resourceType.slice(0, -1)} is read-only due to your current plan limits. Upgrade your plan to edit this item or remove other items to stay within limits.`,
          plan: softLockStatus?.plan,
          upgradeUrl: '/subscription',
          softLock: true,
          readOnly: true
        });
      }

      next();
    } catch (error) {
      console.error("Soft-lock edit check failed:", error);
      next(); // Allow request to proceed if check fails
    }
  };
}

/**
 * Middleware to check if user can use an item in operations (e.g., in formulations)
 */
export function checkSoftLockUsage(resourceType: 'materials' | 'formulations') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      
      // Check if any materials in the request are read-only
      if (resourceType === 'materials' && req.body.materials) {
        const materialIds = req.body.materials.map((m: any) => m.materialId || m.id);
        
        for (const materialId of materialIds) {
          const isReadOnly = await isItemReadOnly(userId, 'materials', materialId);
          if (isReadOnly) {
            return res.status(403).json({
              error: 'Cannot use read-only material',
              message: `One or more materials in this formulation are read-only due to your current plan limits. Upgrade your plan or use different materials.`,
              upgradeUrl: '/subscription',
              softLock: true,
              readOnly: true
            });
          }
        }
      }

      next();
    } catch (error) {
      console.error("Soft-lock usage check failed:", error);
      next(); // Allow request to proceed if check fails
    }
  };
}

// Export the enhanced functions for backward compatibility
export { planLimits };
