import { generateOtp } from '../utils/otpGenerator.js';
import { otpStore } from '../utils/otpStore.js';
import { sendOtpEmail } from '../services/emailService.js';

// Standard regex for basic email format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Controller to handle OTP generation and dispatch.
 * 
 * POST /api/send-otp
 */
export async function sendOtp(req, res, next) {
  try {
    const { email } = req.body;

    // 1. Inputs validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const trimmedEmail = email.trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format'
      });
    }

    console.log(`[OTP Controller] Email requested: ${trimmedEmail}`);

    // 2. Generate cryptographically secure OTP
    const otp = generateOtp();

    // 3. Log OTP (Only in non-production/development environments)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP DEVELOPMENT ONLY] Generated OTP for ${trimmedEmail}: ${otp}`);
    }

    // 4. Expiration calculations
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // 5. Save to store (automatically overwrites any existing OTP record for this email)
    otpStore.save(trimmedEmail, otp, expiresAt);

    // 6. Send the code via Brevo (or mock console log in dev)
    await sendOtpEmail(trimmedEmail, otp, expiryMinutes);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Controller to verify OTP validity.
 * 
 * POST /api/verify-otp
 */
export function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    // 1. Basic validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const trimmedEmail = email.trim();
    const trimmedOtp = otp.trim();

    // 2. Check store existence
    const record = otpStore.get(trimmedEmail);
    if (!record) {
      console.log(`[OTP Controller] Verification failure: No record found for ${trimmedEmail}`);
      return res.status(400).json({
        success: false,
        message: 'No OTP requested for this email or it has expired'
      });
    }

    // 3. Expiration verification
    if (new Date() > new Date(record.expiresAt)) {
      console.log(`[OTP Controller] Verification failure: OTP expired for ${trimmedEmail}`);
      otpStore.delete(trimmedEmail); // Cleanup expired OTP
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // 4. Limit validation (max 5 attempts)
    if (record.attempts >= 5) {
      console.log(`[OTP Controller] Verification failure: Max attempts (5) reached for ${trimmedEmail}`);
      otpStore.delete(trimmedEmail); // Lockout and destroy the record
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      });
    }

    // 5. Code comparison
    if (record.otp !== trimmedOtp) {
      // Increment attempt counter
      const currentAttempts = otpStore.incrementAttempts(trimmedEmail);
      console.log(`[OTP Controller] Verification failure: Incorrect OTP for ${trimmedEmail}. Attempt ${currentAttempts}/5`);

      if (currentAttempts >= 5) {
        otpStore.delete(trimmedEmail); // Exceeded limits, clean up
        return res.status(400).json({
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.'
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. You have ${5 - currentAttempts} attempts remaining.`
      });
    }

    // 6. Success path
    otpStore.delete(trimmedEmail); // Invalidate OTP immediately on success
    console.log(`[OTP Controller] Verification success: Correct OTP provided for ${trimmedEmail}`);

    return res.status(200).json({
      success: true
    });
  } catch (error) {
    return next(error);
  }
}
