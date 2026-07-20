const progressSnapshots = new Map();
let snapshotSequence = 0;

function generateProgressSnapshot(studentId, referrerId) {
  const progressDB = {
    students: {
      'student1': { completedExercises: [{ intervals: ['3:2', '4:3', '5:4'] }, { intervals: ['2:1', '3:2'] }, { intervals: ['4:3', '5:4', '6:5'] }] },
      'student2': { completedExercises: [] }
    },
    users: {
      'teacher1': { name: 'Teacher One' },
      'parent1': { name: 'Parent One' }
    }
  };
  const base62Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function toBase62(num) {
    if (num === 0) return '0';
    let result = '';
    while (num > 0) {
      result = base62Chars[num % 62] + result;
      num = Math.floor(num / 62);
    }
    return result;
  }
  function getIntervalRatio(interval) {
    const parts = interval.split(':');
    return parseInt(parts[0]) / parseInt(parts[1]);
  }
  function generateMelody(intervals) {
    const baseFreq = 261.63;
    const melody = [baseFreq];
    let currentFreq = baseFreq;
    for (const interval of intervals) {
      const ratio = getIntervalRatio(interval);
      currentFreq *= ratio;
      melody.push(currentFreq);
    }
    return melody;
  }
  const student = progressDB.students[studentId];
  if (!student) throw new Error('Student not found');
  const referrer = progressDB.users[referrerId];
  if (!referrer) throw new Error('Referrer not found');
  const existingSnapshotKey = [...progressSnapshots.keys()].find(key => {
    const snap = progressSnapshots.get(key);
    return snap.studentId === studentId && new Date(snap.expiresAt) > new Date();
  });
  if (existingSnapshotKey) {
    const snap = progressSnapshots.get(existingSnapshotKey);
    return { url: `https://app.com/snapshot/${existingSnapshotKey}`, expiresAt: snap.expiresAt, snapshotId: existingSnapshotKey };
  }
  let melody;
  if (student.completedExercises.length === 0) {
    melody = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
  } else {
    const last3 = student.completedExercises.slice(-3);
    const allIntervals = last3.flatMap(ex => ex.intervals);
    melody = generateMelody(allIntervals);
  }
  const snapshotId = toBase62(Date.now() * 1000 + (snapshotSequence++ % 1000));
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  progressSnapshots.set(snapshotId, { studentId, referrerId, melody, expiresAt });
  return { url: `https://app.com/snapshot/${snapshotId}`, expiresAt, snapshotId };
}
module.exports = { generateProgressSnapshot };
