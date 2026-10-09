import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sendOtp, verifyOtp } from '../controllers/otpController.js';

const router = Router();

// Rate limiter for requesting OTPs: max 5 requests per 10 minutes per IP
const sendOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP. Please try again after 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for verification attempts: max 20 requests per 10 minutes per IP
const verifyOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: {
    success: false,
    message: 'Too many verification attempts from this IP. Please try again after 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Route bindings
router.post('/send-otp', sendOtpLimiter, sendOtp);
router.post('/verify-otp', verifyOtpLimiter, verifyOtp);

export default router;
