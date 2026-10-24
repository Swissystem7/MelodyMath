// MelodyMath — EnsembleStudio (Refs #623, Refs #591).
// Percussion leads. A string, wind or keyboard plays the same ratio at the
// same tempo. The ensemble question is the LCM of two cycles. Every source
// URL is already stored on that instrument in src/lib/instruments.js.
//
// #691 review item 5: the common multiple of two cycles is polyrhythm (M4),
// weak evidence (banks.MUSIC_DOSAGE.optionalOnly). Until a strong source
// exists the studio is extra practice, marked like the EXTRA/WEAK ways of the
// grade files ({ optional: true, evidence: 'weak' }), never a main screen.
// After the sounded question comes a last stage with no sound: the same
// common multiple in symbols only. Only that stage counts for mastery.
const NAMES = {
  darbuka: 'דרבוקה',
  djembe: 'ג׳מבה',
  tabla: 'טאבלה',
  cajon: 'קחון',
  taiko: 'טאיקו',
  marimba: 'מרימבה',
  guitar: 'גיטרה',
  oud: 'עוּד',
  recorder: 'חלילית',
  piano: 'פסנתר',
};

const PERCUSSION = ['darbuka', 'djembe', 'tabla', 'cajon', 'taiko', 'marimba'];

// Dose of the studio (#591 dosage rules): optional extra practice, weak evidence.
export const DOSE = Object.freeze({ mechanism: 'M4', optional: true, evidence: 'weak', role: 'extra', mainScreen: false });
// The child sees only "extra practice"; the evidence grade stays in
// data-evidence for teacher views (owner note 24.10 16:19).
export const EXTRA_TAG_HE = 'תרגול נוסף';
export const STAGES = ['music', 'silent', 'done'];
// Place in the progression map: the common multiple is standard LCM of grade
// ה׳, tagged by curriculum.sectionForItem with row mm-cur-40 (ראשוניים
// ופריקים; פירוק לגורמים; סימני התחלקות), which progression.js links as
// 'factors and common multiples'.
export const TOPIC = Object.freeze({ id: 'mm-cur-40', grade: 'ה', standard: 'LCM' });
const DOSE_ATTRS = ' data-dose="extra" data-evidence="weak" data-topic="' + TOPIC.id + '" data-grade="' + TOPIC.grade + '"';
const TAP = 'min-width:44px;min-height:44px';

// cycleA/cycleB are the exercise lengths. targetLcm is lcm(cycleA, cycleB).
export const ENSEMBLE_PRESETS = [
  {
    id: 'half-bar',
    titleHe: 'חצי מיתר וחצי תיבה',
    topicId: 'fractions',
    bpm: 90,
    ratioLabel: '1/2',
    fraction: [1, 2],
    instruments: ['darbuka', 'guitar', 'recorder'],
    cycleA: 2,
    cycleB: 3,
    targetLcm: 6,
    source: 'https://liutaiomottola.com/formulae/fret.htm',
  },
  {
    id: 'djembe-12',
    titleHe: 'ארבע קבוצות של שלוש',
    topicId: 'multiplication',
    bpm: 96,
    ratioLabel: '3/12',
    fraction: [3, 12],
    instruments: ['djembe', 'oud', 'piano'],
    cycleA: 3,
    cycleB: 4,
    targetLcm: 12,
    source: 'https://mtosmt.org/issues/mto.10.16.4/mto.10.16.4.polak.html',
  },
  {
    id: 'tabla-quarter',
    titleHe: 'רבע משותף: טאבלה וחלילית',
    topicId: 'division',
    bpm: 80,
    ratioLabel: '4/16',
    fraction: [4, 16],
    instruments: ['tabla', 'marimba', 'recorder'],
    cycleA: 4,
    cycleB: 16,
    targetLcm: 16,
    source: 'https://compmusic.upf.edu/hi/examples-taal-hindustani',
  },
  {
    id: 'cajon-beat',
    titleHe: 'מכה לכל פעימה',
    topicId: 'counting',
    bpm: 100,
    ratioLabel: '1/1',
    fraction: [1, 1],
    instruments: ['cajon', 'taiko', 'guitar'],
    cycleA: 4,
    cycleB: 6,
    targetLcm: 12,
    source: 'https://calperformances.org/learn/program_notes/2007/pn_peru_negro.pdf',
  },
];

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bdi(value) {
  return '<bdi dir="ltr">' + escapeHtml(value) + '</bdi>';
}

