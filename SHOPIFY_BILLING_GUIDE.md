# Shopify Billing Integration - Complete Setup Guide

## Overview
Your subscription system now uses Shopify for all payment processing, eliminating the need for PayPal integration. Customers purchase subscriptions through your Shopify store, and webhooks automatically activate their accounts.

## How It Works

### Customer Journey:
1. Customer clicks "Upgrade" in your app
2. App redirects to your Shopify store product page
3. Customer completes purchase on Shopify (handles all payment methods)
4. Shopify sends webhook to your app
5. App automatically creates account and activates subscription
6. Customer receives login credentials and can start using their subscription

### Technical Flow:
1. App receives subscription request
2. Returns Shopify store URL for the selected plan
3. Frontend opens new tab to Shopify product page
4. Webhook processes completed purchase
5. User account created/upgraded automatically

## Shopify Store Setup

### 1. Create Subscription Products

**Starter Plan Product:**
- Product Title: "Pipps Maker Calc - Starter Plan"
- Price: $19.00
- Recurring: Monthly subscription
- Description: "50 materials, 25 formulations, 10 vendors"

**Professional Plan Product:**
- Product Title: "Pipps Maker Calc - Professional Plan"  
- Price: $49.00
- Recurring: Monthly subscription
- Description: "Unlimited materials, formulations, and vendors"

### 2. Configure Environment Variables

```bash
# Optional: Custom Shopify URLs (defaults provided)
SHOPIFY_STARTER_URL=https://your-store.myshopify.com/products/pipps-starter
SHOPIFY_PROFESSIONAL_URL=https://your-store.myshopify.com/products/pipps-professional
```

### 3. Set Up Webhooks

In Shopify Admin → Settings → Notifications:

**Order Creation Webhook:**
- Event: Order creation
- URL: `https://your-domain.com/webhooks/shopify/subscription/created`
- Format: JSON

**Order Cancellation Webhook:**
- Event: Order cancellation
- URL: `https://your-domain.com/webhooks/shopify/subscription/cancelled`
- Format: JSON

## Benefits of Shopify Billing

### For You:
- No complex payment processing integration
- Shopify handles all payment methods (cards, PayPal, Apple Pay, etc.)
- Built-in tax calculation and compliance
- Automatic recurring billing management
- Professional checkout experience
- Shopify's fraud protection

### For Customers:
- Familiar, trusted checkout process
- Multiple payment options
- Shopify's customer support for billing issues
- Easy subscription management through Shopify
- Mobile-optimized checkout

## API Endpoints

### Subscription Management
- `POST /api/subscribe` - Returns Shopify store URL
- `GET /api/subscription/status` - Current subscription details
- `GET /api/subscription/info` - Usage stats and limits

### Webhooks (for Shopify)
- `POST /webhooks/shopify/subscription/created` - Activate subscription
- `POST /webhooks/shopify/subscription/cancelled` - Cancel subscription

### User Management
- `POST /api/users/create-from-shopify` - Manual account creation

## Testing

### Test Subscription Flow:
```bash
# Test subscription redirect
curl -X POST http://localhost:5000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"planId": "starter"}'

# Expected response:
{
  "success": true,
  "message": "Redirecting to Shopify for secure payment",
  "redirectUrl": "https://your-store.myshopify.com/products/pipps-starter",
  "planId": "starter"
}
```

### Test Webhook Processing:
```bash
# Simulate Shopify webhook
curl -X POST http://localhost:5000/webhooks/shopify/subscription/created \
  -H "Content-Type: application/json" \
  -d '{
    "id": "shopify_order_123",
    "customer_email": "customer@example.com",
    "line_items": [{"title": "Pipps Maker Calc - Starter Plan"}]
  }'

# Expected response:
{
  "success": true,
  "message": "starter subscription activated for customer@example.com"
}
```

## Production Deployment

### 1. Deploy Application
- Use any hosting platform (Heroku, Railway, DigitalOcean)
- Set DATABASE_URL environment variable
- No PayPal credentials required

### 2. Configure Shopify Webhooks
- Update webhook URLs to production domain
- Test webhook delivery

### 3. Update Store URLs
- Set SHOPIFY_STARTER_URL and SHOPIFY_PROFESSIONAL_URL
- Point to actual Shopify product pages

## Customer Support Integration

### Subscription Issues:
- Customers contact Shopify for billing/payment issues
- You handle app functionality and feature requests
- Webhook logs provide audit trail for troubleshooting

### Account Management:
- Users can upgrade/downgrade through your Shopify store
- Cancellations automatically downgrade to free plan
- Manual account creation available through API

## Revenue Tracking

### Built-in Analytics:
- Shopify provides comprehensive sales analytics
- Your app tracks usage and feature adoption
- Audit logs show subscription activation history

### Integration Benefits:
- Shopify handles taxes, refunds, chargebacks
- Professional invoicing and receipts
- International payment support
- PCI compliance included

Your subscription system is now production-ready with Shopify billing integration!