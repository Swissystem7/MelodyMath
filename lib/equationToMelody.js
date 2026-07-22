function equationToMelody(equation, options) {
  if (typeof equation !== 'string' || !options || typeof options !== 'object') {
    throw new Error('Invalid equation');
  }
  let { xRange, step, scale, tempo } = options;
  if (!Array.isArray(xRange) || xRange.length !== 2 || !xRange.every(Number.isFinite)) {
    throw new Error('Invalid equation');
  }
  let [xMin, xMax] = xRange;
  if (xMin > xMax) { [xMin, xMax] = [xMax, xMin]; }
  if (!Number.isFinite(step) || step <= 0) { step = 0.01; }
  if (step < 0.01) { step = 0.01; }
  const validScales = ['pentatonic', 'major', 'chromatic'];
  if (!validScales.includes(scale)) { scale = 'pentatonic'; }
  if (!Number.isFinite(tempo) || tempo < 30 || tempo > 300) { tempo = 120; }

  const scaleNotes = {
    pentatonic: ['C', 'D', 'E', 'G', 'A'],
    major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    chromatic: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  };
  const notes = scaleNotes[scale];
  const noteCount = notes.length;

  let fn;
  try {
    const expression = equation.replace(/\^/g, '**');
    if (!expression.trim() || !/^[\d\sx+\-*/%().]+$/.test(expression)) throw new Error();
    fn = new Function('x', `"use strict"; return (${expression});`);
  } catch (e) {
    throw new Error('Invalid equation');
  }

  const points = [];
  const pointCount = Math.floor((xMax - xMin) / step) + 1;
  if (!Number.isSafeInteger(pointCount) || pointCount > 1000000) throw new Error('Invalid equation');
  for (let i = 0; i < pointCount; i++) {
    const x = xMin + i * step;
    let y;
    try {
      y = fn(x);
    } catch (e) {
      continue;
    }
    if (typeof y !== 'number' || isNaN(y) || !isFinite(y)) {
      continue;
    }
    points.push({ x, y });
  }

  if (points.length === 0) {
    return [];
  }

  const yValues = points.map(p => p.y);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const yRange = yMax - yMin || 1;

  const noteSequence = [];
  let currentTime = 0;
  const beatDuration = 60 / tempo;

  for (let i = 0; i < points.length; i++) {
    const { x, y } = points[i];
    const normalizedY = (y - yMin) / yRange;
    const noteIndex = Math.round(normalizedY * (noteCount - 1));
    const clampedIndex = Math.max(0, Math.min(noteCount - 1, noteIndex));
    const noteName = notes[clampedIndex];
    const octave = 4 + Math.floor(clampedIndex / noteCount);
    const note = `${noteName}${octave}`;

    let duration = beatDuration;
    if (i < points.length - 1) {
      const nextY = points[i + 1].y;
      const deriv = Math.abs(nextY - y) / step;
      const maxDeriv = 10;
      const normalizedDeriv = Math.min(deriv / maxDeriv, 1);
      duration = beatDuration * (0.5 + 0.5 * (1 - normalizedDeriv));
    }

    noteSequence.push({
      note,
      duration,
      startTime: currentTime
    });
    currentTime += duration;
  }

  return noteSequence;
}

module.exports = { equationToMelody };
