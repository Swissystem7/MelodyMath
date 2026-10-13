// MelodyMath — teacher-assigned practice tasks on a student's local roster row.
//
// Assignments are a list on each student in teacherStore — not cloud homework.
// They record what the teacher asked for on this tablet; completion is local too.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // A timestamp off another tablet's JSON file is a number, or a numeric
  // string from a hand edit. `Number(null)`, `Number('')`, `Number([])` are 0
  // and `Number(true)` is 1, so a missing or odd value used to land on
  // 1.1.1970 instead of being treated as absent.
  function timeOrNull(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  // Only a string or number can be an id. An object or array would stringify
  // to [object Object] and every such row would dedupe into one on import.
  function idOrNull(v) {
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    if (typeof v === 'string' && v.trim() !== '') return v.trim().slice(0, 40);
    return null;
  }

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
    const assignedRaw = timeOrNull(src.assignedAt);
    const assignedAt = assignedRaw == null ? Date.now() : assignedRaw;
    const completedAt = completed ? timeOrNull(src.completedAt) : null;
    const id = idOrNull(src.id)
      || ('a' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36));
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
