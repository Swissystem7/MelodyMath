function generateSSOToken(schoolCode, studentId, teacherSecret) {
  if (typeof schoolCode !== 'string' || !/^[A-Za-z0-9]+$/.test(schoolCode) || typeof studentId !== 'string' || !/^[A-Za-z0-9]+$/.test(studentId)) {
    throw new Error('Invalid input parameters');
  }
  if (!/^[0-9a-fA-F]{32}$/.test(teacherSecret)) {
    throw new Error('Invalid teacher secret format');
  }
  const crypto = require('crypto');
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 86400;
  const payload = { schoolCode, studentId, exp };
  const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const headerEncoded = base64url(header);
  const payloadEncoded = base64url(payload);
  const signature = crypto.createHmac('sha256', teacherSecret).update(headerEncoded + '.' + payloadEncoded).digest('base64url');
  const token = headerEncoded + '.' + payloadEncoded + '.' + signature;
  const expiresAt = new Date(exp * 1000);
  return { token, expiresAt };
}
module.exports = { generateSSOToken };
