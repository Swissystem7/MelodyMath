// MelodyMath — EnsembleStudio (Refs #623, Refs #591).
// Percussion leads. A string, wind or keyboard plays the same ratio at the
// same tempo. The ensemble question is the LCM of two cycles. Every source
// URL is already stored on that instrument in src/lib/instruments.js.
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

// The app's one instrument choice (#679, src/lib/myInstrument.js, loaded as a
// classic script); this screen keeps no instrument state of its own.
function my() {
  return globalThis.MM_MY_INSTRUMENT || null;
}

export function formatCrossInstrumentCard(preset, status, mine) {
  const p = preset || ENSEMBLE_PRESETS[0];
  const frac = p.fraction[0] + '/' + p.fraction[1];
  const perc = p.instruments.filter(function (id) { return PERCUSSION.indexOf(id) >= 0; });
  const rest = p.instruments.filter(function (id) { return PERCUSSION.indexOf(id) < 0; });
  const taps = p.instruments.map(function (id) {
    return button('data-instrument="' + escapeHtml(id) + '" aria-pressed="' + (id === mine) + '"', escapeHtml(nameOf(id)));
  }).join('');
  const answers = choices(p).map(function (n) {
    return button('data-ensemble-answer="' + n + '"', bdi(n));
  }).join('');
  return '<article dir="rtl" lang="he" data-preset="' + escapeHtml(p.id) + '">'
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
  const view = { preset: preset, lastOk: null };
  let status = '';

  function render() {
    const m = my();
    container.innerHTML = formatCrossInstrumentCard(preset, status, m ? m.getMyInstrument(opts.storage) : null);
  }

  function onClick(event) {
    const el = hit(event);
    if (!el || typeof el.getAttribute !== 'function') return;
    const inst = el.getAttribute('data-instrument');
    if (inst) {
      // A tap picks the instrument for the whole app; the store's event redraws.
      const m = my();
      if (m) m.setMyInstrument(inst, opts.storage);
      playNote(inst, opts.onPlay);
      return;
    }
    const ans = el.getAttribute('data-ensemble-answer');
    if (ans == null || ans === '') return;
    view.lastOk = Number(ans) === preset.targetLcm;
    status = view.lastOk ? 'נכון.' : 'עוד לא. נסו שוב.';
    render();
  }

  view.onClick = onClick;
  render();
  if (typeof container.addEventListener === 'function') container.addEventListener('click', onClick);
  const m = my();
  if (m && typeof globalThis.addEventListener === 'function') globalThis.addEventListener(m.EVENT, render);
  return view;
}
