import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const research = path.join(root, 'Research');
const pages = fs.readdirSync(research)
  .filter(file => /^Research-.+\.html$/.test(file))
  .filter(file => !/^Research-ov-/.test(file))
  .filter(file => fs.readFileSync(path.join(research, file), 'utf8').includes('paragraph--type-p-lab-carousel'));

assert.equal(pages.length, 66, 'expected 66 Research detail pages with a lab carousel');

for (const file of pages) {
  const html = fs.readFileSync(path.join(research, file), 'utf8');
  const start = html.indexOf('paragraph--type-p-lab-carousel');
  const end = html.indexOf('p-lab-carousel__cta', start);
  const component = html.slice(start, end);
  const content = component.slice(component.indexOf('<div class="p-lab-carousel__content">'), component.lastIndexOf('<div class="'));

  assert.equal((content.match(/<div\b/g) || []).length, (content.match(/<\/div>/g) || []).length, `${file}: content div nesting should be balanced`);
  assert.equal((component.match(/class="view-content"/g) || []).length, 1, `${file}: one uninitialized view-content`);
  assert.equal((component.match(/class="lab-carousel views-row"/g) || []).length, 1, `${file}: one story slide`);
  assert(!/slick-(?:initialized|slider|slide|list|track|current|active)/.test(component), `${file}: no saved Slick runtime structure`);
  assert(!/style="width: 1512px/.test(component), `${file}: no saved viewport width`);
  assert(html.includes('../assets/js/root/002.js'), `${file}: shared carousel behavior should load`);
}

process.stdout.write('PASS: 66 Research detail pages leave lab carousel initialization and width calculation to the shared script.\n');
