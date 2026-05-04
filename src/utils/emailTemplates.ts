export const emailTemplates = {
  verification: (url: string, name: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 28px; font-weight: 800; color: #2563eb; text-decoration: none; letter-spacing: -1px; }
        .content { background: #ffffff; border-radius: 16px; padding: 40px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .title { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 20px; }
        .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 30px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="#" class="logo">Skill Bridge</a>
        </div>
        <div class="content">
          <h1 class="title">Verify your email address</h1>
          <p>Hi ${name || "there"},</p>
          <p>Welcome to Skill Bridge! We're excited to have you on board. To get started, please verify your email address by clicking the button below.</p>
          <div style="text-align: center;">
            <a href="${url}" class="button">Verify Email Address</a>
          </div>
          <p>This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
          <p>Cheers,<br>The Skill Bridge Team</p>
        </div>
        <div class="footer">
          &copy; 2026 Skill Bridge. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `,

  passwordReset: (url: string, name: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 28px; font-weight: 800; color: #2563eb; text-decoration: none; letter-spacing: -1px; }
        .content { background: #ffffff; border-radius: 16px; padding: 40px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .title { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 20px; }
        .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 30px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="#" class="logo">Skill Bridge</a>
        </div>
        <div class="content">
          <h1 class="title">Reset your password</h1>
          <p>Hi ${name || "there"},</p>
          <p>We received a request to reset the password for your Skill Bridge account. Click the button below to choose a new password.</p>
          <div style="text-align: center;">
            <a href="${url}" class="button">Reset Password</a>
          </div>
          <p>If you didn't request this, you can ignore this email. Your password won't change until you access the link above and create a new one.</p>
          <p>Cheers,<br>The Skill Bridge Team</p>
        </div>
        <div class="footer">
          &copy; 2026 Skill Bridge. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `,

  passwordResetSuccess: (name: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 28px; font-weight: 800; color: #2563eb; text-decoration: none; letter-spacing: -1px; }
        .content { background: #ffffff; border-radius: 16px; padding: 40px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .title { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="#" class="logo">Skill Bridge</a>
        </div>
        <div class="content">
          <h1 class="title">Password Reset Successful</h1>
          <p>Hi ${name || "there"},</p>
          <p>This is a confirmation that your password has been successfully changed.</p>
          <p>If you did not perform this action, please contact our support team immediately.</p>
          <p>Cheers,<br>The Skill Bridge Team</p>
        </div>
        <div class="footer">
          &copy; 2026 Skill Bridge. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `,
};
