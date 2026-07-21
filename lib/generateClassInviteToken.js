const crypto = require('crypto');

function generateClassInviteToken(teacherId, classId, expirationMinutes) {
  if (!teacherId || typeof teacherId !== 'string' || !/^[a-zA-Z0-9]+$/.test(teacherId)) {
    throw new Error('Invalid teacherId: must be a non-empty alphanumeric string');
  }
  if (!classId || typeof classId !== 'string' || !/^[a-zA-Z0-9]+$/.test(classId)) {
    throw new Error('Invalid classId: must be a non-empty alphanumeric string');
  }
  if (!Number.isInteger(expirationMinutes) || expirationMinutes <= 0 || expirationMinutes > 1440) {
    throw new Error('Invalid expirationMinutes: must be a positive integer between 1 and 1440');
  }

  const secret = process.env.CLASS_INVITE_SECRET;
  if (!secret) {
    throw new Error('Server secret not set: CLASS_INVITE_SECRET environment variable is required');
  }

  const tokenBytes = crypto.randomBytes(32);
  const token = tokenBytes.toString('base64url');
  const expiresAt = new Date(Date.now() + expirationMinutes * 60000).toISOString();
  const dataToSign = token + expiresAt + classId;
  const signature = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');

  return { token, expiresAt, signature };
}

module.exports = { generateClassInviteToken };