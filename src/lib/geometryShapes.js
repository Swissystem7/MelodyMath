// MelodyMath — sorting polygons and spotting a right angle (כיתה א׳–ב׳),
// naming angle and triangle kinds (כיתה ג׳).
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

  // Own keys only: a name like 'toString' or 'constructor' must not
  // resolve to an Object.prototype member.
  function own(map, key) {
    return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
  }

  function shapeOf(name) {
    return own(SHAPES, name);
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
    return (own(NAMES_BY_SIDES, n) || []).slice();
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

  function isStraightAngle(deg) {
    return Math.round(Number(deg)) === 180;
  }

  // כיתה ג׳ names all four kinds. Outside (0, 180] there is no answer a
  // child is asked for, so null rather than a guess.
  function angleKind(deg) {
    const d = Math.round(Number(deg));
    if (!Number.isFinite(d) || d <= 0 || d > 180) return null;
    if (d < 90) return 'חדה';
    if (d === 90) return 'ישרה';
    if (d < 180) return 'קהה';
    return 'שטוחה';
  }

  // A triangle by its largest angle. Angles that do not sum to 180 are not
  // a triangle, so null.
  function triangleByAngles(a, b, c) {
    const angles = [a, b, c].map(function (x) { return Math.round(Number(x)); });
    if (angles.some(function (x) { return !Number.isFinite(x) || x <= 0; })) return null;
    if (angles[0] + angles[1] + angles[2] !== 180) return null;
    const kind = angleKind(Math.max.apply(null, angles));
    if (kind === 'חדה') return 'חד־זווית';
    if (kind === 'ישרה') return 'ישר־זווית';
    return 'קהה־זווית';
  }

  // The shapes a prompt names, in reading order, so the page can show their
  // glyphs next to the text. Decorative only: the prompt already says it.
  function shapesInText(text) {
    const t = String(text == null ? '' : text);
    return Object.keys(SHAPES).map(function (name) {
      return { name: name, at: t.indexOf(SHAPES[name].he) };
    }).filter(function (x) { return x.at >= 0; }).sort(function (a, b) {
      return a.at - b.at;
    }).map(function (x) { return x.name; });
  }

  function renderShapesHtml(text) {
    const names = shapesInText(text);
    if (!names.length) return '';
    return '<div class="shapes" aria-hidden="true">' + names.map(function (name) {
      return '<span class="shape"><span class="shape-glyph">' + SHAPES[name].glyph + '</span>'
        + '<span class="shape-name">' + SHAPES[name].he + '</span></span>';
    }).join('') + '</div>';
  }

  return {
    SHAPES: SHAPES,
    shapesInText: shapesInText,
    renderShapesHtml: renderShapesHtml,
    shapeOf: shapeOf,
    sidesOf: sidesOf,
    verticesOf: verticesOf,
    namesForSides: namesForSides,
    shapeHe: shapeHe,
    isRightAngle: isRightAngle,
    isStraightAngle: isStraightAngle,
    angleKind: angleKind,
    triangleByAngles: triangleByAngles,
  };
});
