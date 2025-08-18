import nodemailer from 'nodemailer';

interface EmailConfig {
  from: string;
  user: string;
  pass: string;
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const user = process.env.GMAIL_FORGOT_EMAIL || "jumelisa0204@gmail.com";
    const pass = process.env.GMAIL_FORGOT_PASS;

    // Enhanced logging for debugging
    console.log('🔧 Email Configuration Debug:');
    console.log(`- User: ${user ? 'SET' : 'NOT SET'}`);
    console.log(`- Pass: ${pass ? `SET (${pass.length} chars)` : 'NOT SET'}`);
    console.log(`- .env loaded: ${process.env.NODE_ENV || 'development'}`);

    if (!user || !pass) {
      console.error('❌ Gmail credentials not configured. Email sending disabled.');
      console.log('Required: GMAIL_FORGOT_EMAIL and GMAIL_FORGOT_PASS in .env file');
      return;
    }

    // Validate app password format (should be 16 characters)
    const cleanPass = pass.replace(/\s+/g, '');
    if (cleanPass.length !== 16) {
      console.error(`❌ Invalid Gmail App Password format. Expected 16 chars, got ${cleanPass.length}`);
      console.log('Generate new app password at: https://myaccount.google.com/apppasswords');
      return;
    }

    this.config = {
      from: `PIPPS Maker Calc <${user}>`,
      user,
      pass: cleanPass
    };

    // Enhanced transporter configuration with explicit settings
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: this.config.user,
        pass: this.config.pass
      },
      // Add debugging and timeout settings
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    });

    console.log(`✅ Email service initialized with Gmail SMTP for ${user}`);
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    if (!this.transporter || !this.config) {
      console.log('❌ Email service not configured. Would send email:', {
        to: params.to,
        subject: params.subject,
        text: params.text
      });
      return false;
    }

    try {
      console.log(`📧 Attempting to send email to: ${params.to}`);
      console.log(`📧 Subject: ${params.subject}`);
      
      const mailOptions = {
        from: this.config.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text || params.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      console.log('📧 Response:', result.response);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send email:', error);
      console.error('📧 Error details:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, baseUrl: string): Promise<boolean> {
    const magicLink = `${baseUrl}/login?reset=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - PIPPS Maker Calc</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-size: 16px; font-weight: bold; }
          .button:hover { background: #2563eb; }
          .token { background: #e5e7eb; padding: 15px; border-radius: 6px; font-family: monospace; word-break: break-all; margin: 15px 0; font-size: 12px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PIPPS Maker Calc</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>You requested a password reset for your PIPPS Maker Calc account.</p>
            
            <div class="highlight">
              <strong>🚀 Easy Option:</strong> Click the button below to open the password reset form with token pre-filled!
            </div>
            
            <div style="text-align: center;">
              <a href="${magicLink}" class="button">Open Password Reset Form</a>
            </div>
            
            <p><strong>Alternative Option:</strong> If the button doesn't work, copy this token manually:</p>
            
            <div class="token">
              <strong>Reset Token:</strong><br>
              ${resetToken}
            </div>
            
            <p><strong>Manual steps:</strong></p>
            <ol>
              <li>Go to the PIPPS login page</li>
              <li>Click "Forgot your password?"</li>
              <li>Enter your email and submit</li>
              <li>Paste the token above</li>
              <li>Enter your new password</li>
            </ol>
            
            <p><small>This link expires in 15 minutes for security. If you didn't request this reset, ignore this email.</small></p>
          </div>
          <div class="footer">
            <p>This email was sent from PIPPS Maker Calc. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      PIPPS Maker Calc - Password Reset
      
      You requested a password reset for your account.
      
      Reset Token: ${resetToken}
      
      This token will expire in 15 minutes.
      
      Steps to reset your password:
      1. Go back to the password reset form
      2. Copy and paste the token above
      3. Enter your new password
      4. Click "Reset Password"
      
      If you didn't request this password reset, you can safely ignore this email.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - PIPPS Maker Calc',
      html,
      text
    });
  }

  async sendSupportEmail(name: string, email: string, subject: string, message: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error("Email service not configured");
      return false;
    }

    const emailParams: EmailParams = {
      to: this.config!.user, // Send to your Gmail address
      subject: `PIPPS Support: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Support Request</h2>
          <div style="background-color: #f5f5f5; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="background-color: #fff; padding: 16px; border: 1px solid #ddd; border-radius: 4px;">
            <h3>Message:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            This message was sent from the PIPPS Maker Calc contact form.
            Reply directly to this email to respond to ${name}.
          </p>
        </div>
      `,
    };

    return this.sendEmail(emailParams);
  }

  isConfigured(): boolean {
    return this.transporter !== null && this.config !== null;
  }
}

export const emailService = new EmailService();
