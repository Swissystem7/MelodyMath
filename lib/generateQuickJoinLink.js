function generateQuickJoinLink(teacherId, classInfo) {
  const { randomBytes } = require('crypto');
  if (typeof teacherId !== 'string' || teacherId.trim() === '') {
    throw new Error('teacherId must be a non-empty string');
  }
  if (!classInfo || typeof classInfo !== 'object' || !Number.isFinite(classInfo.expiryHours) || classInfo.expiryHours <= 0) {
    throw new Error('expiryHours must be positive');
  }
  const grade = (classInfo.grade >= 1 && classInfo.grade <= 12) ? classInfo.grade : 5;
  const expiryHours = classInfo.expiryHours > 168 ? 168 : classInfo.expiryHours;
  const classCode = randomBytes(5).toString('base64url').slice(0, 6);
  const joinUrl = 'https://quickjoin.example.com/join/' + classCode;
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
  return { joinUrl, classCode, expiresAt };
}

module.exports = { generateQuickJoinLink };
