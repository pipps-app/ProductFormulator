# Launch Configuration Checklist

## Email Addresses to Configure

### Support Email (Currently: maker-calc@pipps.app)
**Used in:**
- Footer contact links
- Support page contact info
- Chat widget responses
- Help documentation
- Error messages and notifications

**Files to update:**
- `client/src/components/layout/footer.tsx` (2 instances)
- `client/src/components/support/contact-info.tsx`
- `client/src/components/chat-widget.tsx` (2 instances)
- `client/src/pages/help-docs.tsx`
- `client/src/pages/support.tsx`

### Customer Support Email (Currently: support@pippsmaker.com)
**Used in:**
- Customer support documentation
- Support channel information

**Files to update:**
- `CUSTOMER_SUPPORT_GUIDE.md` (3 instances)

### Default Demo Data Emails
**Currently in storage:**
- `jumelisa@yahoo.com` (default user)
- `orders@abcsupplies.com` (demo vendor)

**Files to update:**
- `server/storage.ts`
- `server/persistent-storage.ts`

## External Links to Configure

### WhatsApp Support Link (Currently: https://wa.me/18767747372)
**Used in:**
- Footer contact information
- Support contact info
- Help documentation

**Files to update:**
- `client/src/components/layout/footer.tsx` (2 instances)
- `client/src/components/support/contact-info.tsx`
- `client/src/pages/help-docs.tsx`

### Shopify Store URLs (REQUIRED FOR LAUNCH)
**Environment Variables Needed:**
- `SHOPIFY_STARTER_URL` - Currently: https://your-store.myshopify.com/products/pipps-starter
- `SHOPIFY_PROFESSIONAL_URL` - Currently: https://your-store.myshopify.com/products/pipps-professional

**Used in:**
- Subscription upgrade redirects
- Payment processing
- User onboarding flow

**Files referencing these:**
- `server/routes.ts`
- `SHOPIFY_BILLING_GUIDE.md`
- `FINAL_DEPLOYMENT_PACKAGE.md`
- `DEPLOYMENT_GUIDE.md`

### PayPal Integration (Future Feature)
**Status:** Components exist but not currently used
- PayPal components available for future implementation
- Currently using Shopify-based payment processing

**Files:**
- `client/src/components/PayPalButton.tsx` (inactive)
- `server/paypal.ts` (inactive)

## Webhook URLs for Production

### Shopify Webhooks (REQUIRED)
**URLs to configure in Shopify:**
- Subscription created: `https://your-domain.com/webhooks/shopify/subscription/created`
- Subscription cancelled: `https://your-domain.com/webhooks/shopify/subscription/cancelled`

**Documentation:**
- `SHOPIFY_INTEGRATION.md`
- `DEPLOYMENT_GUIDE.md`
- `SHOPIFY_BILLING_GUIDE.md`
- `FINAL_DEPLOYMENT_PACKAGE.md`

## Environment Variables Required for Launch

### Email Configuration (Gmail/SendGrid)
```
GMAIL_USER=your-business-email@gmail.com
GMAIL_PASS=your-app-password
# OR
SENDGRID_API_KEY=your-sendgrid-key
```

### Shopify Integration
```
SHOPIFY_STARTER_URL=https://your-actual-store.myshopify.com/products/starter-plan
SHOPIFY_PROFESSIONAL_URL=https://your-actual-store.myshopify.com/products/professional-plan
```

### Payment Processing (Shopify-Based)
```
SHOPIFY_STARTER_URL=https://your-actual-store.myshopify.com/products/starter-plan
SHOPIFY_PROFESSIONAL_URL=https://your-actual-store.myshopify.com/products/professional-plan
```

### PayPal Configuration (Future Use)
```
# PayPal components exist but not currently active
# PAYPAL_CLIENT_ID=your-production-client-id
# PAYPAL_CLIENT_SECRET=your-production-client-secret
```

### Database
```
DATABASE_URL=your-production-database-url
```

### Session Security
```
SESSION_SECRET=your-secure-session-secret
```

## Pre-Launch Tasks

1. **Update all email addresses** to your business email
2. **Configure Shopify store URLs** with actual product links  
3. **Configure email service** (Gmail or SendGrid)
5. **Update WhatsApp number** to your business number
6. **Set up Shopify webhooks** with your domain
7. **Test all subscription flows** end-to-end
8. **Verify email notifications** are working
9. **Update support documentation** with correct contact info
10. **Clean up demo data** from storage files

## Files Requiring Manual Review
- All files in `CUSTOMER_SUPPORT_GUIDE.md`
- All files in `SHOPIFY_INTEGRATION.md`
- All files in `DEPLOYMENT_GUIDE.md`
- All files in `FINAL_DEPLOYMENT_PACKAGE.md`
- Demo data in storage files

## Domain Configuration
**Production Domain:** `maker.pipps.app`

These will be automatically correct once deployed to your domain:
- Webhook endpoints: `https://maker.pipps.app/webhooks/shopify/subscription/created`
- Authentication redirects
- API base URLs