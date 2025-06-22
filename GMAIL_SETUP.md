# Gmail SMTP Setup for PIPPS Maker Calc

## ISSUE DETECTED: App Password Format Incorrect
Your current app password is 11 characters but should be 16 characters.

## How to Fix:

### Step 1: Get Correct App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click "Security" in the left sidebar
3. Under "Signing in to Google", click "App passwords"
4. **DELETE the old app password first**
5. Click "Generate new app password"
6. Select "Mail" as the app
7. Select "Other (custom name)" as the device
8. Enter "PIPPS Maker Calc" as the custom name
9. Click "Generate"
10. **Copy the FULL 16-character password** (format: abcd efgh ijkl mnop)

### Important Notes:
- The app password must be EXACTLY 16 characters
- Include spaces if shown (or remove all spaces)
- Copy the entire password Google generates
- Don't use your regular Gmail password

## Current Status:
- Gmail User: Configured ✓
- App Password: INCORRECT FORMAT (11 chars instead of 16) ❌

## Required Format:
- **GMAIL_USER**: Your full Gmail address (e.g., yourname@gmail.com)
- **GMAIL_APP_PASSWORD**: 16-character app password (e.g., abcdefghijklmnop or abcd efgh ijkl mnop)

Once you have the correct 16-character app password, provide it again and the email service will work.