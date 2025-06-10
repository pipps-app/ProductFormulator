# Shopify Integration Guide for Pipps Maker Calc

This guide explains how to integrate your Pipps Maker Calc subscription software with your Shopify store.

## Overview

Your SaaS application now has three subscription tiers:
- **Free Plan**: 5 materials, 2 formulations, 1 vendor
- **Starter Plan**: $19/month - 50 materials, 25 formulations, 10 vendors
- **Professional Plan**: $49/month - Unlimited materials, formulations, vendors

## Shopify Store Setup

### 1. Create Products in Shopify

Create two products in your Shopify store:

**Product 1: "Pipps Maker Calc - Starter Plan"**
- Price: $19.00
- Recurring billing: Monthly
- Product description: Access to advanced formulation tools with expanded limits
- Product title must contain "starter" (case insensitive)

**Product 2: "Pipps Maker Calc - Professional Plan"**
- Price: $49.00
- Recurring billing: Monthly
- Product description: Unlimited access to all formulation and cost management features
- Product title must contain "professional" (case insensitive)

### 2. Configure Webhooks

In your Shopify admin panel, go to Settings > Notifications and add these webhooks:

**Order Creation Webhook:**
- Event: Order creation
- URL: `https://your-app-domain.com/webhooks/shopify/subscription/created`
- Format: JSON

**Order Cancellation Webhook:**
- Event: Order cancellation
- URL: `https://your-app-domain.com/webhooks/shopify/subscription/cancelled`
- Format: JSON

### 3. Webhook Security (Recommended)

For production, add webhook verification in your server code to ensure requests are from Shopify.

## Customer Journey

### New Customer Flow:
1. Customer purchases subscription on Shopify
2. Shopify sends webhook to your app
3. App automatically creates user account
4. App activates appropriate subscription plan
5. Customer receives email with login link
6. Customer sets password on first login

### Existing Customer Flow:
1. Existing customer purchases on Shopify
2. App finds user by email
3. App upgrades subscription plan immediately
4. Customer continues using existing account

## API Endpoints

Your app provides these endpoints for Shopify integration:

### Webhook Endpoints:
- `POST /webhooks/shopify/subscription/created` - Activates subscription
- `POST /webhooks/shopify/subscription/cancelled` - Downgrades to free plan

### Manual Integration:
- `POST /api/users/create-from-shopify` - Create user account with specific plan

### Subscription Management:
- `GET /api/subscription/status` - Check current subscription
- `GET /api/subscription/info` - Get detailed subscription info with usage

## Testing Webhooks

Test the integration using curl commands:

```bash
# Test subscription creation
curl -X POST http://localhost:5000/webhooks/shopify/subscription/created \
  -H "Content-Type: application/json" \
  -d '{
    "id": 12345,
    "customer_email": "test@example.com",
    "line_items": [
      {
        "title": "Pipps Maker Calc - Starter Plan"
      }
    ]
  }'

# Test subscription cancellation
curl -X POST http://localhost:5000/webhooks/shopify/subscription/cancelled \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "test@example.com"
  }'
```

## PayPal Configuration

To enable direct PayPal payments within the app:

1. Get PayPal sandbox credentials from developer.paypal.com
2. Update environment variables:
   - `PAYPAL_CLIENT_ID=your_sandbox_client_id`
   - `PAYPAL_CLIENT_SECRET=your_sandbox_client_secret`
3. For production, switch to live PayPal credentials

## Security Considerations

1. **Webhook Verification**: Verify Shopify webhooks using the webhook signature
2. **HTTPS Required**: All webhook URLs must use HTTPS in production
3. **Rate Limiting**: Implement rate limiting on webhook endpoints
4. **Input Validation**: Validate all incoming webhook data

## Support & Troubleshooting

### Common Issues:

**User not created:**
- Check that customer_email is present in webhook payload
- Verify email format is valid

**Wrong plan activated:**
- Ensure product titles contain "starter" or "professional"
- Check line_items array in webhook payload

**Webhook not received:**
- Verify webhook URL is accessible
- Check Shopify webhook logs
- Ensure endpoint returns 200 status

### Monitoring:

Check the audit log in your app to track all subscription activations and changes.

## Next Steps

1. Set up your Shopify store with the subscription products
2. Configure webhooks to point to your app
3. Test the integration with sample orders
4. Update PayPal credentials for payment processing
5. Deploy your app to production
6. Update webhook URLs to production endpoints

Your subscription system is now ready for integration with Shopify!