import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Crown, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { 
  useSubscriptionInfo, 
  useResourceSoftLock, 
  useCanCreateResource, 
  getReadOnlyMessage,
  type SoftLockStatus,
  type OverLimitItems
} from "@/hooks/use-subscription";

interface ReadOnlyBadgeProps {
  resourceType: keyof SoftLockStatus;
  itemId?: number | string;
  className?: string;
}

/**
 * Badge component to show when an item is read-only due to subscription limits
 */
export function ReadOnlyBadge({ resourceType, itemId, className = "" }: ReadOnlyBadgeProps) {
  const { data: subscriptionInfo } = useSubscriptionInfo();
  
  if (!subscriptionInfo || !itemId) return null;
  
  // Map resource types correctly
  const resourceKey = resourceType === 'fileAttachments' ? 'files' : resourceType;
  const overLimitItems = subscriptionInfo.overLimitItems[resourceKey as keyof OverLimitItems] || [];
  const isReadOnly = overLimitItems.some((item: any) => item.id === itemId);
  
  if (!isReadOnly) return null;
  
  return (
    <Badge variant="secondary" className={`bg-gray-100 text-gray-600 ${className}`}>
      <Lock className="h-3 w-3 mr-1" />
      Read-only
    </Badge>
  );
}

interface SoftLockAlertProps {
  resourceType: keyof SoftLockStatus;
  show?: boolean;
  className?: string;
}

/**
 * Alert component to show when a resource type is in soft-lock mode
 */
export function SoftLockAlert({ resourceType, show = true, className = "" }: SoftLockAlertProps) {
  const { isOverLimit, usage, limit, plan } = useResourceSoftLock(resourceType);
  const [location, setLocation] = useLocation();
  
  if (!show || !isOverLimit) return null;
  
  const resourceName = resourceType === 'fileAttachments' ? 'file attachments' : resourceType;
  
  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="text-amber-800">
          <strong>Plan limit exceeded:</strong> You have {usage} {resourceName} but your {plan} plan allows only {limit}. 
          Items beyond the limit are read-only.
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setLocation("/subscription")}
          className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          <Crown className="h-3 w-3 mr-1" />
          Upgrade
        </Button>
      </AlertDescription>
    </Alert>
  );
}

interface CreateBlockAlertProps {
  resourceType: keyof SoftLockStatus;
  className?: string;
}

/**
 * Alert component to show when user cannot create more items due to plan limits
 */
export function CreateBlockAlert({ resourceType, className = "" }: CreateBlockAlertProps) {
  const { canCreate, reason, usage, limit, plan } = useCanCreateResource(resourceType);
  const [location, setLocation] = useLocation();
  
  if (canCreate) return null;
  
  const resourceName = resourceType === 'fileAttachments' ? 'file attachments' : resourceType;
  
  return (
    <Alert className={`border-red-200 bg-red-50 ${className}`}>
      <Lock className="h-4 w-4 text-red-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="text-red-800">
          <strong>Cannot add {resourceName.slice(0, -1)}:</strong> You have reached your {plan} plan limit of {limit} {resourceName}.
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setLocation("/subscription")}
          className="ml-4 border-red-300 text-red-700 hover:bg-red-100"
        >
          <Crown className="h-3 w-3 mr-1" />
          Upgrade Plan
        </Button>
      </AlertDescription>
    </Alert>
  );
}

interface ReadOnlyMessageProps {
  resourceType: string;
  plan: string;
  className?: string;
}

/**
 * Component to show read-only message when user tries to edit over-limit items
 */
export function ReadOnlyMessage({ resourceType, plan, className = "" }: ReadOnlyMessageProps) {
  const [location, setLocation] = useLocation();
  
  return (
    <Alert className={`border-gray-200 bg-gray-50 ${className}`}>
      <Lock className="h-4 w-4 text-gray-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="text-gray-700">
          {getReadOnlyMessage(resourceType, plan)}
        </div>
        <div className="flex gap-2 ml-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/subscription")}
            className="border-gray-300"
          >
            <Crown className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface SubscriptionUsageProps {
  resourceType: keyof SoftLockStatus;
  className?: string;
  showProgressBar?: boolean;
}

/**
 * Component to show subscription usage for a resource type
 */
export function SubscriptionUsage({ resourceType, className = "", showProgressBar = false }: SubscriptionUsageProps) {
  const { isOverLimit, usage, limit, plan } = useResourceSoftLock(resourceType);
  
  const resourceName = resourceType === 'fileAttachments' ? 'file attachments' : resourceType;
  const percentage = (usage / limit) * 100;
  
  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="capitalize">{resourceName}</span>
        <span className={`font-medium ${isOverLimit ? 'text-red-600' : usage > limit * 0.8 ? 'text-amber-600' : 'text-gray-700'}`}>
          {usage} / {limit}
        </span>
      </div>
      {showProgressBar && (
        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              isOverLimit 
                ? 'bg-red-500' 
                : percentage > 80 
                  ? 'bg-amber-500' 
                  : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface PlanUpgradePromptProps {
  currentPlan: string;
  resourceType?: string;
  className?: string;
}

/**
 * Component to prompt user to upgrade their plan
 */
export function PlanUpgradePrompt({ currentPlan, resourceType, className = "" }: PlanUpgradePromptProps) {
  const [location, setLocation] = useLocation();
  
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-900">Upgrade Your Plan</h3>
          <p className="text-blue-700 text-sm mt-1">
            {resourceType 
              ? `Get more ${resourceType} and unlock additional features`
              : "Unlock more features and higher limits"
            }
          </p>
        </div>
        <Button 
          onClick={() => setLocation("/subscription")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Crown className="h-4 w-4 mr-2" />
          View Plans
        </Button>
      </div>
    </div>
  );
}
