import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = 'assets/css/people/people-life-layout.css';
const englishPath = 'assets/css/people/people-life-en-overrides.css';
const css = fs.readFileSync(path.join(root, cssPath), 'utf8');
const englishCss = fs.readFileSync(path.join(root, englishPath), 'utf8');
const masonryRuntime = fs.readFileSync(path.join(root, 'assets/js/root/001-2.js'), 'utf8');
const appShellLayer = fs.readFileSync(path.join(root, 'assets/css/app-shell-header-layer.css'), 'utf8');
assert.match(appShellLayer, /#petlab-header\s*\{\s*z-index:\s*1000;/, 'shared AppShell layer should own header stacking');
assert(css.includes('min-width: 700px') && css.includes('grid-template-areas') && css.includes('workplace'), 'shared masonry areas and breakpoint should remain');
assert.match(css, /body\.page-people-people-life-cn \.ll-static-background,[\s\S]*?body\.page-people-people-life-en \.ll-static-background\s*\{\s*background-image:\s*url\("\.\.\/\.\.\/pic\/About\/impact\/semiconductor-wafer\.jpg"\);/);
assert(fs.existsSync(path.join(root, 'assets/pic/About/impact/semiconductor-wafer.jpg')), 'shared People Life background image should exist');
assert(masonryRuntime.includes('p-masonry-generic--has-image') && masonryRuntime.includes('.css("top","".concat(n,"px"))'), 'shared Masonry behavior should calculate image-card content offset at runtime');
assert(masonryRuntime.includes('.p-masonry-generic--has-image .p-masonry-generic__content").removeAttr("style")'), 'shared Masonry behavior should clear image-card inline geometry below the desktop breakpoint');
assert(englishCss.includes('font-family: "StoryIcomoon"') && englishCss.includes('nth-child(4)'), 'English CTA font and card overrides should remain');
assert(englishCss.includes('../../fonts/root/media/r029.ttf'), 'English font URL should be rebased from the stylesheet location');
assert(fs.existsSync(path.join(root, 'assets/fonts/root/media/r029.ttf')), 'rebased English CTA font should exist');

for (const language of ['cn', 'en']) {
  const file = `People/People-Life-${language}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const link = `../${cssPath}?v=20261003-shell2`;
  const sharedIndex = html.indexOf(link);
  const headerLayerIndex = html.indexOf('../assets/css/app-shell-header-layer.css?v=20260929-1');
  const archiveIndex = html.indexOf('../assets/css/archive-consistency.css');
  assert(sharedIndex > html.indexOf('petlab-life-jpl-cards.css') && sharedIndex < headerLayerIndex && headerLayerIndex < archiveIndex, `${file}: preserve original cascade position with the shared header layer after page CSS`);
  assert.equal(html.split(link).length - 1, 1, `${file}: load shared layer once`);
  assert(html.includes('people-life-work-grid'), `${file}: layout owner remains in page`);
  assert.doesNotMatch(html, /<div class="p-masonry-generic__content" style="top:\s*422px;">/, `${file}: stale Masonry runtime offset should not be frozen in the HTML`);
  assert.equal((html.match(/class="ll-static-background" style=/g) || []).length, 0, `${file}: background image is no longer duplicated inline`);
  if (language === 'cn') assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: shared inline block should be removed`);
  else {
    const enLink = `../${englishPath}?v=20260929-shared1`;
    assert(sharedIndex < html.indexOf(enLink) && html.indexOf(enLink) < archiveIndex, `${file}: English overrides should follow shared styles`);
    assert.equal(html.split(enLink).length - 1, 1, `${file}: load English overrides once`);
    assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: extracted English block should be removed`);
  }
}

process.stdout.write('PASS: People Life shares layout while keeping English font and card exceptions local.\n');
