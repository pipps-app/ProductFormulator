# Custom Domain Setup Guide - PIPPS Maker Calc

## Setting up [subdomain].pipps.app with Replit

### Step 1: Configure DNS Records

In your domain provider's DNS settings for `pipps.app`, add a CNAME record:

```
Type: CNAME
Name: [your-subdomain] (e.g., "calculator", "app", "maker")
Value: product-formulator-jumelisa0204.replit.app
TTL: 300 (or Auto)
```

**Your configuration:**
- `maker.pipps.app` → CNAME → `product-formulator-jumelisa0204.replit.app`

### Step 2: Configure Replit Deployment

1. **Access Deployment Settings:**
   - Go to your Replit project
   - Click on the "Deploy" button
   - Navigate to deployment settings

2. **Add Custom Domain:**
   - In the deployment dashboard, look for "Custom Domains" or "Domain Settings"
   - Add your domain: `maker.pipps.app`
   - Replit will provide SSL certificate automatically

### Step 3: Update Application Configuration

Update any hardcoded URLs in your application:

**Environment Variables (if needed):**
```bash
DOMAIN_URL=https://maker.pipps.app
```

**Update documentation references:**
- Replace `product-formulator-jumelisa0204.replit.app` with your custom domain
- Update webhook URLs for Shopify integration
- Update any absolute URLs in client code

### Step 4: Update Shopify Webhooks

After domain is live, update your Shopify webhook URLs:

**From:**
```
https://product-formulator-jumelisa0204.replit.app/webhooks/shopify/subscription/created
```

**To:**
```
https://maker.pipps.app/webhooks/shopify/subscription/created
```

### Step 5: Test Configuration

1. **DNS Propagation Check:**
   ```bash
   nslookup maker.pipps.app
   ```

2. **SSL Certificate Verification:**
   - Visit `https://maker.pipps.app`
   - Verify SSL certificate is valid
   - Check for any security warnings

3. **Application Functionality:**
   - Test login/authentication
   - Verify API endpoints work
   - Test payment webhook processing

### DNS Propagation Timeline

- **Immediate**: Changes visible from some locations
- **1-4 hours**: Most locations updated
- **24-48 hours**: Global propagation complete

### Troubleshooting

**Common Issues:**

1. **"Site can't be reached"**
   - Check CNAME record spelling
   - Verify DNS propagation
   - Ensure Replit deployment is active

2. **SSL Certificate Issues**
   - Wait for Replit to provision certificate (up to 24 hours)
   - Verify domain ownership in Replit

3. **Mixed Content Warnings**
   - Ensure all internal links use HTTPS
   - Update any HTTP references to HTTPS

### Your Domain Choice

**Selected:** `maker.pipps.app`
- ✅ Short and memorable
- ✅ Brand-aligned with "PIPPS Maker Calc"
- ✅ Easy to type and communicate
- ✅ Professional appearance

### Professional Benefits

Using `maker.pipps.app` instead of `.replit.app`:
- ✅ Professional appearance
- ✅ Brand consistency
- ✅ Customer trust
- ✅ SEO benefits
- ✅ Email domain matching
- ✅ Marketing material consistency

### Next Steps After Setup

1. Update all marketing materials
2. Redirect old URLs (if applicable)
3. Update email signatures
4. Test Shopify integration thoroughly
5. Monitor application performance

---

**Note**: Keep your original `.replit.app` URL as a backup during transition period.