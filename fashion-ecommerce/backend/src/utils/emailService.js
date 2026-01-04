"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = exports.sendPasswordResetEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const createTransporter = () => {
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
    if (!smtpUser || !smtpPass) {
        console.warn('⚠️ Email credentials not found. Email sending will be disabled.');
        console.warn('⚠️ Please add to .env.local (root) or backend/.env.local:');
        console.warn('   SMTP_USER=your-email@gmail.com');
        console.warn('   SMTP_PASS=your-app-password');
        console.warn('   (Or use GMAIL_USER and GMAIL_APP_PASSWORD for legacy support)');
        return null;
    }
    console.log('✅ Email credentials found. Email service ready.');
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
        return nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT, 10),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });
    }
    return nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });
};
const sendPasswordResetEmail = async (email, resetToken, userName) => {
    try {
        const transporter = createTransporter();
        if (!transporter) {
            console.error('❌ Email transporter not available. Gmail credentials missing.');
            return false;
        }
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
        const fromEmail = process.env.SMTP_FROM || process.env.GMAIL_USER;
        const mailOptions = {
            from: `"FashionHub" <${fromEmail}>`,
            to: email,
            subject: 'إعادة تعيين كلمة المرور - Password Reset',
            html: `
        <!DOCTYPE html>
        <html dir="ltr" lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">FashionHub</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">إعادة تعيين كلمة المرور / Password Reset</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              ${userName ? `مرحباً ${userName},` : 'مرحباً,'}<br>
              ${userName ? `Hello ${userName},` : 'Hello,'}
            </p>
            
            <p style="color: #4b5563; font-size: 16px;">
              لقد طلبت إعادة تعيين كلمة المرور لحسابك.<br>
              You have requested to reset your password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); 
                        color: white; padding: 15px 40px; text-decoration: none; 
                        border-radius: 8px; font-weight: bold; font-size: 16px;">
                إعادة تعيين كلمة المرور / Reset Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              أو انسخ الرابط التالي إلى المتصفح:<br>
              Or copy this link to your browser:
            </p>
            <p style="color: #3b82f6; font-size: 12px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 5px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                <strong>⚠️ تحذير / Warning:</strong><br>
                هذا الرابط صالح لمدة 10 دقائق فقط.<br>
                This link is valid for 10 minutes only.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.<br>
              If you did not request a password reset, you can safely ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              FashionHub - Premium Fashion Store<br>
              © ${new Date().getFullYear()} All rights reserved
            </p>
          </div>
        </body>
        </html>
      `,
            text: `
        إعادة تعيين كلمة المرور - Password Reset
        
        ${userName ? `مرحباً ${userName},` : 'مرحباً,'}
        ${userName ? `Hello ${userName},` : 'Hello,'}
        
        لقد طلبت إعادة تعيين كلمة المرور لحسابك.
        You have requested to reset your password.
        
        اضغط على الرابط التالي لإعادة تعيين كلمة المرور:
        Click the following link to reset your password:
        
        ${resetUrl}
        
        ⚠️ هذا الرابط صالح لمدة 10 دقائق فقط.
        This link is valid for 10 minutes only.
        
        إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.
        If you did not request a password reset, you can safely ignore this email.
        
        FashionHub - Premium Fashion Store
        © ${new Date().getFullYear()} All rights reserved
      `,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent:', info.messageId);
        return true;
    }
    catch (error) {
        console.error('❌ Error sending password reset email:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode,
        });
        return false;
    }
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendWelcomeEmail = async (email, userName) => {
    try {
        const transporter = createTransporter();
        if (!transporter) {
            return false;
        }
        const fromEmail = process.env.SMTP_FROM || process.env.GMAIL_USER;
        const supportEmail = process.env.SUPPORT_EMAIL || fromEmail;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const logoUrl = `${frontendUrl}/logo.png`;
        const brandGradient = 'linear-gradient(135deg, #1f2a44 0%, #f97316 100%)';
        const mailOptions = {
            from: `"FashionHub" <${fromEmail}>`,
            to: email,
            subject: 'Welcome to FashionHub - Account Created',
            html: `
        <!DOCTYPE html>
        <html dir="ltr" lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${brandGradient}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <img src="${logoUrl}" alt="FashionHub" width="180" style="display: block; margin: 0 auto 10px; width: 180px; max-width: 100%; height: auto;" />
            <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 0.3px;">FashionHub</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Welcome to FashionHub!</h2>
            <p style="color: #4b5563; font-size: 16px;">
              Hello ${userName},
            </p>
            <p style="color: #4b5563; font-size: 16px;">
              Your account was created successfully. You can now sign in and start exploring our latest collections.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}"
                 style="display: inline-block; background: ${brandGradient};
                        color: white; padding: 12px 32px; text-decoration: none;
                        border-radius: 8px; font-weight: bold; font-size: 15px;">
                Visit FashionHub
              </a>
            </div>
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 5px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                If you did not create this account, please contact support${supportEmail ? ` at ${supportEmail}` : ''}.
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Thanks for choosing FashionHub. We are here to keep your account safe and secure.
            </p>
          </div>
        </body>
        </html>
      `,
            text: `
Welcome to FashionHub!

Hello ${userName},

Your account was created successfully. You can now sign in and start exploring our latest collections.

Visit: ${frontendUrl}

If you did not create this account, please contact support${supportEmail ? ` at ${supportEmail}` : ''}.

Thanks for choosing FashionHub.
      `.trim(),
        };
        await transporter.sendMail(mailOptions);
        return true;
    }
    catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
};
exports.sendWelcomeEmail = sendWelcomeEmail;
