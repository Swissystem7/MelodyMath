// MelodyMath — Child-Facing Screen Text Helpers (Refs #677, Refs #665).
// Protects child screens from technical codes (M1-M6, BPM, Hz, Latin notes, evidence).
// Teacher info is always placed inside <details class="teacher-info"> behind "למורה ▸".
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MelodyMathChildText = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SOLFEGE = {
    C: 'דו',
    D: 'רה',
    E: 'מי',
    F: 'פה',
    G: 'סול',
    A: 'לה',
    B: 'סי'
  };

  function noteToHebrew(latinNote) {
    if (!latinNote) return '';
    const clean = String(latinNote).trim().toUpperCase();
    return SOLFEGE[clean] || latinNote;
  }

  function tempoToHebrew(bpm) {
    const n = Number(bpm) || 90;
    if (n < 75) return 'איטי 🐢';
    if (n > 110) return 'מהיר 🐇';
    return 'מתון 🎵';
  }

  function renderTeacherInfo(contentHtml) {
    if (!contentHtml) return '';
    return '<details class="teacher-info" role="region" aria-label="מידע למורה" style="margin-top:8px">' +
      '<summary style="cursor:pointer;color:var(--muted, #64748b);font-size:0.85rem;user-select:none">למורה ▸</summary>' +
      '<div class="teacher-body" style="padding:6px 0;font-size:0.85rem;color:var(--muted, #64748b)">' +
      contentHtml +
      '</div></details>';
  }

  function stripTeacherSections(html) {
    if (!html) return '';
    return String(html).replace(/<details\b[^>]*\bclass="[^"]*teacher-info[^"]*"[^>]*>[\s\S]*?<\/details>/gi, '');
  }

  return {
    SOLFEGE: SOLFEGE,
    noteToHebrew: noteToHebrew,
    tempoToHebrew: tempoToHebrew,
    renderTeacherInfo: renderTeacherInfo,
    stripTeacherSections: stripTeacherSections
  };
});
