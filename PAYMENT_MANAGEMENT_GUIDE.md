# Payment Management Guide for PIPPS Maker Calculator

## Transaction Recording System

Your system now includes a complete payments table to track all financial transactions internally.

### Recording Payment After Receipt

When you receive payment confirmation from your payment processor:

```bash
# Example API call to record payment
curl -X POST http://localhost:5000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "transactionId": "TXN_12345_PAYPAL",
    "paymentProcessor": "paypal",
    "amount": "29.99",
    "currency": "USD",
    "subscriptionTier": "pro",
    "paymentType": "subscription",
    "paymentStatus": "completed",
    "notes": "Monthly Pro subscription"
  }'
```

### Manual Subscription Management

**Apply New Subscription:**
```sql
-- Update user subscription
UPDATE users 
SET subscription_status = 'active',
    subscription_plan = 'pro',
    subscription_start_date = CURRENT_DATE,
    subscription_end_date = CURRENT_DATE + INTERVAL '1 month'
WHERE id = 1;

-- Record payment transaction
INSERT INTO payments (user_id, transaction_id, payment_processor, amount, currency, subscription_tier, payment_type, payment_status)
VALUES (1, 'TXN_12345', 'paypal', 29.99, 'USD', 'pro', 'subscription', 'completed');
```

**Renewal Process:**
```sql
-- Extend existing subscription
UPDATE users 
SET subscription_end_date = subscription_end_date + INTERVAL '1 month'
WHERE id = 1;

-- Record renewal payment
INSERT INTO payments (user_id, transaction_id, payment_processor, amount, currency, subscription_tier, payment_type, payment_status)
VALUES (1, 'TXN_RENEWAL_12346', 'paypal', 29.99, 'USD', 'pro', 'renewal', 'completed');
```

**Process Refund:**
```bash
# API call to process refund
curl -X POST http://localhost:5000/api/payments/123/refund \
  -H "Content-Type: application/json" \
  -d '{
    "refundAmount": "29.99"
  }'
```

### Customer Support Scenarios

**Check Payment History:**
```bash
# Get all payments for user
curl http://localhost:5000/api/payments/user/1
```

**Verify Transaction:**
```bash
# Look up payment by transaction ID
curl http://localhost:5000/api/payments/transaction/TXN_12345
```

**Manual Plan Upgrade:**
```sql
-- Immediate upgrade (pro-rated billing handled externally)
UPDATE users 
SET subscription_plan = 'enterprise'
WHERE id = 1;

-- Record upgrade payment
INSERT INTO payments (user_id, transaction_id, payment_processor, amount, currency, subscription_tier, payment_type, payment_status)
VALUES (1, 'TXN_UPGRADE_12347', 'manual', 49.99, 'USD', 'enterprise', 'upgrade', 'completed');
```

### Monitoring and Reports

**Active Subscriptions:**
```sql
SELECT u.username, u.email, u.subscription_plan, u.subscription_end_date,
       p.amount, p.payment_date, p.transaction_id
FROM users u 
LEFT JOIN payments p ON u.id = p.user_id 
WHERE u.subscription_status = 'active'
ORDER BY u.subscription_end_date ASC;
```

**Revenue Tracking:**
```sql
SELECT subscription_tier, COUNT(*) as subscribers, SUM(amount::decimal) as total_revenue
FROM payments 
WHERE payment_status = 'completed' 
AND payment_date >= CURRENT_DATE - INTERVAL '1 month'
GROUP BY subscription_tier;
```

**Expiring Subscriptions (Next 7 Days):**
```sql
SELECT username, email, subscription_plan, subscription_end_date
FROM users 
WHERE subscription_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
AND subscription_status = 'active';
```

All transaction data is stored securely in your internal database with full audit trails for financial compliance and customer support.