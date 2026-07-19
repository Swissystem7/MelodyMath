function verifyLessonPlanIntegrity(lessonData, signature, publicKey) {
  if (typeof lessonData !== 'string' || lessonData.trim() === '' ||
      typeof signature !== 'string' || signature.trim() === '' ||
      typeof publicKey !== 'string' || publicKey.trim() === '') {
    throw new TypeError();
  }
  try {
    const crypto = require('crypto');
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(lessonData);
    return verifier.verify(publicKey, signature, 'base64');
  } catch (e) {
    return false;
  }
}
module.exports = { verifyLessonPlanIntegrity };
