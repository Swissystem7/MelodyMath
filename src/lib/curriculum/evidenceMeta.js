// MelodyMath — evidence and buildsFrom metadata for the teacher (#685, #665).
//
// Decimals, percent and ratio are taught through music by adaptation only:
// no evaluated intervention tested the music way on these topics (#640), so
// every such topic is marked evidence 'experimental' and names the earlier
// topics it builds on. Keys and links are curriculum.js MATRIX topic ids
// ('mm-cur-N'); the links are the progression.js prereqs, written out here so
// the teacher sees them next to the evidence label. Teacher metadata only:
// nothing here changes what the child sees, and nothing is locked (#717).
//
// The curriculum has no row of its own for ratio yet; frequency ratios
// (440 × 1.5) live inside decimal multiplication (mm-cur-52) and share its
// entry. A future ratio row must be added here (test/evidenceMeta.test.js).
//
// Kept apart from grade1-6.js and progression.js so the one-primary work
// (#751) can edit those files without conflicts.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_EVIDENCE_META = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const EXPERIMENTAL = 'experimental';

  // topic id → { evidence, buildsFrom: earlier topic ids }.
  const META = {
    // ה׳ שברים עשרוניים: ערך מקום — fraction models, numbers beyond a million, units.
    'mm-cur-45': { evidence: EXPERIMENTAL, buildsFrom: ['mm-cur-42', 'mm-cur-38', 'mm-cur-35'] },
    // ה׳ חיבור וחיסור שברים עשרוניים — decimal place value, shekels and agorot.
    'mm-cur-46': { evidence: EXPERIMENTAL, buildsFrom: ['mm-cur-45', 'mm-cur-36'] },
    // ו׳ כפל וחילוק שברים עשרוניים (and frequency ratios).
    'mm-cur-52': { evidence: EXPERIMENTAL, buildsFrom: ['mm-cur-45', 'mm-cur-46', 'mm-cur-31'] },
    // ו׳ אחוזים — fraction of a quantity, hundredths.
    'mm-cur-53': { evidence: EXPERIMENTAL, buildsFrom: ['mm-cur-43', 'mm-cur-45'] },
  };

  // Music tags that ask the child to read staff notation. Grades א׳-ב׳ use
  // pictures, blocks and sound instead (#654); notation starts at grade ג׳.
  const STAFF_NOTATION_TAGS = ['staffLines'];

  // { topicId, evidence, buildsFrom } of a topic, or null if it has no entry.
  function metaForTopic(id) {
    if (!Object.prototype.hasOwnProperty.call(META, id)) return null;
    return { topicId: id, evidence: META[id].evidence, buildsFrom: META[id].buildsFrom.slice() };
  }

  return {
    EXPERIMENTAL: EXPERIMENTAL,
    META: META,
    STAFF_NOTATION_TAGS: STAFF_NOTATION_TAGS,
    metaForTopic: metaForTopic,
  };
});