function nameOf(id) {
  return NAMES[id] || id;
}

function tempo(preset) {
  return bdi(preset.ratioLabel) + ' בקצב ' + bdi(preset.bpm) + ' פעימות לדקה';
}

function factHe(preset) {
  if (preset.id === 'half-bar') {
    return 'הדרבוקה ממלאה את התיבה במכה ארוכה ובמכה קצרה. הגיטרה בסריג ה־12 היא חצי מיתר, והחלילית מנגנת חצי. אותו יחס ' + tempo(preset) + '.';
  }
  if (preset.id === 'djembe-12') {
    return 'הג׳מבה חוזרת על מחזור של 12 פעימות: 4 קבוצות של 3. העוד והפסנתר מנגנים בתרגיל הזה את אותו יחס ' + tempo(preset) + '.';
  }
  if (preset.id === 'tabla-quarter') {
    return 'בטאבלה לכל מחזור 16 מטרות ב־4 קבוצות, וקבוצה אחת היא ' + bdi(preset.ratioLabel) + '. החלילית מנגנת רבע, ' + bdi('1/4') + ', אותו יחס אחרי צמצום. המרימבה מצטרפת אליהן בתרגיל, בקצב ' + bdi(preset.bpm) + ' פעימות לדקה.';
  }
  return 'הקחון מלווה את הגיטרה: מכה אחת לכל פעימה, יחס ' + bdi(preset.ratioLabel) + '. הטאיקו סופר מכה אחת לכל פעימה, באותו קצב ' + bdi(preset.bpm) + '.';
}

function choices(preset) {
  const raw = [preset.targetLcm, preset.cycleA + preset.cycleB, preset.cycleA * preset.cycleB, Math.max(preset.cycleA, preset.cycleB)];
  const out = [];
  raw.forEach(function (n) {
    if (out.indexOf(n) < 0) out.push(n);
  });
  out.sort(function (a, b) { return a - b; });
  return out;
}

function button(attrs, label) {
  return '<button type="button" class="jam-pad" ' + attrs + ' style="' + TAP + '">' + label + '</button>';
}

export function formatCrossInstrumentCard(preset, status) {
  const p = preset || ENSEMBLE_PRESETS[0];
  const frac = p.fraction[0] + '/' + p.fraction[1];
  const perc = p.instruments.filter(function (id) { return PERCUSSION.indexOf(id) >= 0; });
  const rest = p.instruments.filter(function (id) { return PERCUSSION.indexOf(id) < 0; });
  const taps = p.instruments.map(function (id) {
    return button('data-instrument="' + escapeHtml(id) + '"', escapeHtml(nameOf(id)));
  }).join('');
  const answers = choices(p).map(function (n) {
    return button('data-ensemble-answer="' + n + '"', bdi(n));
  }).join('');
  return '<article dir="rtl" lang="he" data-preset="' + escapeHtml(p.id) + '" data-stage="music"' + DOSE_ATTRS + '>'
    + '<span class="tag">' + EXTRA_TAG_HE + '</span>'
    + '<h2>' + escapeHtml(p.titleHe) + '</h2>'
    + '<p>' + factHe(p) + ' השבר המשותף הוא ' + bdi(frac) + '.</p>'
    + '<p>הקשה: ' + escapeHtml(perc.map(nameOf).join(', ')) + '. יחד עם: ' + escapeHtml(rest.map(nameOf).join(', ')) + '.</p>'
    + '<div class="jam-row">' + taps + '</div>'
    + '<h3>שילוב כלים: כפולה משותפת</h3>'
    + '<p>מחזור ' + bdi(p.cycleA) + ' ומחזור ' + bdi(p.cycleB) + '. מהי ' + bdi('lcm(' + p.cycleA + ', ' + p.cycleB + ')') + '?</p>'
    + '<div class="jam-row">' + answers + '</div>'
    + '<p data-ensemble-result role="status">' + (status ? escapeHtml(status) : '') + '</p>'
    + '<p><a href="' + escapeHtml(p.source) + '">מקור</a></p>'
    + '</article>';
}

