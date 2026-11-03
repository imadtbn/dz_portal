/* Repeatable desktop CLS check. Requires Node.js, Chrome and internet access.
   Run: node tools/lighthouse-desktop-3x.cjs
   Produces JSON reports and median CLS in ./lighthouse-results/. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const url = 'https://imadtbn.github.io/dz_portal/index.html';
const outputDirectory = path.resolve(process.cwd(), 'lighthouse-results');
fs.mkdirSync(outputDirectory, {recursive: true});
const runs = [];

for (let i = 1; i <= 3; i += 1) {
  const output = path.join(outputDirectory, `desktop-${i}.json`);
  console.log(`Lighthouse desktop audit ${i}/3`);
  const args = [
    '--yes', 'lighthouse', url, '--preset=desktop',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json', `--output-path=${output}`, '--quiet',
    '--chrome-flags=--headless=new --incognito --disable-extensions'
  ];
  const task = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, {
    stdio: 'inherit', shell: process.platform === 'win32'
  });
  if (task.error || task.status !== 0 || !fs.existsSync(output)) {
    console.error('Lighthouse failed:', task.error?.message || task.status);
    process.exitCode = 1;
    break;
  }
  const report = JSON.parse(fs.readFileSync(output, 'utf8'));
  if (report.runtimeError || report.runWarnings?.length) {
    console.error('Unreliable Lighthouse run:', report.runtimeError || report.runWarnings);
    process.exitCode = 1;
    break;
  }
  runs.push({
    run: i,
    performance: Math.round(report.categories.performance.score * 100),
    cls: Number(report.audits['cumulative-layout-shift'].numericValue.toFixed(4)),
    lcpMs: Math.round(report.audits['largest-contentful-paint'].numericValue),
    tbtMs: Math.round(report.audits['total-blocking-time'].numericValue)
  });
  console.table([runs.at(-1)]);
}

if (runs.length === 3) {
  console.table(runs);
  const medianCLS = runs.map(item => item.cls).sort((a,b) => a-b)[1];
  const passes = runs.every(item => item.cls < 0.1);
  console.log('Median CLS:', medianCLS, '| All desktop runs below 0.10:', passes);
  fs.writeFileSync(path.join(outputDirectory, 'summary.json'),
    JSON.stringify({url, medianCLS, passes, runs}, null, 2));
  if (!passes) process.exitCode = 2;
} else {
  console.error('Three valid audits were not completed; CLS is not verified.');
  process.exitCode = 1;
}
