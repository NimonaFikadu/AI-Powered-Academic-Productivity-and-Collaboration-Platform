const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS
        ? process.env.SMTP_PASS.replace(/\s/g, '') // Strip spaces from app password
        : undefined;

      if (!smtpUser || !smtpPass) {
        console.warn('[LOG email_service] ========= WARNING: SMTP_USER or SMTP_PASS not set in .env — emails will NOT be sent!');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false, // Allow self-signed certs in dev
        },
      });

      console.log(`[LOG email_service] ========= Email transporter ready. Sending as: ${smtpUser}`);
    } catch (error) {
      console.error('[LOG email_service] ========= Failed to initialize email transporter:', error.message);
    }
  }

  async sendPasswordResetEmail(email, resetToken, username) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@unihub.com',
        to: email,
        subject: 'UniHub - Password Reset Request',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - UniHub</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .button:hover { background: #5a6fd8; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
                <p>UniHub Educational Platform</p>
              </div>
              <div class="content">
                <h2>Hello ${username}!</h2>
                <p>We received a request to reset your password for your UniHub account. If you didn't make this request, you can safely ignore this email.</p>
                
                <p>To reset your password, click the button below:</p>
                
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset My Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
                  ${resetUrl}
                </p>
                
                <div class="warning">
                  <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons. If you need to reset your password after that, please request a new reset link.
                </div>
                
                <p>If you're having trouble with the button above, copy and paste the URL into your web browser.</p>
                
                <p>Best regards,<br>The UniHub Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>© ${new Date().getFullYear()} UniHub Educational Platform. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Hello ${username}!
          
          We received a request to reset your password for your UniHub account.
          
          To reset your password, please visit the following link:
          ${resetUrl}
          
          This link will expire in 1 hour for security reasons.
          
          If you didn't request this password reset, you can safely ignore this email.
          
          Best regards,
          The UniHub Team
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[LOG email_service] ========= Password reset email sent successfully to ${email}. MessageId: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
      };
      
    } catch (error) {
      console.error('[LOG email_service] ========= Failed to send password reset email:', error.message || error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendPasswordChangeConfirmation(email, username) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@unihub.com',
        to: email,
        subject: 'UniHub - Password Changed Successfully',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Changed - UniHub</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #00b894 0%, #00a085 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; color: #155724; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Password Changed Successfully</h1>
                <p>UniHub Educational Platform</p>
              </div>
              <div class="content">
                <h2>Hello ${username}!</h2>
                
                <div class="success">
                  <strong>Success!</strong> Your password has been changed successfully.
                </div>
                
                <p>This email confirms that your UniHub account password was recently changed on ${new Date().toLocaleString()}.</p>
                
                <p>If you made this change, no further action is required.</p>
                
                <p><strong>If you did not make this change:</strong></p>
                <ul>
                  <li>Your account may have been compromised</li>
                  <li>Please contact our support team immediately</li>
                  <li>Consider enabling two-factor authentication for added security</li>
                </ul>
                
                <p>Best regards,<br>The UniHub Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>© ${new Date().getFullYear()} UniHub Educational Platform. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Hello ${username}!
          
          This email confirms that your UniHub account password was recently changed on ${new Date().toLocaleString()}.
          
          If you made this change, no further action is required.
          
          If you did not make this change, please contact our support team immediately.
          
          Best regards,
          The UniHub Team
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // console.log('[LOG email_service] ========= Password change confirmation email sent successfully');
      // console.log('[LOG email_service] ========= Message ID:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId
      };
      
    } catch (error) {
      // console.error('[LOG email_service] ========= Failed to send password change confirmation email:', error);
      throw new Error('Failed to send password change confirmation email');
    }
  }

  async sendPaymentSuccessEmail(email, username, amount, endDate) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@unihub.com',
        to: email,
        subject: 'UniHub - Payment Successful! You are Premium 🚀',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Successful - UniHub</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; color: #155724; }
              .receipt-details { background: white; padding: 15px; border-radius: 5px; margin-top: 20px; border: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 Payment Successful!</h1>
                <p>Welcome to UniHub Premium</p>
              </div>
              <div class="content">
                <h2>Hello ${username}!</h2>
                
                <div class="success">
                  <strong>Success!</strong> Your payment of ${amount} ETB was successfully processed.
                </div>
                
                <p>Thank you for upgrading to UniHub Premium. You now have full access to all advanced AI features, unrestricted studying, and premium materials!</p>
                
                <div class="receipt-details">
                  <h3>Transaction Details:</h3>
                  <ul>
                    <li><strong>Amount Paid:</strong> ${amount} ETB</li>
                    <li><strong>Status:</strong> Completed</li>
                    <li><strong>Subscription Valid Until:</strong> ${new Date(endDate).toLocaleDateString()}</li>
                  </ul>
                </div>
                
                <p>We are thrilled to have you onboard. Happy studying!</p>
                
                <p>Best regards,<br>The UniHub Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>© ${new Date().getFullYear()} UniHub Educational Platform. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: 'Hello ' + username + '!\n\nSuccess! Your payment of ' + amount + ' ETB was successfully processed.\n\nThank you for upgrading to UniHub Premium. Your subscription is valid until ' + new Date(endDate).toLocaleDateString() + '.\n\nBest regards,\nThe UniHub Team'
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      console.error('[LOG email_service] ========= Failed to send payment success email:', error);
      throw new Error('Failed to send payment success email');
    }
  }

  async sendSubscriptionExpiryEmail(email, username) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const renewUrl = (process.env.FRONTEND_URL || 'http://localhost:3000') + '/upgrade';

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@unihub.com',
        to: email,
        subject: 'UniHub - Your Premium Subscription Has Expired',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Subscription Expired - UniHub</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #fda085; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .button:hover { background: #fa8f6f; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏳ Subscription Expired</h1>
                <p>UniHub Educational Platform</p>
              </div>
              <div class="content">
                <h2>Hello ${username}!</h2>
                
                <p>We hope you've been enjoying UniHub Premium. We're writing to let you know that your premium subscription has expired today.</p>
                
                <p>Your account has been reverted to the free tier. Don't worry—all your data, topics, and notes are still safe! However, you may lose access to advanced AI features and higher usage limits.</p>
                
                <div style="text-align: center;">
                  <a href="${renewUrl}" class="button">Renew Premium Now</a>
                </div>
                
                <p>If you have any questions or need help, feel free to contact our support team.</p>
                
                <p>Best regards,<br>The UniHub Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>© \${new Date().getFullYear()} UniHub Educational Platform. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: 'Hello ' + username + '!\n\nWe are writing to let you know that your UniHub Premium subscription has expired today.\nYour account has been safely reverted to the free tier.\n\nTo renew your subscription and regain access to all premium features, please visit:\n' + renewUrl + '\n\nBest regards,\nThe UniHub Team'
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      console.error('[LOG email_service] ========= Failed to send subscription expiry email:', error);
      throw new Error('Failed to send subscription expiry email');
    }
  }
}

module.exports = new EmailService(); 