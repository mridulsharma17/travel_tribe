import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'Saathi <onboarding@resend.dev>';

let resendInstance = null;

if (resendApiKey && resendApiKey.trim() !== '') {
  resendInstance = new Resend(resendApiKey);
} else {
  console.warn('[WARNING] RESEND_API_KEY is not defined in the environment variables.');
  console.warn('[WARNING] OTP emails will be logged directly to the console instead of being sent.');
}

/**
 * Sends a premium verification email using Resend.
 * Falls back to console logging in development mode if the API key is missing.
 * 
 * @param {string} email - Recipient's email address.
 * @param {string} otp - The 6-digit verification code.
 * @param {number} expiryMinutes - Duration the OTP remains valid.
 * @returns {Promise<{success: boolean, mode: string, data?: any}>} The result of the dispatch operation.
 */
export async function sendOtpEmail(email, otp, expiryMinutes = 5) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Saathi Verification Code</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .wrapper {
          background-color: #f8fafc;
          padding: 40px 20px;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #f1f5f9;
        }
        .header {
          text-align: center;
          padding: 32px 24px 20px 24px;
        }
        .logo-text {
          font-size: 32px;
          font-weight: 800;
          color: #4f46e5;
          letter-spacing: -0.5px;
          margin: 0;
        }
        .content {
          padding: 0 32px 32px 32px;
          color: #334155;
          line-height: 1.6;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 12px;
          color: #0f172a;
        }
        .message-text {
          font-size: 15px;
          margin-bottom: 24px;
          color: #475569;
        }
        .otp-container {
          background-color: #f1f5f9;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin: 28px 0;
          border: 1px dashed #cbd5e1;
        }
        .otp-code {
          font-size: 38px;
          font-weight: 700;
          letter-spacing: 8px;
          color: #4f46e5;
          margin: 0;
          font-family: 'Courier New', Courier, monospace;
        }
        .expiry-warning {
          font-size: 13px;
          color: #64748b;
          margin-top: 8px;
          margin-bottom: 0;
        }
        .footer {
          padding: 24px 32px;
          background-color: #f8fafc;
          border-top: 1px solid #f1f5f9;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }
        .footer p {
          margin: 4px 0;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1 class="logo-text">Saathi</h1>
          </div>
          <div class="content">
            <p class="greeting">Verify your email address</p>
            <p class="message-text">Thank you for choosing Saathi. Use the single-use verification code below to complete your registration or login process.</p>
            <div class="otp-container">
              <h2 class="otp-code">${otp}</h2>
              <p class="expiry-warning">This code is valid for <strong>${expiryMinutes} minutes</strong> and can only be used once.</p>
            </div>
            <p class="message-text" style="font-size: 13px; color: #64748b;">If you didn't request this code, you can safely ignore this email. Someone may have typed your email address by mistake.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Saathi.</p>
            <p>&copy; ${new Date().getFullYear()} Saathi. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!resendInstance) {
    console.log(`[DEVELOPMENT MODE] Email requested for ${email}`);
    console.log(`[DEVELOPMENT MODE] --- EMAIL BEGIN ---`);
    console.log(`[DEVELOPMENT MODE] To: ${email}`);
    console.log(`[DEVELOPMENT MODE] Subject: Your Saathi Verification Code`);
    console.log(`[DEVELOPMENT MODE] OTP Code: ${otp}`);
    console.log(`[DEVELOPMENT MODE] --- EMAIL END ---`);
    console.log(`Email sent (Mock/Console Log)`);
    return { success: true, mode: 'development', otp };
  }

  console.log(`Email requested: sending real email via Resend to ${email}`);

  try {
    const response = await resendInstance.emails.send({
      from: emailFrom,
      to: [email],
      subject: 'Your Saathi Verification Code',
      html: html,
    });

    if (response.error) {
      console.error(`[Resend API Error] Failed to send email to ${email}:`, response.error);
      throw new Error(response.error.message || 'Error occurred while sending email via Resend');
    }

    console.log(`Email sent successfully to ${email}. ID: ${response.data.id}`);
    return { success: true, mode: 'production', data: response.data };
  } catch (error) {
    console.error(`[Resend Service Error] Failed to send email to ${email}:`, error);
    throw error;
  }
}
