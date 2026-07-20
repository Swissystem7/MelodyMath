function generateClassConfig(csvString) {
  if (csvString.trim() === '') {
    return { classId: '', students: [] };
  }
  const lines = csvString.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) {
    return { classId: '', students: [] };
  }
  const header = lines[0].trim().toLowerCase().split(',');
  const nameIndex = header.indexOf('name');
  const experienceIndex = header.indexOf('experience');
  if (nameIndex === -1 || experienceIndex === -1) {
    return { error: 'Invalid CSV format' };
  }
  const classId = Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const students = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const name = cols[nameIndex] ? cols[nameIndex].trim() : '';
    const experience = cols[experienceIndex] ? cols[experienceIndex].trim().toLowerCase() : '';
    if (name === '') continue;
    let moduleId, difficulty;
    if (experience === 'none') {
      moduleId = 'interval-to-ratio';
      difficulty = 'easy';
    } else if (experience === 'some') {
      moduleId = 'rhythm-fractions';
      difficulty = 'medium';
    } else if (experience === 'advanced') {
      moduleId = 'melody-from-equation';
      difficulty = 'hard';
    } else {
      continue;
    }
    students.push({ name, moduleId, difficulty });
  }
  return { classId, students };
}
module.exports = { generateClassConfig };