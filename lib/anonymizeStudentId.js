function anonymizeStudentId(studentId, salt) {
  if (typeof studentId !== 'string' || !/^[a-z0-9]+$/i.test(studentId)) {
    throw new TypeError('studentId must be a non-empty string');
  }
  if (typeof salt !== 'string' || salt.length < 8) {
    throw new TypeError('salt must be a string with at least 8 characters');
  }
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(salt + studentId).digest('hex');
}
module.exports = { anonymizeStudentId };
