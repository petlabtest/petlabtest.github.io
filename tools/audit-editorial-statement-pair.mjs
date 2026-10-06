import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteCss = fs.readFileSync(path.join(root, 'assets/css/site.css'), 'utf8');

assert.doesNotMatch(siteCss, /\.home-programs__initiative-media\b|\.home-programs__explore\b/, 'obsolete initiative media/explore rules must not return without matching markup');
assert.doesNotMatch(siteCss, /\.home-programs__initiative::after\b/, 'disabled initiative slope pseudo-element should not return');
assert.doesNotMatch(siteCss, /Key Initiatives feature composition/, 'superseded card-composition cascade should stay removed');
assert.doesNotMatch(siteCss, /\.home-programs__initiative\s*,\s*\.home-programs__initiative-inner\s*\{\s*min-height:\s*(?:640|680)px/, 'overridden inner min-height declarations must not return in the shared mobile rule');
assert.match(siteCss, /\.home-programs__initiative-inner\s*\{\s*min-height:\s*600px\s*;\s*padding-top:\s*2\.5rem/s, 'tablet inner height should remain owned by the final cascade layer');
assert.match(siteCss, /\.home-programs__initiative-inner\s*\{\s*min-height:\s*640px\s*;\s*padding-top:\s*2rem/s, 'mobile inner height should remain owned by the final cascade layer');
assert.doesNotMatch(siteCss, /\.home-programs__initiative-inner\s*\{\s*width:\s*min\(calc\(100%\s*-\s*96px\),\s*1400px\);\s*margin-inline:\s*auto/s, 'superseded desktop width/centering should not return');
assert.match(siteCss, /\.home-programs \.home-programs__initiative-inner\s*\{\s*left:\s*50%;\s*transform:\s*translateX\(-50%\);\s*width:\s*min\(calc\(100%\s*-\s*96px\),\s*1320px\)!important/s, 'desktop width and centering should stay with the final specific rule');
assert.doesNotMatch(siteCss, /\.home-programs__initiative-accent\s*\{\s*position:\s*absolute;\s*z-index:\s*1;\s*right:\s*3%;\s*bottom:\s*12%;\s*width:\s*clamp\(260px,28vw,470px\)/s, 'superseded desktop accent offsets should not return');
assert.match(siteCss, /\.home-programs \.home-programs__initiative-accent\s*\{\s*right:\s*5%;\s*bottom:\s*15%;\s*width:\s*clamp\(220px,24vw,400px\)/s, 'desktop accent placement should remain owned by the final specific rule');
assert.doesNotMatch(siteCss, /\.home-programs__initiative\s*\{\s*padding:\s*clamp\(5rem,8vw,8rem\)\s*0\s*;\s*background:\s*var\(--program-navy\)/s, 'superseded shared initiative surface should not return');
assert.doesNotMatch(siteCss, /\.home-programs__initiative-inner\s*\{\s*display:\s*grid;/s, 'obsolete initiative grid layout should not return');
assert.doesNotMatch(siteCss, /\.home-programs__initiative-copy\s*\{\s*max-width:\s*760px/s, 'superseded copy width should not return');
assert.match(siteCss, /\.home-programs__initiative-copy>p:not\(\.eyebrow\)\s*\{\s*margin-top:\s*1\.5rem\s*\}/, 'initiative paragraph spacing should remain in the shared program base');

function extractSection(html, openingPattern, ordinal = 0) {
  const openings = [...html.matchAll(openingPattern)];
  const opening = openings[ordinal];
  assert(opening, `missing section matching ${openingPattern} at ordinal ${ordinal}`);
  const start = opening.index;
  const tags = /<section\b[^>]*>|<\/section\s*>/gi;
  tags.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tags.exec(html))) {
    depth += /^<section\b/i.test(match[0]) ? 1 : -1;
    if (depth === 0) return html.slice(start, tags.lastIndex);
  }
  throw new Error('unclosed section');
}

function inventory(markup) {
  return {
    headings: (markup.match(/<h2\b/gi) ?? []).length,
    paragraphs: (markup.match(/<p\b/gi) ?? []).length,
    links: [...markup.matchAll(/<a\b[^>]*class="([^"]*)"[^>]*href="([^"]*)"/gi)].map(([, className, href]) => ({ className, href })),
    images: [...markup.matchAll(/<img\b[^>]*class="([^"]*)"[^>]*alt="([^"]*)"/gi)].map(([, className, alt]) => ({ className, decorative: alt === '' })),
  };
}

function motionTargets(markup) {
  return [...markup.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)]
    .filter(([, , attrs]) => /\bdata-editorial-target\b/i.test(attrs))
    .map(([, tag, attrs]) => ({
      tag: tag.toLowerCase(),
      className: attrs.match(/\bclass="([^"]*)"/i)?.[1] ?? '',
      delay: attrs.match(/\bdata-editorial-delay="([^"]*)"/i)?.[1] ?? null,
      effect: attrs.match(/\bdata-editorial-effect="([^"]*)"/i)?.[1] ?? null,
      legacyHomeMotion: /\bdata-home-(?:reveal|effect)\b/i.test(attrs),
    }));
}

const rows = [];
for (const [language, suffix] of [['zh-CN', 'cn'], ['en', 'en']]) {
  const aboutHtml = fs.readFileSync(path.join(root, `About/About-about-${suffix}.html`), 'utf8');
  const homeHtml = fs.readFileSync(path.join(root, `index${suffix === 'cn' ? '-cn' : ''}.html`), 'utf8');
  const aboutSection = extractSection(aboutHtml, /<section\b[^>]*class="about-section about-sec-white"[^>]*>/gi);
  const initiative = extractSection(homeHtml, /<section\b[^>]*class="home-programs__initiative"[^>]*>/gi);
  const about = inventory(aboutSection);
  const home = inventory(initiative);
  const aboutTargets = motionTargets(aboutSection);
  const homeTargets = motionTargets(initiative);
  const homeMotion = fs.readFileSync(path.join(root, 'assets/js/home-motion.js'), 'utf8');
  const sharedMotion = fs.readFileSync(path.join(root, 'assets/js/editorial-section-motion.js'), 'utf8');

  assert.equal(about.headings, 1, `${language}: About solution section should have one heading`);
  assert.equal(about.paragraphs, 2, `${language}: About solution section should retain its two-paragraph long-form copy`);
  assert(about.links.some(link => /(?:^|\s)cta(?:\s|$)/.test(link.className)), `${language}: About solution CTA class should remain distinct and explicit`);
  assert.equal(home.headings, 1, `${language}: homepage initiative should have one heading`);
  assert.equal(home.paragraphs, 1, `${language}: homepage initiative should retain its concise single paragraph`);
  assert(home.links.some(link => /(?:^|\s)cta--button(?:\s|$)/.test(link.className)), `${language}: initiative should retain button CTA variant`);
  assert.equal(home.images.length, 1, `${language}: initiative should keep one accent image slot`);
  assert(home.images[0].decorative, `${language}: initiative accent should remain decorative`);
  assert(!about.images.length, `${language}: About solution section currently has no media slot`);
  assert(aboutSection.includes('data-editorial-section') && aboutTargets.length === 1 && aboutTargets[0].className.split(/\s+/).includes('about-content'), `${language}: About solution section should animate its shared content wrapper`);
  assert(initiative.includes('data-editorial-section'), `${language}: homepage initiative should use the shared editorial section root`);
  assert(initiative.includes('class="shell home-programs__initiative-inner editorial-section__content"'), `${language}: initiative should use the shared editorial content wrapper`);
  assert(initiative.includes('class="home-programs__initiative-copy editorial-section__copy"'), `${language}: initiative should use the shared editorial copy wrapper`);
  assert.deepEqual(homeTargets.map(({ tag, delay, effect }) => ({ tag, delay, effect })), [
    { tag: 'h2', delay: '0', effect: null },
    { tag: 'p', delay: '90', effect: null },
    { tag: 'a', delay: '180', effect: 'fade-right' },
    { tag: 'img', delay: '120', effect: 'card-fade' },
  ], `${language}: initiative entrance effects must stay mapped to the matching element and delay`);
  assert(homeTargets.every(target => !target.legacyHomeMotion), `${language}: initiative targets must not be owned by both motion systems`);
  assert.match(initiative, /data-editorial-threshold="0\.42"/);
  assert(sharedMotion.includes("getAttribute('data-editorial-delay')"), `${language}: shared observer must consume authored delay settings`);
  assert(!homeMotion.includes("one('.home-programs__initiative')"), `${language}: homepage initiative should no longer be sequenced by legacy home motion`);
  rows.push({ language, about, initiative: home, currentMotion: { about: 'shared-editorial-observer', initiative: 'shared-editorial-observer' } });
}

process.stdout.write(`${JSON.stringify({ sharedRoles: ['heading', 'body copy', 'CTA intent'], structuralDecision: 'share editorial text slots; keep paragraph density, CTA treatment, and optional decorative media as explicit variants', currentMotion: 'shared observer with data-driven per-section thresholds, per-target delay and effect', rows }, null, 2)}\n`);
