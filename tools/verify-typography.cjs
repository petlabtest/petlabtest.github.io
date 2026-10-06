const { chromium } = require('playwright');

const base = process.env.DPET_BASE_URL || 'http://127.0.0.1:4173';
const defaultPages = [
  'index-cn.html', 'index.html',
  'About/About-PengXiao-cn.html', 'About/About-leadership-en.html',
  'Research/Research-ov-cn.html', 'Research/Research-Physics-Page1-en.html',
  'People/People-ov-cn.html', 'Engage/Engage-Contact-cn.html',
  'Capabilities/Capabilities-ov-en.html', 'Giving/Giving-giving-cn.html',
  'News/News-ov-cn.html', 'News/List/News-page1-en.html',
  'search-cn.html', 'search.html',
];
const pages = process.env.DPET_PAGES ? process.env.DPET_PAGES.split(',') : defaultPages;
const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];

async function inspect(browser, browserName, pagePath, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const failures = [];
  page.on('requestfailed', request => {
    if (request.url().startsWith(base)) failures.push(`${request.url()}: ${request.failure()?.errorText}`);
  });
  page.on('response', response => {
    if (response.status() >= 400 && /\.(?:css|woff2?|ttf)(?:\?|$)/.test(response.url())) {
      failures.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.goto(`${base}/${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  const result = await page.evaluate(() => {
    const names = ['body', 'main h1', 'main h2', 'main p', 'main a', 'main input', 'main button'];
    const text = {};
    for (const selector of names) {
      const element = [...document.querySelectorAll(selector)].find(el => el.getClientRects().length && el.textContent.trim())
        || [...document.querySelectorAll(selector)].find(el => el.getClientRects().length);
      if (!element) continue;
      const style = getComputedStyle(element);
      text[selector] = {
        sample: (element.value || element.textContent || '').trim().slice(0, 36),
        family: style.fontFamily,
        size: style.fontSize,
        weight: style.fontWeight,
      };
    }
    return {
      title: document.title,
      lang: document.documentElement.lang,
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      text,
      fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family}:${f.weight}`),
    };
  });
  if (process.env.DPET_SCREENSHOTS && browserName === 'Chrome') {
    const safeName = pagePath.replaceAll('/', '-').replace('.html', '');
    await page.screenshot({ path: `/private/tmp/dpet-${safeName}-${viewport.width}.png`, fullPage: true });
  }
  await page.close();
  return { browser: browserName, page: pagePath, ...result, failures };
}

(async () => {
  const browsers = [
    ['Chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
    ['Edge', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
  ];
  let failed = false;
  for (const [name, executablePath] of browsers) {
    const browser = await chromium.launch({ executablePath, headless: true });
    for (const pagePath of pages) {
      for (const viewport of viewports) {
        try {
          const result = await inspect(browser, name, pagePath, viewport);
          console.log(JSON.stringify(result));
          if (result.failures.length) failed = true;
        } catch (error) {
          console.log(JSON.stringify({ browser: name, page: pagePath, viewport: viewport.width, error: error.message }));
          failed = true;
        }
      }
    }
    await browser.close();
  }
  if (failed) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
