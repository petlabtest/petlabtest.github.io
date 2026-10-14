import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '/Users/zhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const output = new URL('../../tmp/ra-page-review/', import.meta.url).pathname;
await mkdir(output, { recursive: true });
const base = process.env.PETLAB_TEST_URL || 'http://127.0.0.1:8765/';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const results = [];
try {
  for (const width of [320, 390, 768, 1440, 1512, 1920, 2560, 3440]) for (const lang of ['cn', 'en']) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}People/People-RA-${lang}.html`);
    await page.locator('[data-app-shell="header"][data-app-shell-ready]').waitFor();
    await page.locator('#petlab-footer[data-app-shell-ready]').waitFor();
    const photo = page.locator('.ra-hero__image img');
    await photo.evaluate(i => i.decode());
    await page.locator('.upop-brand img').evaluate(i => i.decode());
    assert.equal(await page.locator('h1').textContent(), lang === 'cn' ? 'RA培养体系' : 'RA Development Framework');
    assert.equal(await page.locator('main section').count(), 5);
    assert.equal(await page.locator('.ra-growth article').count(), 4);
    assert.equal(await page.locator('.ra-values li').count(), 8);
    assert.equal(await page.locator('.header-branding > a').count(), 3);
    assert.match(await page.locator('.upop-brand img').getAttribute('src'), /RA_LOGO-v3\.svg/);
    assert.equal(await page.locator('.ra-intro').count(), 0);
    assert.equal(await page.locator('.ra-section--purpose .ra-prose > .ra-opening__lead').count(), 1);
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      headingsFit: [...document.querySelectorAll('main h1, main h2, main h3')].every(h => h.getBoundingClientRect().right <= innerWidth + 1),
      photoFit: getComputedStyle(document.querySelector('.ra-hero__image img')).objectFit,
      heroImageFillsWidth: (() => {
        const hero = document.querySelector('.ra-hero').getBoundingClientRect();
        const container = document.querySelector('.ra-hero__image').getBoundingClientRect();
        const image = document.querySelector('.ra-hero__image img').getBoundingClientRect();
        return Math.abs(container.left - hero.left) < 1 && Math.abs(container.right - hero.right) < 1
          && Math.abs(image.left - container.left) < 1 && Math.abs(image.right - container.right) < 1
          && Math.abs(image.height - container.height) < 1;
      })(),
      englishContainsChinese: /[\u4e00-\u9fff]/.test(document.querySelector('main').textContent),
    }));
    assert.equal(state.overflow, false, `${lang} ${width}: overflow`);
    assert.equal(state.headingsFit, true);
    assert.equal(state.heroImageFillsWidth, true, `${lang} ${width}: uncovered Hero background`);
    assert.equal(state.photoFit, 'cover');
    if (lang === 'en') assert.equal(state.englishContainsChinese, false);
    assert.equal(errors.length, 0, errors.join('\n'));
    await page.screenshot({ path: `${output}${lang}-${width}.png`, fullPage: true });
    results.push({ lang, width, ...state });
    if (width === 1440) {
      await page.locator('.primary-nav .nav-trigger').nth(2).hover();
      const menuLink = page.locator(`.primary-nav a[href$="People-RA-${lang}.html"]`);
      assert.equal(await menuLink.textContent(), lang === 'cn' ? 'RA培养体系' : 'RA Development Framework');
      await menuLink.click();
      await page.waitForURL(`**/People-RA-${lang}.html`);
      await page.locator('.language-toggle').click();
      await page.waitForURL(`**/People-RA-${lang === 'cn' ? 'en' : 'cn'}.html`);
    }
    await page.close();
  }
  for (const lang of ['cn', 'en']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${base}People/People-UPOP-${lang}.html?source=legacy#ra-review`);
    await page.waitForURL(`**/People-RA-${lang}.html?source=legacy#ra-review`);
    await page.goto(`${base}${lang === 'cn' ? 'index-cn.html' : 'index.html'}`);
    await page.locator('[data-app-shell="header"][data-app-shell-ready]').waitFor();
    const card = page.locator('.group-content__media-overlay').filter({ has: page.locator(`a[href$="People-RA-${lang}.html"]`) });
    assert.equal(await card.locator('h3').textContent(), lang === 'cn' ? 'RA培养体系' : 'RA Development Framework');
    assert.doesNotMatch(await card.textContent(), /UPOP|sophomore|大二/);
    await page.locator('.group-content__media--workplace').hover();
    await card.locator('a').waitFor({ state: 'visible' });
    await page.screenshot({ path: `${output}homepage-${lang}.png` });
    await card.locator('a').click();
    await page.waitForURL(`**/People-RA-${lang}.html`);
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${output}results.json`, JSON.stringify(results, null, 2));
console.log('PASS: 16 bilingual RA layouts up to 3440px; full-width Hero coverage, integrated opening copy, RA logo v3, navigation and redirects.');
