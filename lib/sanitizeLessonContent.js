const DEFAULT_BLACKLIST = [
  'badword', 'offensive', 'damn', 'idiot', 'hate', 'kill', 'fuck', 'shit',
  'porn', 'drug', 'suicide', 'murder', 'rape', 'weapon', 'bomb'
];

const HOMOGLYPHS = { 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', 'і': 'i' };
const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i' };

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function canonicalCharacter(character) {
  const lower = character.toLocaleLowerCase();
  return HOMOGLYPHS[lower] || LEET[lower] || lower;
}

function sanitizeLessonContent(content, config = {}) {
  if (content === null || content === undefined || content === '') {
    return { safe: true, sanitized: '', flaggedWords: [] };
  }
  if (typeof content !== 'string') throw new TypeError('content must be a string');
  const blacklist = Array.isArray(config.customBlacklist) && config.customBlacklist.length
    ? config.customBlacklist : DEFAULT_BLACKLIST;
  const strictness = config.strictness === 'high' ? 'high' : 'low';
  const ranges = [];
  const flaggedWords = [];

  for (const term of blacklist) {
    if (typeof term !== 'string' || term.length === 0) continue;
    if (strictness === 'low') {
      const regex = new RegExp(`(?<![\\p{L}\\p{N}])${escaped(term)}(?![\\p{L}\\p{N}])`, 'giu');
      for (const match of content.matchAll(regex)) {
        const start = [...content.slice(0, match.index)].length;
        ranges.push([start, start + [...match[0]].length]);
        if (!flaggedWords.includes(match[0])) flaggedWords.push(match[0]);
      }
      continue;
    }

    const target = [...term.normalize('NFKD')].filter(c => !/\p{M}/u.test(c)).map(canonicalCharacter);
    const contentCharacters = [...content];
    const canonical = [];
    const positions = [];
    contentCharacters.forEach((originalCharacter, index) => {
      for (const character of originalCharacter.normalize('NFKD')) {
        if (/\p{M}/u.test(character) || /[\s._-]/u.test(character)) continue;
        canonical.push(canonicalCharacter(character));
        positions.push(index);
      }
    });
    for (let start = 0; start <= canonical.length - target.length; start++) {
      if (!target.every((character, offset) => canonical[start + offset] === character)) continue;
      const end = start + target.length;
      const originalStart = positions[start];
      const originalEnd = positions[end - 1] + 1;
      const original = contentCharacters.slice(originalStart, originalEnd).join('');
      ranges.push([originalStart, originalEnd]);
      if (!flaggedWords.includes(original)) flaggedWords.push(original);
      start = end - 1;
    }
  }

  const covered = new Set();
  for (const [start, end] of ranges) for (let i = start; i < end; i++) covered.add(i);
  const sanitized = [...content].map((character, index) => covered.has(index) ? '*' : character).join('');
  return { safe: flaggedWords.length === 0, sanitized, flaggedWords };
}

module.exports = { sanitizeLessonContent };
