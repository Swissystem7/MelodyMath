// MelodyMath — world instruments, each matched to the maths it fits and why
// (#591, owner goal B, 23.10).
//
// Dosage rules (owner 15:54): an instrument is a timbre or optional play,
// never a new method. Every entry uses the one primary mechanism of its
// topics (M1 steady beat, M2 grouped beats, M3 note durations, M6 patterns,
// see banks.MUSIC_MECHANISMS). A weak mechanism (M4 polyrhythm, M5 pitch,
// M7 movement) only appears as optional:true with evidence:'weak'.
//
// `source` backs the fact about the instrument that `why` uses (a museum
// record, an ethnomusicology article, a primary text); the evidence that the
// mechanism helps children learn maths lives with the mechanism in banks.js.
// Every source URL was opened and checked on 23.10.2026. Where no source was
// confirmed, source is exactly 'TODO' and `why` stays modest.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FAMILIES = ['percussion', 'strings', 'winds', 'keys'];
  const PRIMARY = ['M1', 'M2', 'M3', 'M6'];
  const WEAK = ['M4', 'M5', 'M7'];

  // Each topic has one way (dosage rule 4).
  const TOPICS = {
    counting: { he: 'מנייה', mechanism: 'M1' },
    nextPrev: { he: 'עוקב וקודם', mechanism: 'M1' },
    skipCounting: { he: 'ספירה בדילוגים', mechanism: 'M2' },
    multiplication: { he: 'כפל', mechanism: 'M2' },
    division: { he: 'חילוק', mechanism: 'M2' },
    fractions: { he: 'שברים', mechanism: 'M3' },
    decimals: { he: 'שברים עשרוניים', mechanism: 'M3' },
    patterns: { he: 'דגמים וסדרות', mechanism: 'M6' },
    symmetry: { he: 'סימטריה', mechanism: 'M6' },
    lcm: { he: 'כפולה משותפת', mechanism: 'M4' },
    numberLine: { he: 'ישר המספרים וסדר', mechanism: 'M5' },
    data: { he: 'נתונים', mechanism: 'M1' },
    percent: { he: 'אחוזים', mechanism: 'M3' },
  };

  // e(id, he, en, origin, family, mechanism, mathTopics, voice, why, source)
  function e(id, he, en, origin, family, mechanism, mathTopics, voice, why, source) {
    const x = { id, instrument: { he, en }, origin, family, mathTopics, mechanism, why, source, voice };
    if (WEAK.indexOf(mechanism) >= 0) { x.optional = true; x.evidence = 'weak'; }
    return x;
  }

  const INSTRUMENTS = [
    // ---------- percussion ----------
    e('darbuka', 'דרבוקה', 'Darbuka (goblet drum)', 'Middle East and North Africa', 'percussion', 'M3', ['fractions', 'decimals', 'percent'], 'drumLow',
      'Two basic strokes, a low dum in the centre of the head and a high tek on the rim; long and short strokes filling one bar voice note lengths as fractions (M3).',
      'https://eefc.org/wp-content/uploads/Doumbek-strokes-1.pdf'),
    e('djembe', 'ג׳מבה', 'Djembe (jembe)', 'Mande, West Africa (Mali, Guinea)', 'percussion', 'M2', ['multiplication', 'skipCounting'], 'drumHigh',
      'Jembe pieces run in a 4-beat/12-pulse cycle or a 4-beat/16-pulse cycle (Polak 2010, Music Theory Online): 4 groups of 3 or 4 groups of 4 pulses (M2).',
      'https://mtosmt.org/issues/mto.10.16.4/mto.10.16.4.polak.html'),
    e('tabla', 'טאבלה', 'Tabla', 'North India (Hindustani music)', 'percussion', 'M2', ['skipCounting', 'multiplication', 'division'], 'drumHigh',
      'Each cycle of tintal has 16 matras divided into 4 vibhags, recited as bols (dha dhin dhin dha): 16 = 4 groups of 4, an accented group for skip counting (M2).',
      'https://compmusic.upf.edu/hi/examples-taal-hindustani'),
    e('mridangam', 'מרידנגם', 'Mridangam', 'South India (Carnatic music)', 'percussion', 'M2', ['division', 'multiplication'], 'drumLow',
      'A cycle of adi tala has 32 aksharas and divides into 8 equal beats, so each beat holds 4 aksharas: 32 ÷ 8 = 4 as grouped beats (M2).',
      'https://compmusic.upf.edu/examples-taala-carnatic'),
    e('taiko', 'טאיקו', 'Taiko', 'Japan', 'percussion', 'M1', ['counting'], 'drumLow',
      'Players learn a piece by singing its rhythm first: "don" is one strong strike on the head and "ka" a strike on the rim, one syllable per strike to count (M1).',
      'https://www.janm.org/sites/default/files/2021-04/big-drum-family-guide.pdf'),
    e('cajon', 'קחון', 'Cajón (box drum)', 'Afro-Peruvian, Peru', 'percussion', 'M1', ['counting', 'nextPrev', 'data'], 'woodClick',
      'The box drum that, with guitar, accompanies the festejo and most Afro-Peruvian genres; a simple voice for a steady beat to count on (M1).',
      'https://calperformances.org/learn/program_notes/2007/pn_peru_negro.pdf'),
    e('bodhran', 'בודהראן', 'Bodhrán', 'Ireland', 'percussion', 'M2', ['multiplication', 'division'], 'frameDrum',
      'An Irish frame drum played with a tipper; its two main rhythms are 4/4 reels and 6/8 jigs, a bar of 6 eighths felt as 2 groups of 3 (M2).',
      'https://horniman.ac.uk/object/HC.1999.1626'),
    e('riq', 'רִיק', 'Riq', 'Arab world', 'percussion', 'M2', ['multiplication'], 'jingle',
      'An Arab tambourine with ten pairs of jingles set equally around the frame in two rows (Stottlemyer 2014): 10 × 2 = 20 jingles, 5 pairs per row (M2).',
      'https://digitalcommons.liberty.edu/masters/326'),
    e('tof', 'תֹּף', 'Tof (frame drum)', 'Ancient Israel and the Near East', 'percussion', 'M1', ['counting', 'nextPrev'], 'frameDrum',
      'The frame drum (tof) was extremely popular in ancient Israel and most of the Ancient Near East; one stroke per steady beat for counting one-to-one (M1).',
      'https://bibleinterp.arizona.edu/node/3432'),
    e('conga', 'קונגה', 'Conga (tumbadora)', 'Cuba (of Congolese descent)', 'percussion', 'M6', ['patterns'], 'drumHigh',
      'A hand drum of Congolese descent that developed in Cuba, played around the clave concept (Pertout 2008): repeating drum patterns locked to a fixed rhythmic key (M6).',
      'https://hdl.handle.net/1885/116903'),
    e('surdo', 'סורדו', 'Surdo', 'Brazil (samba)', 'percussion', 'M1', ['counting'], 'drumLow',
      'The large two-headed bass drum of the samba bateria; its deep steady strokes are the beat the child counts on (M1).',
      'https://clas.arizona.edu/sites/default/files/Brazil_Music_Danca%2C%20Movement%20and%20Music%20of%20Brazil.pdf'),
    e('gamelan', 'גמלן', 'Gamelan (kotekan)', 'Bali, Indonesia', 'percussion', 'M6', ['patterns'], 'gong',
      'In Balinese kotekan two interlocking parts, polos and sangsih, sound as one figure (Peterman 2010): two simple patterns that fit into one (M6). Gong cycles for LCM: no source yet.',
      'https://doi.org/10.31091/mudra.v25i3.1560'),
    e('mbira', 'מְבִּירָה', 'Mbira dzavadzimu', 'Shona, Zimbabwe', 'percussion', 'M2', ['multiplication', 'skipCounting'], 'tine',
      'Two players interlock kushaura and kutsinhira; four twelve-pulse phrases repeat as a cycle of 48 pulses (Peterman 2010): 4 × 12 = 48 (M2).',
      'https://doi.org/10.31091/mudra.v25i3.1560'),
    e('kalimba', 'קלימבה', 'Kalimba', 'Africa (lamellophone)', 'percussion', 'M6', ['patterns'], 'tine',
      'A thumb piano with metal tines; short repeating tunes on it are a timbre for melodic patterns (M6). No verified source yet.',
      'TODO'),
    e('marimba', 'מרימבה', 'Marimba', 'Central America (Guatemala, Chiapas), from Africa', 'percussion', 'M6', ['patterns', 'symmetry'], 'woodBar',
      'Brought to Central America by African slaves and adopted by Maya musicians; wooden bars with gourd resonators, a warm timbre for melodic and mirror patterns (M6).',
      'https://mim.org/new-acquisitions-and-exhibit-showcase-the-versatile-marimba/'),
    e('balafon', 'בלפון', 'Balafon (bala)', 'Malinke, West Africa', 'percussion', 'M6', ['patterns'], 'woodBar',
      'A struck wooden-bar xylophone with gourd resonators (Met collection record); a timbre for repeating melodic patterns (M6).',
      'https://www.metmuseum.org/art/collection/search/501109'),
    e('steelPan', 'תוף פלדה', 'Steel pan', 'Trinidad and Tobago', 'percussion', 'M6', ['patterns'], 'steelPan',
      'Made from sections of oil drums, each surface grooved and beaten into panels that sound different notes; tapping panels in order plays melodic patterns (M6).',
      'https://www.horniman.ac.uk/object/MT38-1995/json'),
    e('handbells', 'פעמוני יד', 'Handbells (change ringing)', 'England', 'percussion', 'M1', ['counting', 'nextPrev'], 'metalBell',
      'In rounds the bells strike in order down the scale, one ringer per bell, so each bell is one count; methods then change the order by permutations (CCCBR) (M1).',
      'https://mail.history.cccbr.org.uk/pdf/Chapter_4_Art_of_Change_Ringing_updated.pdf'),
    e('claves', 'קלאבס', 'Claves (son clave)', 'Cuba', 'percussion', 'M6', ['patterns'], 'woodClick',
      'The two-bar son clave [x..x..x...x.x...] begins with the tresillo, 3 onsets spread as evenly as possible over 8 pulses (Toussaint 2005, Bridges): a rhythmic pattern (M6).',
      'https://archive.bridgesmathart.org/2005/bridges2005-47.html'),
    e('gankogui', 'גנקוגוי', 'Gankogui bell', 'Ewe, Ghana', 'percussion', 'M6', ['patterns'], 'metalBell',
      'All parts of the Ewe ensemble are conceived in relation to the gankogui bell pattern, which works as a time-line (Pressing 1983): one repeating pattern everyone follows (M6).',
      'https://doi.org/10.21504/amj.v6i3.1165'),
    e('xylophone', 'קסילופון', 'Xylophone', 'Europe (orchestral)', 'percussion', 'M5', ['numberLine'], 'woodBar',
      'Each bar is tuned by its length, and a shorter bar sounds higher. Optional play only: bars in order as a line from low to high (M5, weak evidence).',
      'https://old.physics.wfu.edu/demolabs/demos/3/3d/3D4010.html'),
    e('udu', 'אודו', 'Udu', 'Igbo, Nigeria', 'percussion', 'M1', ['counting'], 'drumLow',
      'A clay vessel drum with an open hole on the top and side, struck by the hand, a gentle voice for counting beats (M1).',
      'https://www.horniman.ac.uk/object/HC.2018.126.1/json/'),
    // ---------- strings ----------
    e('oud', 'עוּד', 'Oud', 'Arab world, Middle East', 'strings', 'M6', ['patterns'], 'pluck',
      'A short-necked lute with no frets and 5 pairs of strings plus a single bass string, suited to the Arabic maqamat: its phrases voice melodic patterns (M6).',
      'https://www.maqamworld.com/en/instr/oud.php'),
    e('sitar', 'סיטאר', 'Sitar', 'North India (Hindustani music)', 'strings', 'M6', ['patterns'], 'pluck',
      'A long-necked lute with movable frets and sympathetic strings, played with tabla in a chosen taal: its repeating raag phrases voice melodic patterns (M6).',
      'https://www.swarganga.org/instruments/3/Sitar'),
    e('kora', 'קוֹרָה', 'Kora', 'Mande, West Africa (Senegal, The Gambia)', 'strings', 'M6', ['patterns'], 'pluck',
      'A 21-string harp whose kumbengo is a recurrent accompaniment theme (Racanelli 2012, Analytical Approaches to World Music): a repeating pattern to continue (M6).',
      'https://oldaawmjournal.iftawm.org/articles/2012a/Racanelli_AAWM_Vol_2_1.pdf'),
    e('koto', 'קוֹטוֹ', 'Koto', 'Japan (from China, 8th century)', 'strings', 'M5', ['numberLine'], 'pluck',
      'A long zither, most often with 13 bridges; where each bridge stands sets the pitch of its string. Optional play only: sliding a bridge to order low and high (M5, weak evidence).',
      'https://collections.ed.ac.uk/mimed/record/18373'),
    e('guzheng', 'גוּצֶ׳נג', 'Guzheng', 'China', 'strings', 'M6', ['patterns'], 'pluck',
      'A zither with a movable bridge per string, tuned to a five-note (anhemitonic pentatonic) scale, so the same five notes repeat in every octave: a pattern of five (M6).',
      'https://collections.ed.ac.uk/mimed/record/14698'),
    e('erhu', 'אֶרְהוּ', 'Erhu', 'China', 'strings', 'M3', ['fractions', 'decimals'], 'bowed',
      'A two-string bowed spike fiddle; a bowed note lasts exactly as long as the bow keeps moving, which makes it a clear voice for held note lengths in a bar (M3).',
      'https://www.horniman.ac.uk/object/1975.40/json'),
    e('guitar', 'גיטרה', 'Guitar', 'Spain, Europe', 'strings', 'M5', ['numberLine'], 'pluck',
      'Each fret raises the note one equal step and the 12th fret, at half the string, is the octave. Optional play only: frets in order as a line from low to high (M5, weak evidence).',
      'https://liutaiomottola.com/formulae/fret.htm'),
    e('violin', 'כינור', 'Violin', 'Italy, Europe', 'strings', 'M6', ['patterns'], 'bowed',
      'Its four strings are tuned a fifth apart (G, D, A, E), the same step each time: a growing pattern a child can hear and continue (M6).',
      'https://hyperphysics.gsu.edu/hbase/Music/violin.html'),
    e('charango', 'צָ׳רַנְגּוֹ', 'Charango', 'Andes (Bolivia, Argentina)', 'strings', 'M2', ['multiplication', 'skipCounting'], 'pluck',
      'A small Andean lute with 10 strings in 5 double courses: 5 groups of 2, so counting its strings in pairs is a times-table group (M2).',
      'https://www.horniman.ac.uk/object/M23-1987/json'),
    e('balalaika', 'בָּלָלַייקָה', 'Balalaika', 'Russia', 'strings', 'M1', ['counting'], 'pluck',
      'A Russian lute with a triangular body and three strings; one strum on each steady beat is a simple timbre for counting one-to-one (M1).',
      'https://collections.ed.ac.uk/mimed/record/112439'),
    e('qanun', 'קָאנוּן', 'Qanun', 'Arab world, Middle East', 'strings', 'M2', ['multiplication', 'division'], 'pluck',
      'A trapezoid zither with 81 strings stretched in groups of three, plus levers for microtones: 27 groups of 3 is a ready-made multiplication and division picture (M2).',
      'https://www.maqamworld.com/en/instr/qanun.php'),
    e('ukulele', 'יוּקָלֶלֶה', 'Ukulele', 'Hawaii (from the Portuguese machete)', 'strings', 'M3', ['fractions'], 'pluck',
      'A small four-string guitar adopted in Hawaii in the 1880s from the machete; strumming quarters and eighths in one bar voices note lengths (M3).',
      'https://collections.vam.ac.uk/item/O372416/machete-unknown'),
    // ---------- winds ----------
    e('panFlute', 'חליל פאן', 'Pan flute (siku)', 'Andes (Aymara, Bolivia)', 'winds', 'M5', ['numberLine'], 'breathy',
      'A row of pipes graduated by length, each sounding a single note; lining them up from long to short orders low to high. Optional play only (M5, weak evidence); pipe-length ratios have no evidenced way yet.',
      'https://www.horniman.ac.uk/object/M24-1990'),
    e('shofar', 'שופר', 'Shofar', 'Jewish tradition (ram\'s horn)', 'winds', 'M3', ['fractions'], 'horn',
      'Mishnah Rosh Hashanah 4:9: a tekiah lasts as long as three teruot, and a teruah as long as three short whimpers, so each blast is one third of the longer one: note lengths as fractions (M3).',
      'https://www.sefaria.org/Mishnah_Rosh_Hashanah.4.9'),
    e('didgeridoo', 'דיגרידו', 'Didgeridoo (yiraki)', 'Aboriginal Australia', 'winds', 'M1', ['counting'], 'drone',
      'Played with circular breathing, its rhythmic breathing cycle makes a pulsating drone: a steady pulse to count along with, one count per pulse (M1).',
      'https://newt.phys.unsw.edu.au/jw/dij/dij.html'),
    e('shakuhachi', 'שאקוהאצ׳י', 'Shakuhachi', 'Japan', 'winds', 'M6', ['patterns'], 'breathy',
      'An end-blown bamboo flute with 4 finger holes and 1 thumb hole; its few fingerings suit short call-and-echo melodic patterns (M6).',
      'https://collections.penn.museum/collections/object/240595'),
    e('ney', 'נאי', 'Ney', 'Iran', 'winds', 'M3', ['fractions', 'decimals'], 'breathy',
      'An open end-blown reed flute with finger holes; its long breathy notes are a gentle voice for held note lengths in a bar (M3).',
      'https://horniman.ac.uk/object/M24.8.56/159'),
    e('recorder', 'חלילית', 'Recorder', 'Europe (Nuremberg)', 'winds', 'M3', ['fractions', 'decimals'], 'breathy',
      'A duct flute with seven finger holes and one thumb hole, the usual first school wind instrument; whole, half and quarter notes on it voice the parts of a bar (M3).',
      'https://www.horniman.ac.uk/object/14.5.47/273'),
    e('bagpipes', 'חמת חלילים', 'Highland bagpipes', 'Scotland', 'winds', 'M6', ['patterns'], 'reed',
      'A chanter plays the tune while the drones hold steady notes underneath; the tune\'s repeated phrases over the drone voice melodic patterns (M6).',
      'https://collections.ed.ac.uk/mimed/record/16229'),
    e('dizi', 'דִּיזִי', 'Dizi', 'China', 'winds', 'M6', ['patterns', 'symmetry'], 'breathy',
      'A bamboo cross flute with six finger holes and one extra hole covered by a membrane that gives its buzzing tone; a timbre for melodic and mirror patterns (M6).',
      'https://bu.hu.museum-digital.org/object/17387?navlang=en'),
    // ---------- keys ----------
    e('piano', 'פסנתר', 'Piano', 'Italy (Florence, c. 1700)', 'keys', 'M6', ['patterns'], 'keys',
      'Hammers strike the strings; 88 keys, 52 white and 36 black, with 12 equal semitones per octave, so the same group of keys repeats along the keyboard: a pattern to find and continue (M6).',
      'https://hyperphysics.gsu.edu/hbase/Music/pianof.html'),
    e('accordion', 'אקורדיון', 'Accordion', 'Europe (Germany)', 'keys', 'M3', ['fractions'], 'organ',
      'Free reeds sounded by a bellows; a note lasts as long as the bellows move, so it can hold a whole, half or quarter note exactly (M3).',
      'https://www.horniman.ac.uk/object/M25-1996'),
    e('harmonium', 'הרמוניום', 'Harmonium', 'India (Calcutta)', 'keys', 'M6', ['patterns'], 'organ',
      'A small reed organ: one hand pumps a bellows at the back while the other plays the keyboard; it sustains repeating melodic phrases (M6).',
      'https://www.geidai.ac.jp/labs/koizumi/english/gcato/html-text/352.html'),
    e('pipeOrgan', 'עוגב', 'Pipe organ', 'Europe', 'keys', 'M5', ['numberLine'], 'organ',
      'Its pipes are graduated by length; over a five-octave keyboard the longest pipe in a rank is 32 times the shortest. Optional play only: ordering pipes low to high (M5, weak evidence).',
      'https://hyperphysics.gsu.edu/hbase/Music/organ.html'),
  ];

  function instrumentById(id) {
    for (let i = 0; i < INSTRUMENTS.length; i++) if (INSTRUMENTS[i].id === id) return INSTRUMENTS[i];
    return null;
  }
  function byFamily(family) {
    return INSTRUMENTS.filter(function (x) { return x.family === family; });
  }
  // Instruments that may voice a topic: only those using its primary way.
  function forTopic(topic) {
    const t = TOPICS[topic];
    if (!t) return [];
    return INSTRUMENTS.filter(function (x) { return x.mathTopics.indexOf(topic) >= 0 && x.mechanism === t.mechanism; });
  }

  return { FAMILIES, PRIMARY, WEAK, TOPICS, INSTRUMENTS, instrumentById, byFamily, forTopic };
});
