// MelodyMath — sorting polygons and spotting a right angle (כיתה א׳–ב׳).
//
// Pure classification facts, no drawing library. Shapes are named and
// described in the prompt text itself so a screen reader carries the same
// information a sighted child gets from the glyph.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SHAPES = {
    triangle: { he: 'משולש', glyph: '▲', sides: 3, vertices: 3 },
    square: { he: 'ריבוע', glyph: '◼', sides: 4, vertices: 4 },
    rectangle: { he: 'מלבן', glyph: '▭', sides: 4, vertices: 4 },
    pentagon: { he: 'מחומש', glyph: '⬟', sides: 5, vertices: 5 },
    hexagon: { he: 'משושה', glyph: '⬡', sides: 6, vertices: 6 },
  };

  const NAMES_BY_SIDES = {
    3: ['triangle'],
    4: ['square', 'rectangle'],
    5: ['pentagon'],
    6: ['hexagon'],
  };

  function shapeOf(name) {
    return SHAPES[name] || null;
  }

  function sidesOf(name) {
    const s = shapeOf(name);
    return s ? s.sides : null;
  }

  function verticesOf(name) {
    const s = shapeOf(name);
    return s ? s.vertices : null;
  }

  function namesForSides(n) {
    return (NAMES_BY_SIDES[n] || []).slice();
  }

  function shapeHe(name) {
    const s = shapeOf(name);
    return s ? s.he : name;
  }

  // A right angle is exactly 90 degrees. Anything else — flat, obtuse,
  // acute, straight — is not, and that binary is what a כיתה א׳/ב׳ child
  // is asked to spot, not the degree value itself.
  function isRightAngle(deg) {
    return Math.round(Number(deg)) === 90;
  }

  return {
    SHAPES: SHAPES,
    shapeOf: shapeOf,
    sidesOf: sidesOf,
    verticesOf: verticesOf,
    namesForSides: namesForSides,
    shapeHe: shapeHe,
    isRightAngle: isRightAngle,
  };
});
