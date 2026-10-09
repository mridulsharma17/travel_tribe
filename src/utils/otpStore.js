/**
 * In-memory OTP storage engine.
 * Designed with a clean interface so it can be swapped out later with Redis or Firebase.
 */
class MemoryOtpStore {
  constructor() {
    this.store = new Map();
  }

  /**
   * Save or overwrite an OTP code for an email.
   * @param {string} email - Recipient's email address.
   * @param {string} otp - The generated OTP code.
   * @param {Date} expiresAt - Expiration timestamp.
   */
  save(email, otp, expiresAt) {
    const key = email.toLowerCase().trim();
    this.store.set(key, {
      otp,
      expiresAt,
      attempts: 0
    });
  }

  /**
   * Retrieve the OTP record for an email.
   * @param {string} email - Recipient's email address.
   * @returns {Object|null} The OTP record or null.
   */
  get(email) {
    const key = email.toLowerCase().trim();
    return this.store.get(key) || null;
  }

  /**
   * Delete the OTP record for an email (e.g. after success or absolute expiry).
   * @param {string} email - Recipient's email address.
   * @returns {boolean} True if successfully deleted.
   */
  delete(email) {
    const key = email.toLowerCase().trim();
    return this.store.delete(key);
  }

  /**
   * Increment the failed attempt counter for a specific email.
   * @param {string} email - Recipient's email address.
   * @returns {number} The updated attempt count, or -1 if the email record doesn't exist.
   */
  incrementAttempts(email) {
    const key = email.toLowerCase().trim();
    const data = this.store.get(key);
    if (!data) {
      return -1;
    }
    data.attempts += 1;
    this.store.set(key, data);
    return data.attempts;
  }
}

export const otpStore = new MemoryOtpStore();
export default MemoryOtpStore;
