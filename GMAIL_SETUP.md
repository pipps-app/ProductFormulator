# Gmail SMTP Setup for PIPPS Maker Calc

## Required Information:
1. **Gmail Email Address** - Your Gmail account email
2. **Gmail App Password** - A special password for applications (NOT your regular Gmail password)

## How to Get Gmail App Password:

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click "Security" in the left sidebar
3. Under "Signing in to Google", click "2-Step Verification"
4. Follow the steps to enable 2FA if not already enabled

### Step 2: Generate App Password
1. Go back to Security settings
2. Under "Signing in to Google", click "App passwords"
3. Select "Mail" as the app
4. Select "Other (custom name)" as the device
5. Enter "PIPPS Maker Calc" as the custom name
6. Click "Generate"
7. **Copy the 16-character password** (it will look like: abcd efgh ijkl mnop)

### Step 3: Provide Credentials
You'll need to provide:
- **GMAIL_USER**: Your full Gmail address (e.g., yourname@gmail.com)
- **GMAIL_APP_PASSWORD**: The 16-character app password from step 2

## Security Notes:
- App passwords are safer than using your main Gmail password
- These credentials are stored securely as environment variables
- Only used for sending password reset emails from your PIPPS application