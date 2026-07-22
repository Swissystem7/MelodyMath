const referralCodes = new Map();
const userCodes = new Map();

function generateReferralCode(userId) {
  if (typeof userId !== 'string' || userId.trim() === '') {
    throw new TypeError('userId must be a non-empty string');
  }
  if (userCodes.has(userId)) {
    return userCodes.get(userId);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code;
  let attempts = 0;
  do {
    if (attempts >= 3) {
      throw new TypeError('Failed to generate unique code after 3 retries');
    }
    const bytes = require('crypto').randomBytes(8);
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[bytes[i] % chars.length];
    }
    attempts++;
  } while (referralCodes.has(code));
  referralCodes.set(code, userId);
  userCodes.set(userId, code);
  return code;
}

function validateReferralCode(code) {
  if (typeof code !== 'string') {
    throw new TypeError('code must be a string');
  }
  if (code.length !== 8) {
    return { valid: false, referrerId: null };
  }
  const referrerId = referralCodes.get(code) || null;
  return referrerId ? { valid: true, referrerId } : { valid: false, referrerId: null };
}

module.exports = { generateReferralCode, validateReferralCode };
