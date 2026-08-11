const crypto = require('crypto');
function anonymizeStudentData(studentData, options) {
  if (!options || typeof options.salt !== 'string' || options.salt.length === 0) {
    throw new Error('Salt is required');
  }
  const salt = options.salt;
  const hashAlgorithm = options.hashAlgorithm || 'sha256';
  if (!['sha256', 'sha1', 'md5'].includes(hashAlgorithm)) throw new Error('Unsupported hash algorithm');
  if (typeof studentData !== 'object' || studentData === null || Array.isArray(studentData)) throw new TypeError('studentData must be an object');
  const keys = Object.keys(studentData).filter(k => ['name', 'email', 'studentId', 'phone'].includes(k)).sort();
  const fieldsMasked = [];
  const parts = [];
  for (const key of keys) {
    const val = studentData[key];
    parts.push(val == null ? '' : String(val));
    fieldsMasked.push(key);
  }
  const concatenated = parts.join('');
  const hash = crypto.createHash(hashAlgorithm).update(salt + concatenated).digest('hex');
  return { anonymizedId: hash, fieldsMasked: fieldsMasked };
}
module.exports = { anonymizeStudentData };