// The last stage: the same common multiple with no instrument, no sound and
// no story, symbols only. Solving it is what counts as mastery.
// After an error the ensemble is replayed once and this hint is shown: where
// each cycle lands, the common landing marked. Numbers only, no instrument.
export function silentHintHtml(preset) {
  const p = preset || ENSEMBLE_PRESETS[0];
  function lands(c) {
    const out = [];
    for (let n = c; n <= p.targetLcm; n += c) out.push(n === p.targetLcm ? '<mark>' + bdi(n) + '</mark>' : bdi(n));
    return 'מחזור של ' + bdi(c) + ' נוחת על ' + out.join(', ') + '.';
  }
  return '<p class="hint" data-hint>רמז: הקשבנו שוב. ' + lands(p.cycleA) + ' ' + lands(p.cycleB) + ' איפה הם נפגשים לראשונה?</p>';
}

export function formatSilentStage(preset, status, hint) {
  const p = preset || ENSEMBLE_PRESETS[0];
  const answers = choices(p).map(function (n) {
    return button('data-ensemble-answer="' + n + '"', bdi(n));
  }).join('');
  return '<article dir="rtl" lang="he" data-preset="' + escapeHtml(p.id) + '" data-stage="silent"' + DOSE_ATTRS + '>'
    + '<span class="tag">' + EXTRA_TAG_HE + '</span>'
    + '<h3>שלב אחרון: בלי צלילים</h3>'
    + '<p>' + bdi('lcm(' + p.cycleA + ', ' + p.cycleB + ') = ?') + '</p>'
    + (hint ? silentHintHtml(p) : '')
    + '<div class="jam-row">' + answers + '</div>'
    + '<p data-ensemble-result role="status">' + (status ? escapeHtml(status) : '') + '</p>'
    + '</article>';
}

function hit(event) {
  const t = event && event.target;
  if (!t) return null;
  if (typeof t.closest === 'function') {
    const el = t.closest('[data-instrument], [data-ensemble-answer]');
    if (el) return el;
  }
  return typeof t.getAttribute === 'function' ? t : null;
}

function playNote(id, onPlay) {
  if (typeof onPlay === 'function') {
    onPlay(id);
    return;
  }
  if (typeof globalThis.playInstrumentNote === 'function') {
    globalThis.playInstrumentNote(id);
    return;
  }
  import('../lib/instrumentVoices.js').then(function (mod) {
    const api = mod && (mod.default || mod);
    const fn = (mod && mod.playInstrumentNote) || (api && api.playInstrumentNote);
    if (typeof fn === 'function') fn(id);
  }).catch(function () {});
}

export function mountEnsembleStudio(container, options = {}) {
  const opts = options || {};
  const preset = opts.preset || ENSEMBLE_PRESETS[opts.index || 0] || ENSEMBLE_PRESETS[0];
  const view = { preset: preset, lastOk: null, played: [], stage: 'music', mastered: false, dose: DOSE, replays: 0, hint: false };
  let status = '';

  function render() {
    container.innerHTML = view.stage === 'music' ? formatCrossInstrumentCard(preset, status) : formatSilentStage(preset, status, view.hint);
  }

  // An error in the silent stage (like the plain check of #681): replay the
  // ensemble once, show where the cycles meet, then the child retries.
  function replayWithHint() {
    view.replays += 1;
    view.hint = true;
    preset.instruments.forEach(function (id) { playNote(id, opts.onPlay); });
  }

  function onClick(event) {
    const el = hit(event);
    if (!el || typeof el.getAttribute !== 'function') return;
    const inst = el.getAttribute('data-instrument');
    if (inst) {
      if (view.stage !== 'music') return; // no sound in the last stage
      view.played.push(inst);
      playNote(inst, opts.onPlay);
      return;
    }
    const ans = el.getAttribute('data-ensemble-answer');
    if (ans == null || ans === '') return;
    if (view.stage === 'done') return;
    view.lastOk = Number(ans) === preset.targetLcm;
    if (!view.lastOk && view.stage === 'silent') { replayWithHint(); status = 'עוד לא. הקשיבו שוב ונסו שוב.'; }
    else if (!view.lastOk) status = 'עוד לא. נסו שוב.';
    else if (view.stage === 'music') { view.stage = 'silent'; status = 'נכון. עכשיו אותה שאלה בלי צלילים.'; }
    else { view.stage = 'done'; view.mastered = true; status = 'נכון. פתרתם גם בלי צלילים.'; }
    render();
  }

  view.onClick = onClick;
  render();
  if (typeof container.addEventListener === 'function') container.addEventListener('click', onClick);
  return view;
}
