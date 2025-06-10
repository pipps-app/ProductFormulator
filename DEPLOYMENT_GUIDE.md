# Pipps Maker Calc - Deployment & Shopify Integration Guide

## Overview
Your SaaS formulation management software is ready for deployment with full subscription functionality and Shopify integration.

## Features Implemented
✅ Three-tier subscription system (Free, Starter $19, Professional $49)
✅ PayPal payment integration with sandbox support
✅ Automatic subscription limit enforcement
✅ Shopify webhook integration for automated user creation
✅ Real-time usage tracking and subscription management
✅ Complete material, formulation, and vendor management
✅ Cost calculation and profit margin analysis

## Deployment Steps

### 1. Environment Variables Required

```bash
# Database
DATABASE_URL=your_postgresql_connection_string

# PayPal Credentials (get from developer.paypal.com)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Optional: For production
NODE_ENV=production
```

### 2. Database Setup
Your PostgreSQL database will auto-initialize with the required schema. The system includes:
- User accounts with subscription tracking
- Material categories and vendors
- Formulations with cost calculations
- Audit logging for all changes

### 3. Shopify Store Configuration

#### Create Subscription Products:
1. **Starter Plan Product**
   - Title: "Pipps Maker Calc - Starter Plan" 
   - Price: $19.00/month
   - Recurring subscription

2. **Professional Plan Product**
   - Title: "Pipps Maker Calc - Professional Plan"
   - Price: $49.00/month  
   - Recurring subscription

#### Configure Webhooks:
Navigate to Shopify Admin → Settings → Notifications → Webhooks

**Add Order Creation Webhook:**
- Event: Order creation
- URL: `https://your-domain.com/webhooks/shopify/subscription/created`
- Format: JSON

**Add Order Cancellation Webhook:**
- Event: Order cancellation  
- URL: `https://your-domain.com/webhooks/shopify/subscription/cancelled`
- Format: JSON

### 4. Customer Onboarding Flow

When a customer purchases through Shopify:
1. Shopify sends webhook to your app
2. App creates user account automatically
3. App activates appropriate subscription tier
4. Customer receives email with login instructions
5. Customer sets password on first login

## API Endpoints for Integration

### Subscription Management
- `GET /api/subscription/status` - Current subscription details
- `GET /api/subscription/info` - Usage stats and limits
- `POST /api/subscription/activate-free` - Activate free tier

### Shopify Webhooks  
- `POST /webhooks/shopify/subscription/created` - New subscription
- `POST /webhooks/shopify/subscription/cancelled` - Cancel subscription
- `POST /api/users/create-from-shopify` - Manual user creation

### Core Application APIs
- `GET /api/raw-materials` - Material management
- `GET /api/formulations` - Formulation management  
- `GET /api/vendors` - Vendor management
- `GET /api/dashboard/stats` - Usage analytics

## Subscription Limits

| Feature | Free | Starter | Professional |
|---------|------|---------|-------------|
| Materials | 5 | 50 | Unlimited |
| Formulations | 2 | 25 | Unlimited |
| Vendors | 1 | 10 | Unlimited |
| Cost Calculations | ✅ | ✅ | ✅ |
| Export/Import | ❌ | ✅ | ✅ |
| Advanced Analytics | ❌ | ❌ | ✅ |

## PayPal Configuration

### Sandbox Testing:
1. Visit developer.paypal.com
2. Create sandbox application
3. Copy Client ID and Client Secret
4. Update environment variables

### Production Setup:
1. Switch to live PayPal application
2. Update credentials in production environment
3. Test with small transactions first

## Security Considerations

### Webhook Security:
- Verify Shopify webhook signatures in production
- Use HTTPS for all webhook endpoints
- Implement rate limiting on webhook routes

### User Security:
- Passwords are hashed using bcrypt
- Session management with secure cookies
- SQL injection protection via Drizzle ORM

## Monitoring & Analytics

### Built-in Tracking:
- Subscription activations logged in audit trail
- Usage statistics tracked per user
- Real-time limit enforcement
- Material and formulation cost calculations

### Recommended Monitoring:
- Set up application monitoring (e.g., Sentry)
- Monitor webhook delivery success rates
- Track subscription conversion metrics
- Monitor PayPal payment success rates

## Troubleshooting Common Issues

### Webhook Not Received:
- Verify webhook URL is publicly accessible
- Check Shopify webhook delivery logs
- Ensure endpoint returns 200 status code

### PayPal Payments Failing:
- Verify sandbox vs production credentials
- Check amount formatting (must be strings)
- Ensure currency codes are valid

### Subscription Limits Not Working:
- Check user subscription status in database
- Verify middleware is applied to routes
- Review audit logs for limit violations

## Production Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] PayPal credentials updated
- [ ] Shopify webhooks configured
- [ ] SSL certificate installed
- [ ] Application monitoring enabled
- [ ] Backup strategy implemented
- [ ] Error logging configured

## Next Steps

1. Deploy application to production hosting
2. Configure domain and SSL
3. Set up Shopify store products
4. Configure webhooks with production URLs
5. Test complete purchase flow
6. Launch and monitor

Your SaaS application is production-ready with full subscription and payment functionality!