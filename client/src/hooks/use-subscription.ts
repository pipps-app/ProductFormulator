import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface SubscriptionLimits {
  maxMaterials: number;
  maxFormulations: number;
  maxVendors: number;
  maxCategories: number;
  maxFileAttachments: number;
  maxStorageSize: number;
}

export interface ResourceUsage {
  materials: number;
  formulations: number;
  vendors: number;
  categories: number;
  fileAttachments: number;
  storageSize: number;
}

export interface SoftLockStatus {
  materials: boolean;
  formulations: boolean;
  vendors: boolean;
  categories: boolean;
  fileAttachments: boolean;
}

export interface OverLimitItems {
  materials: any[];
  formulations: any[];
  vendors: any[];
  categories: any[];
  files: any[];
}

export interface SubscriptionInfo {
  plan: string;
  status: string;
  limits: SubscriptionLimits;
  usage: ResourceUsage;
  softLock: SoftLockStatus;
  overLimitItems: OverLimitItems;
}

/**
 * Hook to get comprehensive subscription information including soft-lock status
 */
export function useSubscriptionInfo() {
  return useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription/info"],
    queryFn: async (): Promise<SubscriptionInfo> => {
      const response = await fetch("/api/subscription/info", {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch subscription info");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Check if a resource type is in soft-lock (over limit)
 */
export function useResourceSoftLock(resourceType: keyof SoftLockStatus) {
  const { data: subscriptionInfo } = useSubscriptionInfo();
  return {
    isOverLimit: subscriptionInfo?.softLock[resourceType] || false,
    usage: subscriptionInfo?.usage[resourceType] || 0,
    limit: subscriptionInfo?.limits[`max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}` as keyof SubscriptionLimits] || 0,
    plan: subscriptionInfo?.plan || 'free'
  };
}

/**
 * Check if a specific item is read-only due to soft-lock
 */
export function useItemReadOnlyStatus(resourceType: keyof OverLimitItems, itemId?: number | string) {
  const { data: subscriptionInfo } = useSubscriptionInfo();
  
  if (!subscriptionInfo || !itemId) return false;
  
  const overLimitItems = subscriptionInfo.overLimitItems[resourceType] || [];
  return overLimitItems.some((item: any) => item.id === itemId);
}

/**
 * Get user-friendly messages for subscription limits
 */
export function getSubscriptionLimitMessage(
  resourceType: string, 
  currentCount: number, 
  maxAllowed: number, 
  plan: string
): string {
  const resourceName = resourceType === 'fileAttachments' ? 'file attachments' : resourceType;
  return `Your ${plan} plan allows up to ${maxAllowed} ${resourceName}. You currently have ${currentCount}. Upgrade to add more.`;
}

/**
 * Get read-only warning message for over-limit items
 */
export function getReadOnlyMessage(resourceType: string, plan: string): string {
  const resourceName = resourceType.replace(/s$/, ''); // Remove 's' from end
  return `This ${resourceName} is read-only due to your current ${plan} plan limits. Upgrade your plan to edit this item or remove other items to stay within limits.`;
}

/**
 * Check if user can create new items of a specific type
 */
export function useCanCreateResource(resourceType: keyof SoftLockStatus) {
  const { data: subscriptionInfo } = useSubscriptionInfo();
  
  if (!subscriptionInfo) return { canCreate: true, reason: null };
  
  const usage = subscriptionInfo.usage[resourceType];
  const limit = subscriptionInfo.limits[`max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}` as keyof SubscriptionLimits];
  
  const canCreate = usage < limit;
  const reason = canCreate ? null : getSubscriptionLimitMessage(resourceType, usage, limit, subscriptionInfo.plan);
  
  return { canCreate, reason, usage, limit, plan: subscriptionInfo.plan };
}

/**
 * Format storage size for display
 */
export function formatStorageSize(sizeInMB: number): string {
  if (sizeInMB < 1) {
    return `${(sizeInMB * 1024).toFixed(1)} KB`;
  } else if (sizeInMB < 1024) {
    return `${sizeInMB.toFixed(1)} MB`;
  } else {
    return `${(sizeInMB / 1024).toFixed(1)} GB`;
  }
}

/**
 * Get plan tier hierarchy for comparison
 */
export function getPlanTier(plan: string): number {
  const tiers = ['free', 'starter', 'pro', 'professional', 'business', 'enterprise'];
  return tiers.indexOf(plan);
}

/**
 * Check if a plan has higher limits than another
 */
export function isPlanHigher(planA: string, planB: string): boolean {
  return getPlanTier(planA) > getPlanTier(planB);
}

/**
 * Get suggested upgrade plan for a resource type
 */
export function getSuggestedUpgrade(resourceType: string, currentPlan: string): string {
  const currentTier = getPlanTier(currentPlan);
  const tiers = ['free', 'starter', 'pro', 'professional', 'business', 'enterprise'];
  
  // Suggest the next tier up
  if (currentTier < tiers.length - 1) {
    return tiers[currentTier + 1];
  }
  
  return 'enterprise'; // Highest tier
}
