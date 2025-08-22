# SaaS Soft Lock / Read-Only System Implementation Guide

## Overview

This implementation provides a comprehensive "soft lock/read-only" system for all subscription-limited resources in your SaaS app. When users downgrade to a lower tier that allows fewer items than they currently have, the system:

1. **Maintains visibility** - All existing items remain visible to users
2. **Enforces usage limits** - Only items within the new plan's limits are fully editable
3. **Implements read-only mode** - Over-limit items become read-only (cannot be edited, duplicated, or used in operations)
4. **Prevents new additions** - Users cannot add new items until they're under the limit
5. **Provides clear messaging** - UI clearly indicates read-only status and upgrade paths

## Implementation Components

### Backend Components

#### 1. Enhanced Subscription Middleware (`server/subscription-soft-lock.ts`)

**Key Features:**
- `getUserSoftLockStatus()` - Gets comprehensive subscription status including over-limit items
- `isItemReadOnly()` - Checks if specific item is in read-only mode
- `checkSoftLockCreate()` - Middleware to prevent creating new items when at limit
- `checkSoftLockEdit()` - Middleware to prevent editing over-limit items
- `checkSoftLockUsage()` - Middleware to prevent using read-only items in operations

**Core Logic:**
```typescript
// Items are read-only if they exceed the plan limit
const overLimitItems = {
  materials: softLock.materials ? materials.slice(limits.maxMaterials) : [],
  formulations: softLock.formulations ? formulations.slice(limits.maxFormulations) : [],
  // ... other resources
};
```

#### 2. Updated Routes Protection (`server/routes.ts`)

**Protected Routes:**
- `PUT /api/raw-materials/:id` - Protected with `checkMaterialEditLimit`
- `PUT /api/vendors/:id` - Protected with `checkVendorEditLimit`  
- `PUT /api/material-categories/:id` - Protected with `checkCategoryEditLimit`
- `PUT /api/formulations/:id` - Protected with `checkFormulationEditLimit` + material usage check
- `POST` routes for all resources - Protected with respective create limits

#### 3. Enhanced Subscription Info API

**New Endpoint:** `GET /api/subscription/info`
- Returns comprehensive subscription status
- Includes soft-lock status for each resource type
- Lists over-limit items for each resource type
- Provides usage statistics and limits

### Frontend Components

#### 1. Subscription Hooks (`client/src/hooks/use-subscription.ts`)

**Key Hooks:**
- `useSubscriptionInfo()` - Get comprehensive subscription data
- `useResourceSoftLock(resourceType)` - Check if resource type is over limit
- `useItemReadOnlyStatus(resourceType, itemId)` - Check if specific item is read-only
- `useCanCreateResource(resourceType)` - Check if user can create new items

**Usage Example:**
```typescript
const { canCreate, reason } = useCanCreateResource('materials');
const isReadOnly = useItemReadOnlyStatus('materials', materialId);
```

#### 2. UI Components (`client/src/components/subscription/subscription-components.tsx`)

**Available Components:**

**`<ReadOnlyBadge>`** - Shows read-only indicator on over-limit items
```tsx
<ReadOnlyBadge resourceType="materials" itemId={material.id} />
```

**`<SoftLockAlert>`** - Shows warning when resource type is over limit
```tsx
<SoftLockAlert resourceType="materials" className="mb-4" />
```

**`<CreateBlockAlert>`** - Shows alert when user cannot create more items
```tsx
<CreateBlockAlert resourceType="materials" className="mb-4" />
```

**`<SubscriptionUsage>`** - Shows current usage vs limits with progress bar
```tsx
<SubscriptionUsage resourceType="materials" showProgressBar />
```

**`<PlanUpgradePrompt>`** - Promotes plan upgrades
```tsx
<PlanUpgradePrompt currentPlan="free" resourceType="materials" />
```

#### 3. Updated Pages and Components

**Materials Page (`client/src/pages/materials.tsx`):**
- Added soft-lock alerts at the top
- Disabled "Add Material" button when at limit
- Shows subscription usage in search card
- Integrated with read-only system

**Material List (`client/src/components/materials/material-list.tsx`):**
- Shows read-only badges on over-limit items
- Disables edit/delete buttons for read-only items
- Provides tooltips explaining restrictions

## Resource Coverage

The system applies to all subscription-limited resources:

1. **Raw Materials** (`materials`)
2. **Formulations** (`formulations`) 
3. **Vendors** (`vendors`)
4. **Material Categories** (`categories`)
5. **File Attachments** (`fileAttachments`)
6. **Storage Size** (`storageSize`)

