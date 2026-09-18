const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
const entries = [
  'index.html', 'ai-lab.html', 'curriculum.html', 'functions.html', '807.html',
  'landing.html', 'offer.html', 'manifest.webmanifest', 'sw.js', 'icons', 'src'
];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const entry of entries) {
  const source = path.join(root, entry);
  if (fs.existsSync(source)) fs.cpSync(source, path.join(out, entry), { recursive: true });
}
console.log(`Built ${entries.length} site entries into ${out}`);
