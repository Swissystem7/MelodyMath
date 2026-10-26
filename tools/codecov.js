#!/usr/bin/env node
// Coverage for the existing node --test suite, then an optional Codecov upload (Refs #609).
// CODECOV_TOKEN is never written into the repo. Missing token: skip the upload and exit 0.
// This repo does not add a GitHub Actions workflow (test/honesty.test.js).
'use strict';
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const secrets = require('./secrets');
const PLACEHOLDER = secrets.PLACEHOLDER.CODECOV_TOKEN;

function tokenOf(env) {
  return secrets.secretOf('CODECOV_TOKEN', env);
}

function writeCoverage(root) {
  const dest = path.join(root, 'coverage', 'lcov.info');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const r = spawnSync(process.execPath, [
    '--test', '--experimental-test-coverage',
    '--test-reporter=lcov', '--test-reporter-destination=' + dest,
  ], { cwd: root, stdio: 'inherit' });
  return { status: r.status == null ? 1 : r.status, dest: dest };
}

async function uploadReport(lcov, env, fetchImpl) {
  const token = tokenOf(env);
  if (!token) return { ok: true, uploaded: false, reason: 'token-missing' };
  const fetchFn = fetchImpl || fetch;
  const q = new URLSearchParams({
    package: 'melodymath', token: token,
    branch: (env && env.GITHUB_REF_NAME) || '',
    commit: (env && env.GITHUB_SHA) || '',
    slug: 'Swissystem7/MelodyMath',
    service: 'custom',
    build: (env && env.GITHUB_RUN_ID) || 'local',
    pr: (env && env.PR_NUMBER) || '',
  });
  const res = await fetchFn('https://codecov.io/upload/v4?' + q.toString(), { method: 'POST' });
  if (!res.ok) return { ok: true, uploaded: false, reason: 'codecov-' + res.status };
  const lines = String(await res.text()).split('\n').map(function (s) { return s.trim(); });
  const url = lines.find(function (s) { return s.indexOf('http') === 0; });
  if (!url) return { ok: true, uploaded: false, reason: 'no-upload-url' };
  const put = await fetchFn(url, { method: 'PUT', body: lcov, headers: { 'Content-Type': 'text/plain' } });
  return { ok: true, uploaded: !!put.ok, reason: put.ok ? 'ok' : 'put-' + put.status };
}

async function main() {
  const root = path.join(__dirname, '..');
  const run = writeCoverage(root);
  if (run.status !== 0) process.exit(run.status);
  const lcov = fs.readFileSync(run.dest, 'utf8');
  const result = await uploadReport(lcov, process.env);
  if (!result.uploaded) console.log('codecov: ' + result.reason);
  process.exit(0);
}

if (require.main === module) {
  main().catch(function (err) {
    console.log('codecov: ' + (err && err.message ? err.message : err));
    process.exit(0);
  });
}

module.exports = { tokenOf: tokenOf, uploadReport: uploadReport, writeCoverage: writeCoverage, PLACEHOLDER: PLACEHOLDER };