## User Experience Flow

### 1. Normal Operations (Within Limits)
- Users can create, edit, delete, and use all items normally
- No restrictions or warnings shown

### 2. Approaching Limits (80%+ usage)
- Subscription usage bars show amber/warning colors
- Subtle warnings about approaching limits

### 3. At Limits (100% usage)
- "Add" buttons become disabled
- Clear messaging about plan limits
- Upgrade prompts displayed

### 4. Over Limits (After Downgrade)
- Soft-lock alerts shown prominently
- Over-limit items marked as read-only
- Edit/delete buttons disabled for read-only items
- Cannot use read-only materials in new formulations
- Clear upgrade paths provided

## Error Messages and User Feedback

### API Error Responses
```json
{
  "error": "Plan limit reached",
  "message": "Your free plan allows up to 5 materials. Upgrade to add more.",
  "currentCount": 5,
  "maxAllowed": 5,
  "plan": "free",
  "upgradeUrl": "/subscription",
  "softLock": true
}
```

### Read-Only Item Errors
```json
{
  "error": "Item is read-only",
  "message": "This material is read-only due to your current plan limits. Upgrade your plan to edit this item or remove other items to stay within limits.",
  "plan": "free",
  "upgradeUrl": "/subscription",
  "softLock": true,
  "readOnly": true
}
```

## Best Practices for Extension

### Adding New Resource Types

1. **Update Backend:**
   ```typescript
   // Add to subscription-soft-lock.ts interfaces
   interface SubscriptionLimits {
     // ... existing
     maxNewResource: number;
   }
   
   // Update planLimits configuration
   const planLimits = {
     free: { maxNewResource: 10 },
     // ... other plans
   };
   ```

2. **Add Middleware:**
   ```typescript
   export function checkNewResourceLimit(req: Request, res: Response, next: NextFunction) {
     return checkSoftLockCreate('newResource')(req, res, next);
   }
   ```

3. **Update Frontend:**
   ```typescript
   // Add to hooks/use-subscription.ts interfaces
   interface SoftLockStatus {
     // ... existing
     newResource: boolean;
   }
   
   // Use in components
   const { canCreate } = useCanCreateResource('newResource');
   ```

### Customizing UI Components

All components accept `className` props for custom styling:
```tsx
<SoftLockAlert 
  resourceType="materials" 
  className="border-red-300 bg-red-100" 
/>
```

### Adding Custom Business Logic

Extend the middleware functions to add custom validation:
```typescript
export function checkCustomMaterialLimit(req: Request, res: Response, next: NextFunction) {
  // Custom logic here
  return checkSoftLockCreate('materials')(req, res, next);
}
```

## Configuration

### Plan Limits Configuration
Located in `server/subscription-soft-lock.ts`:
```typescript
const planLimits: Record<string, SubscriptionLimits> = {
  free: { maxMaterials: 5, maxFormulations: 1, /* ... */ },
  starter: { maxMaterials: 20, maxFormulations: 8, /* ... */ },
  // ... other plans
};
```

### Frontend Configuration
Subscription tiers and features are configured in `client/src/pages/subscription.tsx`.

## Testing Scenarios

1. **Normal User Flow:**
   - User within limits can perform all operations
   - Usage bars show correct percentages

2. **Approaching Limits:**
   - Warning indicators appear at 80%+ usage
   - Upgrade prompts become visible

3. **At Limits:**
   - Create buttons disabled
   - Clear error messages when attempting to exceed limits

4. **Over Limits (Post-Downgrade):**
   - Over-limit items marked as read-only
   - Edit operations blocked for read-only items
   - Cannot use read-only items in new operations
   - All upgrade paths functional

5. **Upgrade Flow:**
   - After upgrade, read-only items become editable
   - Limits updated immediately
   - All restrictions lifted

## Security Considerations

1. **Server-Side Enforcement:** All limits are enforced server-side; UI restrictions are for UX only
2. **Input Validation:** All API calls validate item ownership and read-only status
3. **Consistent State:** Frontend state synchronizes with backend on all operations
4. **Error Handling:** Graceful degradation when subscription checks fail

## Performance Considerations

1. **Caching:** Subscription info cached for 5 minutes to reduce API calls
2. **Lazy Loading:** Read-only status checked only when needed
3. **Batch Operations:** Multiple resource checks combined into single API call
4. **Optimistic Updates:** UI updates optimistically while maintaining data consistency

This implementation provides a complete, production-ready soft-lock system that enhances user experience while enforcing subscription limits effectively.
