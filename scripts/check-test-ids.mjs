// Fails if any test title lacks a "TC-NNN: " prefix or if an ID is used twice.
// Usage: npm run check:ids
import { execFileSync } from 'node:child_process';

const ID = /^(TC-\d{3,}): /;

const output = execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json'], {
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
});
const report = JSON.parse(output);

const specs = [];
const walk = (suite) => {
  for (const spec of suite.specs ?? []) specs.push({ title: spec.title, location: `${spec.file}:${spec.line}` });
  for (const child of suite.suites ?? []) walk(child);
};
report.suites.forEach(walk);

const missing = specs.filter((s) => !ID.test(s.title));
const seen = new Map();
const duplicates = [];
for (const spec of specs) {
  const id = ID.exec(spec.title)?.[1];
  if (!id) continue;
  if (seen.has(id)) duplicates.push(`${id}: ${seen.get(id)} and ${spec.location}`);
  else seen.set(id, spec.location);
}

for (const s of missing) console.error(`Missing test ID: ${s.location} "${s.title}"`);
for (const d of duplicates) console.error(`Duplicate test ID ${d}`);

if (missing.length || duplicates.length) process.exit(1);
const highest = [...seen.keys()].sort().at(-1);
console.log(`✔ ${specs.length} tests, all with unique IDs (highest: ${highest})`);
