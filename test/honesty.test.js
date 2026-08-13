const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('there is no GitHub Actions workflow in the repo', () => {
  const wf = path.join(root, '.github', 'workflows');
  assert.equal(fs.existsSync(wf), false, '.github/workflows must not exist');
});

test('the unused factory lib/ folder is gone', () => {
  const factory = path.join(root, 'lib');
  if (!fs.existsSync(factory)) return;
  const leftover = fs.readdirSync(factory).filter((n) => n.endsWith('.js'));
  assert.deepEqual(leftover, [], leftover.join(', '));
});

test('home does not ship a fake pro upgrade or paywall', () => {
  const index = read('index.html');
  assert.doesNotMatch(index, /rmUpgradeBtn|שדרוג לפרו|rmProBadge|rmParentPro/);
  assert.doesNotMatch(index, /checkout|stripe|תשלום עכשיו/i);
});

test('RESEARCH.md points at archived validation docs, not missing root files', () => {
  const research = read('RESEARCH.md');
  assert.match(research, /docs\/archive\/VALIDATION\.md/);
  assert.match(research, /docs\/archive\/HACKATHON\.md/);
  assert.doesNotMatch(research, /github\.com\/Swissystem7\/MelodyMath\/blob\/master\/VALIDATION\.md/);
  assert.doesNotMatch(research, /github\.com\/Swissystem7\/MelodyMath\/blob\/master\/HACKATHON\.md/);
  assert.ok(fs.existsSync(path.join(root, 'docs', 'archive', 'VALIDATION.md')));
  assert.ok(fs.existsSync(path.join(root, 'docs', 'archive', 'HACKATHON.md')));
});

test('live pages and the offer letter refuse efficacy and treatment claims', () => {
  const pages = ['index.html', 'landing.html', 'offer.html', 'README.md', 'curriculum.html'];
  for (const page of pages) {
    const text = read(page);
    assert.doesNotMatch(text, /סוגרים פערים במתמטיקה/);
    assert.doesNotMatch(text, /הילד שולט בכל המיומנויות/);
    assert.doesNotMatch(text, /מחקרים מוכיחים שהקצב/);
    assert.doesNotMatch(text, /ADHD|דיסקלקול|dyscalcul/i);
    assert.doesNotMatch(text, /15–20%|15-20%/);
  }
  const letter = require('../src/lib/offer').principalLetterBody({
    teacher: 'נועה',
    school: 'בית חינוך',
    grade: 'שילוב ב׳',
  });
  assert.match(letter, /אין טענה שהקצב משפר מתמטיקה|אין מחקר על הכלי הזה/);
  assert.doesNotMatch(letter, /שולט|טיפול מוכח|משפר מתמטיקה ב־/);
});

test('pages only load scripts that exist, and home does not load graph lessons', () => {
  const index = read('index.html');
  assert.doesNotMatch(index, /src="src\/lib\/graphListen\.js"/);
  assert.doesNotMatch(index, /src="src\/lib\/listenLessons\.js"/);
  assert.match(index, /src="src\/lib\/tabs\.js"/);
  assert.match(index, /src="src\/lib\/mastery\.js"/);
  assert.match(index, /src="src\/lib\/numberLine\.js"/);
  assert.ok(require('node:fs').existsSync(require('node:path').join(root, 'src/lib/mastery.js')));
  assert.ok(require('node:fs').existsSync(require('node:path').join(root, 'curriculum.html')));
  const landing = read('landing.html');
  assert.doesNotMatch(landing, /src="src\/lib\/sonify\.js"/);
  assert.doesNotMatch(landing, /src="src\/lib\/adaptive\.js"/);
  const offer = read('offer.html');
  assert.doesNotMatch(offer, /src="src\/lib\/sonify\.js"/);
  const fn = read('functions.html');
  assert.doesNotMatch(fn, /src="src\/lib\/adaptive\.js"/);
});
