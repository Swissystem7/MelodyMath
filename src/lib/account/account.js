// MelodyMath — local roles and child picture PINs (MM-717, stream A).
//
// The local half of sign-in. Everything stays on this device (localStorage):
// no server, no account, no password, no key. The server half is a separate
// decision (docs/MM-700/work-plan.md §4).
//
// Contract for other streams (stream D codes against it):
//   window.MMAccount.current()  -> { id, name, role, classCode } or null
//       role is 'student' | 'teacher' | 'parent'. null until someone on this
//       device picked a role. A student's name and class code come from the
//       who-bar (mm-who-v1, the same record teacherStore.js writes); a student
//       with no name yet is { id: 'student:guest', name: '', ... }.
//   window.MMAccount.onChange(fn) -> unsubscribe()
//       fn(current) runs after the role or the student changes, also when
//       another tab on this device changes them (storage event).
//
// Picture PIN: a teacher can give a student 4 pictures. Switching the device
// to that student then asks for them. It keeps one child from opening another
// child's row by accident or for fun. It is NOT security: anyone with the
// device's browser tools can read or clear localStorage, and the stored value
// is a short non-cryptographic hash, never the pictures themselves.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MMAccount = api.createAccount(root.localStorage, root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const ROLE_KEY = 'mm-account-v1';
  const WHO_KEY = 'mm-who-v1';
  const PIN_KEY = 'mm-account-pin-v1';
  const ROLES = ['student', 'teacher', 'parent'];
  const ROLE_HE = { student: 'תלמיד/ה', teacher: 'מורה', parent: 'הורה' };
  // Twelve pictures a 6-year-old can name. Order is part of the stored hash.
  const PICTURES = ['🐶', '🐱', '🦊', '🐸', '🐵', '🐼', '🦁', '🐢', '🌻', '🍎', '⭐', '🚀'];
  const PIN_LENGTH = 4;

  function read(ls, key) {
    try { const raw = ls && ls.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function write(ls, key, value) {
    try { if (ls) ls.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function clean(s) { return String(s == null ? '' : s).trim().slice(0, 40); }

  // FNV-1a, 32 bit. Enough to avoid keeping the pictures in clear text.
  function hashPin(classCode, name, pictures) {
    const text = 'mm717|' + clean(classCode) + '|' + clean(name) + '|' + pictures.join(',');
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function validPin(pictures) {
    return Array.isArray(pictures) && pictures.length === PIN_LENGTH && pictures.every((p) => PICTURES.indexOf(p) >= 0);
  }
  function pinSlot(classCode, name) { return clean(classCode) + '\u0001' + clean(name); }

  function createAccount(ls, win) {
    const listeners = [];
    let lastKey = null;

    function role() {
      const r = read(ls, ROLE_KEY);
      return r && ROLES.indexOf(r.role) >= 0 ? r.role : null;
    }
    function who() {
      const w = read(ls, WHO_KEY) || {};
      return { classCode: clean(w.classCode), name: clean(w.name) };
    }
    function current() {
      const r = role();
      if (!r) return null;
      const w = who();
      if (r === 'student') {
        return { id: w.name ? 'student:' + w.classCode + ':' + w.name : 'student:guest', name: w.name, role: r, classCode: w.classCode };
      }
      if (r === 'parent') {
        return { id: 'parent:' + w.classCode + ':' + w.name, name: ROLE_HE.parent, role: r, classCode: w.classCode };
      }
      return { id: 'teacher:' + w.classCode, name: ROLE_HE.teacher, role: r, classCode: w.classCode };
    }
    function keyOf(c) { return c ? c.id + '|' + c.role + '|' + c.classCode + '|' + c.name : ''; }
    function notify() {
      const c = current();
      const k = keyOf(c);
      if (k === lastKey) return c;
      lastKey = k;
      listeners.slice().forEach((fn) => { try { fn(c); } catch (e) { /* one bad listener must not stop the others */ } });
      return c;
    }
    function onChange(fn) {
      if (typeof fn !== 'function') return function () {};
      listeners.push(fn);
      return function () { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
    }
    function setRole(r) {
      if (ROLES.indexOf(r) < 0) return false;
      if (!write(ls, ROLE_KEY, { v: 1, role: r })) return false;
      notify();
      return true;
    }
    function clearRole() {
      try { if (ls) ls.removeItem(ROLE_KEY); } catch (e) { /* ignore */ }
      notify();
    }

    function pins() { return read(ls, PIN_KEY) || {}; }
    function hasPin(classCode, name) { return !!pins()[pinSlot(classCode, name)]; }
    function setPin(classCode, name, pictures) {
      if (!clean(name) || !validPin(pictures)) return false;
      const all = pins();
      all[pinSlot(classCode, name)] = hashPin(classCode, name, pictures);
      return write(ls, PIN_KEY, all);
    }
    function clearPin(classCode, name) {
      const all = pins();
      delete all[pinSlot(classCode, name)];
      return write(ls, PIN_KEY, all);
    }
    function checkPin(classCode, name, pictures) {
      const stored = pins()[pinSlot(classCode, name)];
      if (!stored) return true;
      return validPin(pictures) && stored === hashPin(classCode, name, pictures);
    }
    // May this device switch from the current student to (classCode, name)
    // without asking for the target's pictures? A teacher who passed the
    // adult gate (role 'teacher') may; so may staying on the same student.
    function needsPin(classCode, name) {
      if (!hasPin(classCode, name)) return false;
      if (role() === 'teacher') return false;
      const w = who();
      return !(w.classCode === clean(classCode) && w.name === clean(name));
    }

    if (win && typeof win.addEventListener === 'function') {
      win.addEventListener('storage', function (e) {
        if (!e || e.key === null || e.key === ROLE_KEY || e.key === WHO_KEY) notify();
      });
    }
    lastKey = keyOf(current());

    return {
      current: current,
      onChange: onChange,
      setRole: setRole,
      clearRole: clearRole,
      notify: notify,
      hasPin: hasPin,
      setPin: setPin,
      clearPin: clearPin,
      checkPin: checkPin,
      needsPin: needsPin,
      ROLES: ROLES.slice(),
      ROLE_HE: Object.assign({}, ROLE_HE),
      PICTURES: PICTURES.slice(),
      PIN_LENGTH: PIN_LENGTH,
    };
  }

  return { createAccount: createAccount, hashPin: hashPin, ROLE_KEY: ROLE_KEY, WHO_KEY: WHO_KEY, PIN_KEY: PIN_KEY };
});
