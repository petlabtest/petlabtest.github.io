import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const profiles = [
  'About/About-LinWan-cn.html', 'About/About-LinWan-en.html',
  'About/About-Nicola-cn.html', 'About/About-Nicola-en.html',
  'About/About-PengXiao-cn.html', 'About/About-PengXiao-en.html',
  'About/About-QingguoXie-cn.html', 'About/About-QingguoXie-en.html',
  'About/About-Ruizheng-cn.html', 'About/About-Ruizheng-en.html',
];
const stylesheetHref = '../assets/css/about/team-detail-layout.css?v=20261006-profile3';
const css = fs.readFileSync('assets/css/about/team-detail-layout.css', 'utf8');
const script = fs.readFileSync('assets/js/root/01-team-detail-433aa147.js', 'utf8');

assert.match(css, /body\.team-profile-page \.team-detail-tab-content \.tab-panel\s*\{\s*display:\s*none;\s*\}/);
assert.match(css, /body\.team-profile-page \.team-detail-tab-content \.tab-panel\.is-active\s*\{\s*display:\s*block;\s*\}/);
assert.match(script, /panels\[i\]\.classList\.toggle\('is-active', i === idx\)/);
assert.doesNotMatch(script, /panels\[i\]\.style\.display/);

for (const file of profiles) {
  const html = fs.readFileSync(file, 'utf8');
  assert.equal(html.split(stylesheetHref).length - 1, 1, `${file}: shared state styles load once`);
  assert.equal((html.match(/class="tab-btn(?: active)?"/g) || []).length, 3, `${file}: preserve three tab buttons`);
  assert.equal((html.match(/class="tab-panel(?: is-active)?"/g) || []).length, 3, `${file}: preserve three tab panels`);
  assert.equal((html.match(/class="tab-panel is-active"/g) || []).length, 1, `${file}: first panel remains active by default`);
  assert.doesNotMatch(html, /class="tab-panel(?: is-active)?" style="display:/, `${file}: remove tab presentation from inline styles`);
}

function classList(initial = []) {
  const values = new Set(initial);
  return {
    contains: value => values.has(value),
    toggle(value, force) {
      const shouldAdd = force === undefined ? !values.has(value) : Boolean(force);
      if (shouldAdd) values.add(value);
      else values.delete(value);
      return shouldAdd;
    },
  };
}

const buttons = Array.from({ length: 3 }, (_, i) => ({
  classList: classList(i === 0 ? ['active'] : []),
  addEventListener: (_event, handler) => { buttons[i].clickHandler = handler; },
}));
const panels = Array.from({ length: 3 }, (_, i) => ({
  classList: classList(i === 0 ? ['is-active'] : []),
}));
let onReady;
const document = {
  addEventListener: (_event, handler) => { onReady = handler; },
  querySelectorAll(selector) {
    if (selector === '.team-detail-tab-btns .tab-btn') return buttons;
    if (selector === '.team-detail-tab-content .tab-panel') return panels;
    return [];
  },
};
vm.runInNewContext(script, { document });
onReady();
buttons[1].clickHandler();
assert.deepEqual(buttons.map(button => button.classList.contains('active')), [false, true, false]);
assert.deepEqual(panels.map(panel => panel.classList.contains('is-active')), [false, true, false]);
buttons[2].clickHandler();
assert.deepEqual(buttons.map(button => button.classList.contains('active')), [false, false, true]);
assert.deepEqual(panels.map(panel => panel.classList.contains('is-active')), [false, false, true]);

process.stdout.write(`PASS: ${profiles.length} bilingual researcher pages share semantic tab states; actual script toggles buttons and panels together.\n`);
