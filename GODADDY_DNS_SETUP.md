# GoDaddy DNS Setup Guide - maker.pipps.app

## Step-by-Step Instructions

### Step 1: Access GoDaddy DNS Management

1. **Log into GoDaddy:**
   - Go to https://godaddy.com
   - Click "Sign In" (top right)
   - Enter your GoDaddy username and password

2. **Navigate to DNS Management:**
   - Click "My Products" in the top menu
   - Find your domain `pipps.app` in the list
   - Click the "DNS" button next to your domain
   - This opens the DNS Management page

### Step 2: Add CNAME Record

1. **Find the DNS Records Section:**
   - You'll see a table with existing DNS records
   - Look for an "Add" button (usually at the bottom)
   - Click "Add" to create a new record

2. **Configure the CNAME Record:**
   ```
   Type: CNAME
   Name: maker
   Value: product-formulator-jumelisa0204.replit.app
   TTL: 1 Hour (or 3600 seconds)
   ```

3. **Detailed Field Entry:**
   - **Type:** Select "CNAME" from the dropdown
   - **Name:** Enter exactly: `maker`
   - **Value/Points to:** Enter exactly: `product-formulator-jumelisa0204.replit.app`
   - **TTL:** Select "1 Hour" or enter "3600" if manual entry

### Step 3: Save the Record

1. **Review Your Entry:**
   - Type: CNAME
   - Name: maker
   - Value: product-formulator-jumelisa0204.replit.app
   - TTL: 1 Hour

2. **Save Changes:**
   - Click "Save" or "Add Record"
   - GoDaddy may ask for confirmation
   - Click "Continue" or "Confirm"

### Step 4: Verify the Record

1. **Check DNS Records List:**
   - You should now see your new CNAME record in the list
   - It should show: `maker.pipps.app` pointing to `product-formulator-jumelisa0204.replit.app`

2. **Note the Propagation Time:**
   - GoDaddy will show "Propagating" status
   - This typically takes 1-4 hours
   - Some changes may be visible immediately

### Step 5: Test DNS Propagation

**Wait 30 minutes, then test:**

1. **Command Line Test (if available):**
   ```bash
   nslookup maker.pipps.app
   ```

2. **Online DNS Checker:**
   - Visit: https://dnschecker.org
   - Enter: `maker.pipps.app`
   - Check if it resolves to your Replit URL

3. **Browser Test:**
   - Try visiting: `https://maker.pipps.app`
   - You may get a security warning initially (normal)

### Step 6: Configure Replit Custom Domain

**Once DNS is propagating:**

1. **Access Replit Deployment:**
   - Go to your Replit project
   - Click the "Deploy" button (rocket icon)
   - Navigate to your deployment dashboard

2. **Add Custom Domain:**
   - Look for "Domains" or "Custom Domain" section
   - Click "Add Domain" or similar button
   - Enter: `maker.pipps.app`
   - Click "Add" or "Configure"

3. **SSL Certificate:**
   - Replit will automatically provision SSL
   - This may take 5-60 minutes
   - You'll see status updates in the dashboard

### Step 7: Update Shopify Webhooks

**After domain is fully working:**

1. **Login to Shopify Admin:**
   - Go to your Shopify store admin
   - Navigate to Settings → Notifications

2. **Update Webhook URLs:**
   
   **Order Creation Webhook:**
   - Change from: `https://product-formulator-jumelisa0204.replit.app/webhooks/shopify/subscription/created`
   - Change to: `https://maker.pipps.app/webhooks/shopify/subscription/created`

   **Order Cancellation Webhook:**
   - Change from: `https://product-formulator-jumelisa0204.replit.app/webhooks/shopify/subscription/cancelled`
   - Change to: `https://maker.pipps.app/webhooks/shopify/subscription/cancelled`

### Troubleshooting Common Issues

**Problem: "Record already exists"**
- Delete any existing `maker` record first
- Then add the new CNAME record

**Problem: "Invalid value format"**
- Ensure no "https://" in the value field
- Use only: `product-formulator-jumelisa0204.replit.app`
- No trailing periods or slashes

**Problem: DNS not propagating**
- Wait longer (up to 24 hours for global propagation)
- Clear your browser cache
- Try from a different device/network

**Problem: SSL certificate issues**
- Wait for Replit to provision certificate (up to 24 hours)
- Ensure domain is properly configured in Replit
- Check Replit deployment status

### Timeline Expectations

- **DNS Record Creation:** Immediate
- **Initial Propagation:** 30 minutes - 2 hours
- **Global Propagation:** 4-24 hours
- **SSL Certificate:** 5 minutes - 24 hours
- **Full Functionality:** Within 24 hours

### Verification Checklist

- [ ] CNAME record created in GoDaddy
- [ ] DNS propagation confirmed
- [ ] Custom domain added in Replit
- [ ] SSL certificate active
- [ ] Application accessible at `https://maker.pipps.app`
- [ ] Shopify webhooks updated
- [ ] All functionality tested

### Support Resources

**If you need help:**
- GoDaddy Support: Help → Contact Support
- Replit Support: Help → Contact Support
- DNS Propagation Checker: https://dnschecker.org

---

**Important:** Keep your original `.replit.app` URL bookmarked as a backup during the transition period.