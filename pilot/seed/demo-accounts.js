// MelodyMath MM-600 pilot demo — the two demo accounts.
//
// DEMO ONLY. THIS IS NOT REAL SECURITY.
// The sign-in on pilot/index.html is a client-side check against this file,
// which anyone can read in the browser. It exists so a teacher and a student
// can walk through the pilot flows on one device. Nothing here protects data:
// there is no server, no session token and no real account behind it.
//
// The values below are made-up test values for this demo only. They are not a
// real password, email or key of anyone, and must never be reused anywhere.
// This file (and the PR description of MM-600) is the only place that names them.
(function (root, factory) {
  const seed = factory();
  if (typeof module === 'object' && module.exports) module.exports = seed;
  else root.MM_PILOT_SEED = seed;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return Object.freeze({
    note: 'Client-side demo login. Not real security.',
    accounts: Object.freeze([
      Object.freeze({
        id: 'pilot-teacher-1',
        role: 'teacher',
        username: 'demo-teacher',
        password: 'demo-pilot-1234',
        displayName: 'מורה לדוגמה'
      }),
      Object.freeze({
        id: 'pilot-student-1',
        role: 'student',
        username: 'demo-student',
        password: 'demo-pilot-1234',
        displayName: 'תלמיד/ה לדוגמה',
        grade: 'ב׳'
      })
    ])
  });
});
