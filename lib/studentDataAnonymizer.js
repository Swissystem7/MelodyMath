const crypto = require('crypto');
function studentDataAnonymizer(records, salt) {
  if (!Array.isArray(records)) throw new Error('records must be an array');
  if (typeof salt !== 'string') throw new Error('salt must be a string');
  return records.map(record => {
    if (typeof record.name !== 'string' || typeof record.email !== 'string') {
      throw new Error('Missing name or email field');
    }
    const hashName = crypto.createHash('sha256').update(record.name + salt).digest('hex');
    const hashEmail = crypto.createHash('sha256').update(record.email + salt).digest('hex');
    return { ...record, name: hashName, email: hashEmail };
  });
}
module.exports = { studentDataAnonymizer };
