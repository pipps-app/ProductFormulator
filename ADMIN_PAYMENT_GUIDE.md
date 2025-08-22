# Admin Payment Management Guide

## How to Use the Payment System as an Admin

### Overview
As an admin, you have full access to the payment management system. You can:
- Manually record payments
- View all payment transactions
- Process refunds
- Manage user subscriptions

### Accessing the Payment System

1. **Login as Admin**: Make sure you're logged in with admin credentials
2. **Navigate to Payments**: Go to the "Payments" page in your dashboard
3. **Admin Interface**: You'll see both the payment entry form and full payment history

### Recording Manual Payments

When you receive payment confirmation (via PayPal, bank transfer, etc.), record it manually:

#### Step-by-Step Process:

1. **Get User ID**: 
   - Check the user's account to get their User ID
   - You can find this in the users table or user management interface

2. **Fill Payment Form**:
   - **User ID**: Enter the customer's user ID
   - **Transaction ID**: Create a unique transaction ID (e.g., "TXN_PAYPAL_123456", "TXN_MANUAL_20250822_001")
   - **Amount**: Enter the payment amount (e.g., "29.99")
   - **Currency**: Select currency (default: USD)
   - **Payment Processor**: Choose from PayPal, Stripe, Shopify, or Manual/Bank Transfer
   - **Subscription Tier**: Select Pro ($29.99), Business ($49.99), or Enterprise ($99.99)
   - **Payment Type**: Choose New Subscription, Renewal, Upgrade, or One-time Payment
   - **Notes**: Optional notes about the payment

3. **Submit**: Click "Record Payment & Activate Subscription"

#### What Happens When You Record a Payment:

- ✅ Payment is logged in the database
- ✅ User's subscription status is activated
- ✅ User's subscription plan is updated
- ✅ Subscription start/end dates are set (30 days from now)
- ✅ User gains access to premium features immediately

### Payment Types Explained

- **New Subscription**: First-time subscriber
- **Renewal**: Existing subscriber renewing their plan
- **Upgrade**: User upgrading from lower to higher tier
- **One-time Payment**: Special payments or credits

### Subscription Tiers

- **Pro ($29.99/month)**:
  - Up to 50 materials
  - Up to 10 formulations
  - Up to 10 vendors
  - Up to 10 categories

- **Business ($49.99/month)**:
  - Up to 200 materials
  - Up to 50 formulations
  - Up to 25 vendors
  - Up to 25 categories

- **Enterprise ($99.99/month)**:
  - Unlimited materials
  - Unlimited formulations
  - Unlimited vendors
  - Unlimited categories

### Processing Refunds

1. **Find Payment**: Search for the payment using transaction ID
2. **Verify Status**: Only "COMPLETED" payments can be refunded
3. **Click "Process Refund"**: Button appears for completed payments
4. **Enter Refund Amount**: System suggests full amount, but you can enter partial
5. **Confirm**: Refund is processed and user is downgraded to free tier

#### What Happens During Refund:
- ❌ Payment status changed to "REFUNDED"
- ❌ User subscription status set to "inactive"
- ❌ User downgraded to "free" tier
- ❌ User loses premium features immediately
- 📅 Refund date and amount recorded

### Viewing Payment History

#### As Admin, you can see:
- All payments across all users
- User ID for each payment
- Complete transaction details
- Payment status (COMPLETED, PENDING, FAILED, REFUNDED)
- Refund information when applicable

#### Search Functionality:
- Search by transaction ID
- Results update in real-time

### Common Admin Tasks

#### New Customer Paid via PayPal:
1. Check PayPal for payment confirmation
2. Note the PayPal transaction ID
3. Record payment with:
   - User ID: [Customer's ID]
   - Transaction ID: "TXN_PAYPAL_[PayPal_ID]"
   - Processor: PayPal
   - Type: New Subscription

#### Customer Paid via Bank Transfer:
1. Verify bank transfer in your account
2. Record payment with:
   - Transaction ID: "TXN_BANK_[Date]_[Reference]"
   - Processor: Manual/Bank Transfer
   - Notes: "Bank transfer - Ref: [reference number]"

#### Manual Upgrade:
1. Customer requests upgrade mid-cycle
2. Calculate pro-rated amount
3. Record payment with:
   - Type: Upgrade
   - New tier amount
   - Notes: "Mid-cycle upgrade from [old] to [new]"

#### Renewal Process:
1. Customer renews subscription
2. Record payment with:
   - Type: Renewal
   - Same tier as before
   - System extends subscription by 30 days

### Best Practices

#### Transaction ID Format:
- PayPal: "TXN_PAYPAL_[PayPal_Transaction_ID]"
- Stripe: "TXN_STRIPE_[Stripe_Charge_ID]"
- Manual: "TXN_MANUAL_[YYYYMMDD]_[Sequential_Number]"
- Bank: "TXN_BANK_[YYYYMMDD]_[Reference]"

#### Record Keeping:
- Always include meaningful notes
- Use consistent transaction ID formats
- Double-check user ID before submitting
- Verify payment amount matches what was received

#### Customer Communication:
- Confirm subscription activation via email
- Provide transaction ID for their records
- Explain what features are now available

### Troubleshooting

#### Common Issues:

**"Admin access required" error**:
- Ensure you're logged in as admin
- Check your user role in database

**"Invalid payment data" error**:
- Check all required fields are filled
- Ensure user ID exists
- Verify transaction ID is unique

**User not upgraded after payment**:
- Check if payment was recorded successfully
- Verify user ID was correct
- Look for error messages in system logs

#### Verification Steps:
1. Check payment appears in payment history
2. Verify user's subscription status updated
3. Confirm user can access premium features
4. Check subscription end date is set correctly

### Security Notes

- Never share admin credentials
- Always verify payment before recording
- Keep transaction IDs unique and traceable
- Maintain audit trail for all transactions
- Regular backups of payment data

### Support Scenarios

#### Customer Claims Payment Not Processed:
1. Search payment history by transaction ID
2. Verify payment exists and is completed
3. Check user's subscription status
4. If payment missing, verify with payment processor
5. Record payment if confirmed but missing

#### Disputed Payment:
1. Locate payment in system
2. Check original payment processor records
3. If dispute valid, process refund
4. Update notes with dispute resolution details

#### Failed Payment Recovery:
1. Customer reports payment failed but money taken
2. Check payment processor for failed transaction
3. If money was taken, record as completed payment
4. If refund needed, process through system

This system provides complete audit trails and ensures all financial transactions are properly tracked for compliance and customer support.
