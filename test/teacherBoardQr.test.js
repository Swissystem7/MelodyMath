// MM-7xx stream D: the QR code that carries a class code to the teacher's
// device must be a real, scannable QR code (ISO/IEC 18004, level L, mask 0).
// The checks below use constants from the standard, plus a small reader that
// takes the matrix back to text and checks every Reed-Solomon block.
const test = require('node:test');
const assert = require('node:assert/strict');
const qr = require('../src/lib/qrSync');

// GF(256) with the QR polynomial 0x11d, built independently of qrSync.js.
const EXP = [], LOG = [];
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x = (x << 1) ^ (x & 128 ? 0x11d : 0); }
const mul = (a, b) => (a && b ? EXP[(LOG[a] + LOG[b]) % 255] : 0);

const EC = [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26];
const NB = [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12];
// Total codewords per version (ISO/IEC 18004 table 1).
const TOTAL = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655, 733, 815, 901, 991, 1085, 1156, 1258, 1364, 1474, 1588];

// Alignment pattern centres (ISO/IEC 18004 annex E).
const ALIGN = { 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50], 11: [6, 30, 54], 12: [6, 32, 58], 13: [6, 34, 62], 14: [6, 26, 46, 66], 15: [6, 26, 48, 70], 16: [6, 26, 50, 74], 17: [6, 30, 54, 78], 18: [6, 30, 56, 82], 19: [6, 30, 58, 86], 20: [6, 34, 62, 90], 21: [6, 28, 50, 72, 94], 22: [6, 26, 50, 74, 98], 23: [6, 30, 54, 78, 102], 24: [6, 28, 54, 80, 106], 25: [6, 32, 58, 84, 110] };

function isFunction(size, ver, r, c) {
  if (r === 6 || c === 6) return true;
  if ((r < 9 && c < 9) || (r < 9 && c >= size - 8) || (r >= size - 8 && c < 9)) return true;
  if (ver >= 7 && ((r < 6 && c >= size - 11 && c < size - 8) || (c < 6 && r >= size - 11 && r < size - 8))) return true;
  const al = ALIGN[ver] || [];
  for (let i = 0; i < al.length; i++) {
    for (let j = 0; j < al.length; j++) {
      const last = al.length - 1;
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      if (Math.abs(r - al[i]) <= 2 && Math.abs(c - al[j]) <= 2) return true;
    }
  }
  return false;
}

function readBack(m) {
  const size = m.length, ver = (size - 17) / 4;
  // Format, first copy: bits 0-5 down column 8, then 7,8 / 8,8 / 8,7, then row 8 leftwards.
  let f = 0;
  const put = (i, v) => { f |= v << i; };
  for (let i = 0; i <= 5; i++) put(i, m[i][8]);
  put(6, m[7][8]); put(7, m[8][8]); put(8, m[8][7]);
  for (let i = 9; i < 15; i++) put(i, m[8][14 - i]);
  const bits = [];
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    const up = ((right + 1) & 2) === 0;
    for (let v = 0; v < size; v++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j, r = up ? size - 1 - v : v;
        if (isFunction(size, ver, r, c)) continue;
        bits.push(m[r][c] ^ ((r + c) % 2 === 0 ? 1 : 0));
      }
    }
  }
  const cw = [];
  for (let i = 0; i + 8 <= bits.length && cw.length < TOTAL[ver]; i += 8) cw.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  // De-interleave.
  const nb = NB[ver], ec = EC[ver], shortLen = Math.floor(TOTAL[ver] / nb), numShort = nb - TOTAL[ver] % nb;
  const blocks = Array.from({ length: nb }, (_, i) => ({ d: [], e: [], len: shortLen - ec + (i < numShort ? 0 : 1) }));
  let k = 0;
  for (let i = 0; i <= shortLen - ec; i++) blocks.forEach((b) => { if (i < b.len) b.d.push(cw[k++]); });
  for (let i = 0; i < ec; i++) blocks.forEach((b) => b.e.push(cw[k++]));
  // Every block is a codeword: c(alpha^i) = 0 for i = 0..ec-1.
  const syndromesOk = blocks.every((b) => {
    const word = b.d.concat(b.e);
    for (let i = 0; i < ec; i++) {
      let s = 0;
      for (const byte of word) s = mul(s, EXP[i]) ^ byte;
      if (s !== 0) return false;
    }
    return true;
  });
  const data = [].concat(...blocks.map((b) => b.d));
  const dbits = [];
  data.forEach((b) => { for (let i = 7; i >= 0; i--) dbits.push((b >> i) & 1); });
  const take = (n) => dbits.splice(0, n).reduce((a, b) => (a << 1) | b, 0);
  const mode = take(4);
  const len = take(ver < 10 ? 8 : 16);
  const bytes = [];
  for (let i = 0; i < len; i++) bytes.push(take(8));
  return { ver, format: f, mode, text: Buffer.from(bytes).toString('utf8'), syndromesOk };
}

