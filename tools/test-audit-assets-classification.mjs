import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = execFileSync(process.execPath, [path.join(root, 'tools/audit-assets.mjs')], { encoding: 'utf8' });
const report = JSON.parse(output);
const categories = report.missingReferenceCategories;

assert.equal(typeof report.sourceRoots, 'number', 'source-entry count should include non-HTML source roots explicitly');
assert(!('htmlRoots' in report), 'the report should not label JS/JSON roots as HTML pages');
assert(report.missingReferences.length > 0, 'fixture repository should exercise missing-reference categorization');
assert(report.missingReferences.every(reference => typeof reference.category === 'string'), 'every missing reference should have a category');
assert.equal(Object.values(categories).reduce((sum, count) => sum + count, 0), report.missingReferences.length, 'category totals should account for every missing reference exactly once');
assert(categories.legacyThemeRoot > 0, 'legacy Drupal theme-root paths should be distinguished');
assert(categories.replicatedSubsiteRoot > 0, 'replicated subsite-root paths should be distinguished');

process.stdout.write(`PASS: categorized ${report.missingReferences.length} unresolved paths into ${Object.keys(categories).length} source/path groups.\n`);
