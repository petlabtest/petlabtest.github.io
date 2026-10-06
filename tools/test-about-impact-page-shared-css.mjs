import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const basePath = 'assets/css/about/impact-page-layout.css';
const cnPath = 'assets/css/about/impact-page-cn-overrides.css';
const base = fs.readFileSync(path.join(root, basePath), 'utf8');
const cn = fs.readFileSync(path.join(root, cnPath), 'utf8');
assert(base.includes('@font-face') && base.includes('.page-impact'), 'shared Impact page layer should preserve local fonts and layout');
assert(!base.includes('.page-impact #main-content a.cta--button.cta--button-blue::after'), 'Chinese CTA exception should not leak into the shared layer');
assert.match(base, /\.page-impact>#main-content>\.ll-pub-section\.ll-background-light-blue>\.ll-static-background\s*\{[^}]*background-image:\s*url\("\.\.\/\.\.\/pic\/About\/impact\/semiconductor-wafer\.jpg"\)/s, 'bilingual static background image should be owned by the shared Impact layer');
assert.match(base, /\.page-impact \.impact-team-achievements-image\s*\{\s*background-image:\s*url\("\.\.\/\.\.\/pic\/About\/impact\/team-achievements-bg\.jpg"\);\s*width:\s*67rem;\s*height:\s*35rem;\s*object-fit:\s*cover;\s*left:\s*1\.2rem;\s*top:\s*-1\.2rem;/, 'team-achievements image source and geometry should be shared');
assert(cn.includes('.page-impact #main-content a.cta--button.cta--button-blue::after') && cn.includes('content: none !important'), 'Chinese CTA exception should remain explicit');
const urls = [...base.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match => match[1]);
assert.equal(urls.length, 6, 'four local font sources and two shared background images should remain');
for (const url of urls) assert(fs.existsSync(path.resolve(root, 'assets/css/about', url)), `font should exist: ${url}`);

for (const language of ['cn', 'en']) {
  const file = `About/About-impact-${language}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const earlierShared = html.indexOf('../assets/css/about/impact-layout.css?v=20261006-titlehero2');
  const titleGeometry = html.indexOf('../assets/css/about/about-title-hero-shared.css?v=20261003-2');
  const titleType = html.indexOf('../assets/css/about/about-title-hero-editorial-type.css?v=20261003-1');
  const baseLink = html.indexOf(`../${basePath}?v=20260930-shared7`);
  const archive = html.indexOf('../assets/css/archive-consistency.css');
  assert(earlierShared > 0 && earlierShared < titleGeometry && titleGeometry < titleType && titleType < baseLink && baseLink < archive, `${file}: shared title and impact layers must retain cascade order`);
  assert.equal((html.match(/<style\b/gi) || []).length, 0, `${file}: extracted inline block should be removed`);
  assert.match(html, /class="ll-static-background"(?![^>]*\bstyle\s*=)/, `${file}: shared background no longer needs inline resource declaration`);
  assert.equal((html.match(/class="impact-team-achievements-image"/g) || []).length, 1, `${file}: shared team-achievements image geometry has one consumer`);
  assert.doesNotMatch(html, /team-achievements-bg\.jpg[^>]*style=/, `${file}: team-achievements image styles should not return inline`);
  assert.doesNotMatch(html, /impact-patent-award-(?:content|description)|raycan_2022globalawardwinner/i, `${file}: removed award feature must not remain in the page`);
  const cnLink = html.indexOf(`../${cnPath}?v=20260929-shared2`);
  if (language === 'cn') assert(baseLink < cnLink && cnLink < archive, `${file}: Chinese exception should follow shared CSS`);
  else assert.equal(cnLink, -1, `${file}: Chinese-only exception should not load in English`);
}

process.stdout.write('PASS: About Impact local layout is shared with the Chinese-only CTA exception preserved.\n');
