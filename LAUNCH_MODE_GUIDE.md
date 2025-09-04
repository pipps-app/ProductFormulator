# ProductFormulator - Launch Mode Management

## Quick Switch to Full Launch

When you're ready to enable all paid subscriptions:

```bash
# Switch to full launch mode (enables all tiers)
node toggle-launch-mode.js full
```

## Soft Launch Mode

To go back to soft launch (free tier only):

```bash
# Switch to soft launch mode  
node toggle-launch-mode.js soft
```

## Launch Transition Checklist

### Before Going Live:
- [ ] Test all payment integrations
- [ ] Set up customer support processes
- [ ] Prepare launch announcement
- [ ] Review waiting list members
- [ ] Set up discount codes for early adopters

### Migration Steps:
1. **Review waiting list**: `node migrate-waiting-list.js`
2. **Send welcome emails** to waiting list members
3. **Enable full launch**: `node toggle-launch-mode.js full`
4. **Monitor subscriptions** in admin dashboard
5. **Follow up** with waiting list conversions

### What Changes When You Go Live:
- ✅ All subscription tiers become available
- ✅ Payment processing activates
- ✅ Waiting list signup buttons become "Subscribe" buttons
- ✅ All existing functionality remains intact
- ✅ Waiting list data is preserved for marketing

### What Stays the Same:
- ✅ All user data and formulations
- ✅ Free tier functionality
- ✅ Database schema (no data loss)
- ✅ Admin features and analytics
- ✅ Subscription management system

## Benefits of This Approach:

1. **Zero Data Loss**: All existing functionality preserved
2. **Marketing Gold**: Waiting list becomes your launch audience  
3. **Gradual Rollout**: Control when features become available
4. **Early Feedback**: Test with free users before monetizing
5. **Clean Transition**: Simple toggle, no complex migration

## Monitoring Commands:

```bash
# Check current launch mode
psql $DATABASE_URL -c "SELECT * FROM app_settings WHERE setting_key LIKE '%launch%';"

# View waiting list stats
psql $DATABASE_URL -c "SELECT plan_interest, COUNT(*) FROM waiting_list GROUP BY plan_interest;"

# Check subscription activity after launch
psql $DATABASE_URL -c "SELECT subscription_plan, COUNT(*) FROM users WHERE subscription_plan IS NOT NULL GROUP BY subscription_plan;"
```
