# Manual Subscription Management Guide

## Overview

Your ProductFormulator application now uses a manual subscription management system where:
1. Users can request upgrades through the application
2. Admin receives email notifications of upgrade requests
3. Admin processes payments and activates subscriptions manually
4. Proration calculations are handled automatically

## How It Works

### For Users

#### 1. Requesting an Upgrade
- Users see "Upgrade" buttons in the Reports page when accessing higher-tier reports
- Clicking "Upgrade" takes them to the subscription page with the recommended plan highlighted
- Users can review plan details and click the upgrade button
- An upgrade request is sent to the admin team
- Users receive a confirmation email that their request was submitted

#### 2. What Users See
- **Immediate feedback**: "Upgrade request submitted successfully!"
- **Timeline**: "You'll receive payment instructions within 24 hours"
- **Expectation**: "Your upgrade will be activated immediately after payment"

### For Admins

#### 1. Receiving Upgrade Requests
- Admin receives email notifications when users request upgrades
- Email includes:
  - Customer information (email, company)
  - Current plan and requested plan
  - Upgrade amount calculation
  - Request timestamp

#### 2. Processing Upgrades
1. **Calculate Proration**: Use the built-in proration calculator
2. **Collect Payment**: Contact user with exact amount due
3. **Activate Upgrade**: Use admin panel to process payment and upgrade
4. **Confirm**: User gains immediate access to new features

## Proration Handling

### How Proration Works

When a user upgrades mid-cycle:
1. **Credit calculation**: Unused portion of current plan is calculated
2. **New plan charge**: Prorated amount for new plan until next billing date
3. **Net amount**: Difference between new charge and credit

### Example Proration Calculation

**Scenario**: User upgrades from Pro ($19/month) to Business ($65/month) on day 15 of 30-day cycle

```
Current plan credit: $19 × (15 days remaining / 30 days) = $9.50
New plan charge: $65 × (15 days remaining / 30 days) = $32.50
Net charge: $32.50 - $9.50 = $23.00
```

**Admin Action**: Collect $23.00 for immediate upgrade

### Using the Proration Calculator

The admin dashboard includes a proration calculator:

1. **Input current plan**: User's existing subscription tier
2. **Input new plan**: Requested upgrade tier
3. **Input billing cycle start**: When current plan began
4. **Input upgrade date**: When upgrade should take effect
5. **Get calculation**: Exact amount to charge customer

## Admin Dashboard Features

### 1. Upgrade Requests Tab
- View all pending upgrade requests
- See customer details and plan change information
- One-click processing to payment form

### 2. Process Payment Tab
- Record payments and activate subscriptions
- Pre-filled with upgrade request data
- Automatic subscription activation

### 3. Proration Calculator Tab
- Calculate exact upgrade charges
- Handle mid-cycle upgrades fairly
- Print/save calculations for records

### 4. Analytics Tab
- View pending requests count
- Track monthly upgrade revenue
- Monitor response times

## Step-by-Step Admin Process

### Processing an Upgrade Request

1. **Receive Email Notification**
   - Open upgrade request email
   - Note customer details and upgrade information

2. **Calculate Proration**
   - Open admin dashboard → Proration Calculator tab
   - Input current plan, new plan, and dates
   - Note the calculated amount

3. **Contact Customer**
   - Email customer with exact amount due
   - Provide payment instructions (PayPal, bank transfer, etc.)
   - Include upgrade timeline

4. **Process Payment**
   - Once payment received, open admin dashboard
   - Go to "Process Payment" tab
   - Fill in payment details:
     - User ID
     - Transaction ID
     - Amount paid
     - Payment method
     - Subscription tier (new plan)

5. **Activate Subscription**
   - Click "Record Payment & Activate Subscription"
   - User immediately gains access to new features
   - System sends confirmation email to user

## Email Templates

### Admin Notification Email
```
Subject: 🔼 Upgrade Request - PIPPS Maker Calc

Customer: user@example.com
Company: Example Company
Current Plan: Pro ($19/month)
Requested Plan: Business ($65/month)
Upgrade Amount: $46/month additional
Request Date: [Date]

Action Required: Process this upgrade request and collect payment.
Use the admin proration calculator to determine exact amount for remainder of billing cycle.
```

### Customer Confirmation Email
```
Subject: Upgrade Request Received - PIPPS Maker Calc

Hello,

We've received your request to upgrade from Pro to Business.

What happens next:
✅ Your upgrade request has been submitted
💰 Our team will calculate the prorated upgrade cost
📧 You'll receive payment instructions within 24 hours
🚀 Your upgrade will be activated immediately after payment

The upgrade will include:
- Immediate access to Business features
- Prorated billing for remainder of current cycle
- Full Business billing starting next cycle
```

## Business Benefits

### 1. Better Cash Flow Control
- Manual payment processing ensures payment before activation
- No failed payment issues
- Direct customer relationship

### 2. Customer Service Opportunity
- Personal touch with upgrade process
- Direct communication for questions
- Flexible payment options

### 3. Revenue Protection
- Guaranteed payment before feature access
- No chargeback issues
- Clear audit trail

## Technical Implementation

### Database Changes
- No additional database changes needed
- Uses existing payments table
- Leverages current audit logging

### API Endpoints
- Existing `/api/subscribe` endpoint modified
- Existing `/api/payments` endpoint used
- No new backend infrastructure needed

### Frontend Changes
- Reports page upgrade buttons now functional
- Subscription page handles URL parameters
- New admin dashboard components

## Troubleshooting

### Common Issues

**User doesn't receive confirmation email**
- Check spam folder
- Verify email address in database
- Resend notification manually

**Proration calculation seems wrong**
- Verify billing cycle start date
- Check if user has multiple subscriptions
- Use 30-day cycle assumption

**User complains upgrade not activated**
- Verify payment was recorded correctly
- Check user ID in payment record
- Refresh user's browser session

### Admin Checklist

Before processing any upgrade:
- [ ] Verify user identity
- [ ] Calculate correct proration amount
- [ ] Confirm payment received
- [ ] Record payment with correct details
- [ ] Test user can access new features
- [ ] Send confirmation to user

## Security Considerations

### Payment Security
- Never store full payment details
- Use transaction IDs for reference
- Maintain audit logs of all changes

### Admin Access
- Restrict admin dashboard access
- Use strong authentication
- Log all admin actions

### Data Protection
- Encrypt sensitive customer data
- Regular security audits
- Secure email communications

This manual system provides complete control over your subscription revenue while maintaining excellent customer experience through prompt, personal service.
