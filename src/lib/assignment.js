// MelodyMath — teacher-assigned practice tasks on a student's local roster row.
//
// Assignments are a list on each student in teacherStore — not cloud homework.
// They record what the teacher asked for on this tablet; completion is local too.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalizeAssignment(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const title = String(src.title == null ? (src.label == null ? '' : src.label) : src.title)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
    const skill = String(src.skill == null ? '' : src.skill).replace(/\s+/g, ' ').trim().slice(0, 48);
    const pack = String(src.pack == null ? '' : src.pack).replace(/\s+/g, ' ').trim().slice(0, 24);
    if (!title) return null;
    const completed = !!src.completed;
    const assignedAt = Number.isFinite(Number(src.assignedAt)) ? Number(src.assignedAt) : Date.now();
    const completedAt = completed && Number.isFinite(Number(src.completedAt)) ? Number(src.completedAt) : null;
    const id = src.id
      ? String(src.id).slice(0, 40)
      : ('a' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36));
    return {
      id: id,
      title: title,
      skill: skill,
      pack: pack,
      assignedAt: assignedAt,
      completed: completed,
      completedAt: completedAt,
    };
  }

  function createAssignment(spec) {
    return normalizeAssignment(spec);
  }

  function assignmentsForStudent(student) {
    if (!student || !Array.isArray(student.assignments)) return [];
    return student.assignments.slice();
  }

  return {
    normalizeAssignment,
    createAssignment,
    assignmentsForStudent,
  };
});
