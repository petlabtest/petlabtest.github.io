import assert from 'node:assert/strict';
import fs from 'node:fs';

const stylesheet = '../assets/css/engage/engage-inquiry-feedback.css?v=20260930-1';
const formStylesheet = '../assets/css/engage/engage-inquiry-form-layout.css?v=20260930-1';
const css = fs.readFileSync('assets/css/engage/engage-inquiry-feedback.css', 'utf8');
const formCss = fs.readFileSync('assets/css/engage/engage-inquiry-form-layout.css', 'utf8');
assert.match(css, /\.inquiry-success\s*\{[^}]*display:\s*none;[^}]*background:\s*#e8f5e9;/s);
assert.match(css, /\.inquiry-success\.is-visible\s*\{\s*display:\s*block;\s*\}/);
assert.match(css, /\.inquiry-success__title\s*\{[^}]*color:\s*#2e7d32;/s);
assert.match(css, /\.inquiry-success__message\s*\{[^}]*color:\s*#1b5e20;/s);
assert.match(formCss, /\.engage-detail-page \[data-drupal-selector="edit-top-contact"\],[\s\S]*\.engage-detail-page \[data-drupal-selector="edit-contact-side-2"\]\s*\{\s*margin:\s*0\s*!important;/);
assert.match(formCss, /\.engage-detail-page #edit-contact-side \.form-item-name,[\s\S]*\.engage-detail-page #edit-contact-side \.form-item-title\s*\{\s*margin-bottom:\s*0\s*!important;/);

for (const language of ['cn', 'en']) {
  const file = `Engage/Engage-inquiry-${language}.html`;
  const html = fs.readFileSync(file, 'utf8');
  assert.equal(html.split(stylesheet).length - 1, 1, `${file}: shared feedback CSS loads exactly once`);
  assert.equal(html.split(formStylesheet).length - 1, 1, `${file}: shared form layout CSS loads exactly once`);
  assert.match(html, /<div id="inquiry-success" class="inquiry-success" aria-live="polite">/, `${file}: feedback has an accessible semantic host`);
  assert.equal((html.match(/class="inquiry-success__title"/g) || []).length, 1, `${file}: one feedback title`);
  assert.equal((html.match(/class="inquiry-success__message"/g) || []).length, 1, `${file}: one feedback message`);
  assert.match(html, /successBox\.classList\.add\('is-visible'\)/, `${file}: success state uses the shared visibility class`);
  assert.doesNotMatch(html, /id="inquiry-success"[^>]*style=|class="inquiry-success__(?:title|message)" style=/, `${file}: remove feedback presentation inline styles`);
  assert.equal((html.match(/style="margin(?:-bottom)?:\s*0;?"/g) || []).length, 0, `${file}: form group spacing is owned by shared CSS`);
}

process.stdout.write('PASS: bilingual Engage inquiry feedback uses shared visual and visibility states.\n');
