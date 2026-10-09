import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const brevoApiKey = process.env.BREVO_API_KEY?.trim();
const brevoUser = (process.env.BREVO_USER || process.env.EMAIL_USER)?.trim();
const brevoPass = (process.env.BREVO_PASS || process.env.BREVO_SMTP_KEY || process.env.EMAIL_PASS)?.trim();
const brevoHost = process.env.BREVO_HOST?.trim() || 'smtp-relay.brevo.com';
const brevoPort = parseInt(process.env.BREVO_PORT || '587', 10);
const emailFrom = process.env.EMAIL_FROM || 'Saathi <mridulsharma1712006@gmail.com>';

/**
 * Parses sender identity from string like "Saathi <mridulsharma1712006@gmail.com>" or "mridulsharma1712006@gmail.com".
 * 
 * @param {string} fromStr 
 * @returns {{ name: string, email: string }}
 */
function parseSender(fromStr) {
  if (!fromStr) return { name: 'Saathi', email: 'mridulsharma1712006@gmail.com' };
  const match = fromStr.match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/);
  if (match) {
    return { name: match[1]?.trim() || 'Saathi', email: match[2].trim() };
  }
  if (fromStr.includes('@')) {
    return { name: 'Saathi', email: fromStr.trim() };
  }
  return { name: 'Saathi', email: 'mridulsharma1712006@gmail.com' };
}

let transporter = null;

if (brevoUser && brevoPass) {
  transporter = nodemailer.createTransport({
    host: brevoHost,
    port: brevoPort,
    secure: brevoPort === 465,
    auth: {
      user: brevoUser,
      pass: brevoPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false
    }
  });
}

if (!brevoApiKey && !transporter) {
  console.warn('[WARNING] Neither BREVO_API_KEY nor Brevo SMTP credentials (BREVO_USER/BREVO_PASS) are defined in environment variables.');
  console.warn('[WARNING] OTP emails will be logged directly to the console in development mode.');
}

/**
 * Sends a verification email using Brevo (REST API or SMTP Relay).
 * Falls back to console logging in development mode if Brevo credentials are missing.
 * 
 * @param {string} email - Recipient's email address.
 * @param {string} otp - The 6-digit verification code.
 * @param {number} expiryMinutes - Duration the OTP remains valid.
 * @returns {Promise<{success: boolean, mode: string, messageId?: string, otp?: string}>} The result of the send operation.
 */
export async function sendOtpEmail(email, otp, expiryMinutes = 5) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Travel Tribe Verification Code</title>
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
            <h1 class="logo-text">Travel Tribe</h1>
          </div>
          <div class="content">
            <p class="greeting">Verify your email address</p>
            <p class="message-text">Thank you for choosing Travel Tribe. Use the single-use verification code below to complete your registration or login process.</p>
            <div class="otp-container">
              <h2 class="otp-code">${otp}</h2>
              <p class="expiry-warning">This code is valid for <strong>${expiryMinutes} minutes</strong> and can only be used once.</p>
            </div>
            <p class="message-text" style="font-size: 13px; color: #64748b;">If you didn't request this code, you can safely ignore this email. Someone may have typed your email address by mistake.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Travel Tribe.</p>
            <p>&copy; ${new Date().getFullYear()} Travel Tribe. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const senderInfo = parseSender(emailFrom);
  const fromHeader = `${senderInfo.name} <${senderInfo.email}>`;

  // Option 1: Send via Brevo REST API (if BREVO_API_KEY is provided)
  if (brevoApiKey) {
    console.log(`Email requested: sending email via Brevo REST API to ${email}`);
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: senderInfo.name,
            email: senderInfo.email,
          },
          to: [
            { email: email }
          ],
          subject: 'Your Saathi Verification Code',
          htmlContent: html,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Brevo API error (${response.status}): ${JSON.stringify(responseData)}`);
      }

      console.log(`========== BREVO REST API RESPONSE ==========`);
      console.log(JSON.stringify(responseData, null, 2));
      console.log(`============================================`);
      console.log(`Email sent successfully via Brevo API to ${email}. Message ID: ${responseData.messageId}`);
      return { success: true, mode: 'brevo-api', messageId: responseData.messageId };
    } catch (error) {
      console.error("========== BREVO REST API ERROR ==========");
      console.error(error.message);
      if (!transporter) throw error;
      console.warn("Falling back to Brevo SMTP Transporter...");
    }
  }

  // Option 2: Send via Brevo SMTP Transporter (if BREVO_USER/EMAIL_USER and BREVO_PASS/EMAIL_PASS are provided)
  if (transporter) {
    console.log(`Email requested: sending email via Brevo SMTP (${brevoHost}) to ${email}`);
    try {
      const info = await transporter.sendMail({
        from: fromHeader,
        to: email,
        subject: 'Your Travel Tribe Verification Code',
        html: html,
      });

      console.log(`========== BREVO SMTP TRANSPORTER RESPONSE ==========`);
      console.log(JSON.stringify(info, null, 2));
      console.log(`====================================================`);
      console.log(`Email sent successfully via Brevo SMTP to ${email}. Message ID: ${info.messageId}`);
      return { success: true, mode: 'brevo-smtp', messageId: info.messageId };
    } catch (error) {
      console.error("========== BREVO SMTP ERROR ==========");
      console.error(error);
      throw error;
    }
  }

  // Option 3: Development Mode Fallback (Console output)
  console.log(`[DEVELOPMENT MODE] Email requested for ${email}`);
  console.log(`[DEVELOPMENT MODE] --- EMAIL BEGIN ---`);
  console.log(`[DEVELOPMENT MODE] To: ${email}`);
  console.log(`[DEVELOPMENT MODE] Subject: Your Saathi Verification Code`);
  console.log(`[DEVELOPMENT MODE] OTP Code: ${otp}`);
  console.log(`[DEVELOPMENT MODE] --- EMAIL END ---`);
  console.log(`Email sent (Mock/Console Log)`);
  return { success: true, mode: 'development', otp };
}

export default sendOtpEmail;

