const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('path');

const root = path.join(__dirname, '..');

test('the Trusted Web Activity manifest points at the live GitHub Pages app and not a bundled snapshot', () => {
  const twa = JSON.parse(fs.readFileSync(path.join(root, 'android', 'twa-manifest.json'), 'utf8'));
  assert.equal(twa.packageId, 'com.swissystem.melodymath');
  assert.equal(twa.host, 'swissystem7.github.io');
  assert.equal(twa.name, 'MelodyMath');
  assert.equal(twa.launcherName, 'MelodyMath');
  assert.equal(twa.startUrl, '/MelodyMath/index.html');
  assert.equal(twa.fullScopeUrl, 'https://swissystem7.github.io/MelodyMath/');
  assert.equal(twa.webManifestUrl, 'https://swissystem7.github.io/MelodyMath/manifest.webmanifest');
  assert.equal(twa.display, 'standalone');
  assert.equal(twa.fallbackType, 'customtabs');
  assert.equal(twa.enableNotifications, false);
  assert.equal(twa.signingKey.alias, 'melodymath');
  assert.equal(twa.signingKey.path, './android.keystore');
  assert.equal(twa.appVersionCode, 1);
  assert.deepEqual(twa.fingerprints, []);
  assert.equal(fs.existsSync(path.join(root, 'android', 'android.keystore')), false);
});

test('asset links stay an example until a real Play signing certificate exists', () => {
  const example = JSON.parse(fs.readFileSync(path.join(root, '.well-known', 'assetlinks.json.example'), 'utf8'));
  assert.equal(fs.existsSync(path.join(root, '.well-known', 'assetlinks.json')), false);
  assert.equal(example[0].target.package_name, 'com.swissystem.melodymath');
  assert.deepEqual(example[0].relation, ['delegate_permission/common.handle_all_urls']);
  assert.match(example[0].target.sha256_cert_fingerprints[0], /REPLACE_WITH/);
  const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  assert.match(ignore, /\*\.keystore/);
  assert.match(ignore, /\*\.aab/);
});

test('the Play steps name the origin-root asset link and the Bubblewrap build', () => {
  const doc = fs.readFileSync(path.join(root, 'docs', 'android-release.md'), 'utf8');
  assert.match(doc, /https:\/\/swissystem7\.github\.io\/\.well-known\/assetlinks\.json/);
  assert.match(doc, /swissystem7\.github\.io/);
  assert.match(doc, /@bubblewrap\/cli@1\.27\.0/);
  assert.match(doc, /BUBBLEWRAP_KEYSTORE_PASSWORD/);
  assert.match(doc, /targetSdkVersion 36/);
  assert.match(doc, /com\.swissystem\.melodymath/);
  assert.match(doc, /27f66919302fb81cee74168a45df8feec3356bff/);
  assert.match(doc, /Android Debug/);
  assert.doesNotMatch(doc, /BEGIN (RSA |OPENSSH )?PRIVATE KEY/);
});
