import crypto from 'crypto';

/**
 * Generates a secure, 6-digit numeric OTP as a string.
 * Uses Node's built-in cryptographically strong pseudo-random number generator.
 * @returns {string} The 6-digit OTP string.
 */
export function generateOtp() {
  const otpVal = crypto.randomInt(100000, 1000000);
  return otpVal.toString();
}
