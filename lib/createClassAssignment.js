function createClassAssignment(teacherId, assignmentConfig) {
  const { randomBytes } = require('crypto');
  const store = global.__assignmentStore || (global.__assignmentStore = { classCodes: new Map(), assignments: new Map() });
  const { classCodes, assignments } = store;
  if (!teacherId || typeof teacherId !== 'string' || teacherId.trim() === '') {
    throw new Error('teacherId required');
  }
  if (!assignmentConfig || typeof assignmentConfig !== 'object') throw new Error('exercises must have at least one item');
  const { exercises, dueDate, maxAttempts } = assignmentConfig;
  if (!Array.isArray(exercises) || exercises.length === 0) {
    throw new Error('exercises must have at least one item');
  }
  const parsedDue = new Date(dueDate);
  if (isNaN(parsedDue.getTime()) || parsedDue <= new Date()) {
    throw new Error('dueDate must be a future date');
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error('maxAttempts must be positive integer');
  }
  let classCode;
  do { classCode = randomBytes(5).toString('base64url').slice(0, 6); } while (classCodes.has(classCode));
  classCodes.set(classCode, true);
  let assignmentId;
  do { assignmentId = randomBytes(4).toString('hex'); } while (assignments.has(assignmentId));
  assignments.set(assignmentId, { teacherId, assignmentConfig, classCode });
  return { classCode, assignmentId };
}
module.exports = { createClassAssignment };