test('format and version information match the values in the standard', () => {
  const v1 = qr.qrMatrix('HELLO');
  assert.equal(readBack(v1).format, 0b111011111000100, 'level L, mask 0');
  // Version 7 information block is 000111110010010100 (0x07C94).
  const m7 = qr.qrMatrix('x'.repeat(150));
  assert.equal(m7.length, 45, 'version 7');
  let v = 0;
  for (let i = 0; i < 18; i++) v |= m7[Math.floor(i / 3)][45 - 11 + (i % 3)] << i;
  assert.equal(v, 0x07c94);
});

test('finder patterns, timing and dark module are in place', () => {
  const m = qr.qrMatrix('MelodyMath');
  const size = m.length;
  const FINDER = ['1111111', '1000001', '1011101', '1011101', '1011101', '1000001', '1111111'];
  for (const [r0, c0] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    for (let r = 0; r < 7; r++) assert.equal([...m[r0 + r].slice(c0, c0 + 7)].join(''), FINDER[r]);
  }
  for (let i = 8; i < size - 8; i++) { assert.equal(m[6][i], i % 2 === 0 ? 1 : 0); assert.equal(m[i][6], i % 2 === 0 ? 1 : 0); }
  assert.equal(m[size - 8][8], 1);
});

test('byte capacity per version matches the standard (level L)', () => {
  assert.equal(qr.qrMatrix('x'.repeat(17)).length, 21, '17 bytes fit version 1');
  assert.equal(qr.qrMatrix('x'.repeat(18)).length, 25, '18 bytes need version 2');
  assert.equal(qr.qrMatrix('x'.repeat(271)).length, 57, '271 bytes fit version 10');
  assert.equal(qr.qrMatrix('x'.repeat(1273)).length, 117, '1273 bytes fit version 25');
  assert.equal(qr.qrFits('x'.repeat(1273)), true);
  assert.equal(qr.qrFits('x'.repeat(1274)), false);
  assert.equal(qr.qrMatrix('x'.repeat(1274)), null);
  assert.match(qr.generateQrSvg('x'.repeat(2000)), /ארוך מדי/);
});

test('the matrix reads back to the same text with valid error correction, versions 1-25', () => {
  const texts = [
    'HELLO',
    'https://swissystem7.github.io/MelodyMath/class.html#mm=MM2.abc',
    'נועה · כיתה ב׳ · '.repeat(4),
    'MM2z.' + 'Ab9_-'.repeat(60),
    'q'.repeat(400),
    'w'.repeat(850),
    'z'.repeat(1273),
  ];
  for (const t of texts) {
    const r = readBack(qr.qrMatrix(t));
    assert.equal(r.mode, 4, 'byte mode');
    assert.equal(r.syndromesOk, true, 'Reed-Solomon blocks for ' + t.slice(0, 20) + ' (v' + r.ver + ')');
    assert.equal(r.text, t);
  }
});

test('the svg keeps a quiet zone and draws one rect per dark module', () => {
  const m = qr.qrMatrix('abc');
  const dark = m.reduce((n, row) => n + row.reduce((a, b) => a + b, 0), 0);
  const svg = qr.generateQrSvg('abc', { margin: 4 });
  assert.match(svg, /viewBox="0 0 29 29"/);
  assert.equal((svg.match(/<rect x=/g) || []).length, dark);
});
