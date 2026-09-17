import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';

const siteRoot = resolve(import.meta.dirname, '..');
const excludedDirectories = new Set(['components', 'tools']);
const excludedFiles = new Set(['search.html', 'search-cn.html']);

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || excludedDirectories.has(entry.name)) continue;
    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(fullPath));
    else if (extname(entry.name).toLowerCase() === '.html') files.push(fullPath);
  }
  return files;
}

function text(value = '') {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const records = [];
for (const file of await collect(siteRoot)) {
  const url = relative(siteRoot, file).split(sep).join('/');
  if (excludedFiles.has(url) || /(?:template|\.bak)\.html$/i.test(url)) continue;
  const html = await readFile(file, 'utf8');
  const lang = /-cn\.html$/i.test(url) || /<html[^>]+lang=["']zh/i.test(html) ? 'zh' : 'en';
  const rawTitle = text(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const title = rawTitle.replace(/\s*[|｜–—-]\s*(?:数字PET实验室|Digital PET Laboratory|DPETLab).*$/i, '').trim();
  const heading = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  const description = text(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || '');
  const label = title || heading || url.split('/').pop().replace(/\.html$/i, '');
  records.push({ lang, title: label, url, text: `${label} ${heading} ${description}`.trim() });
}

records.sort((a, b) => a.lang.localeCompare(b.lang) || a.title.localeCompare(b.title, a.lang === 'zh' ? 'zh-CN' : 'en'));
await writeFile(resolve(siteRoot, 'assets/data/search-index.json'), `${JSON.stringify(records, null, 2)}\n`);
console.log(`Wrote ${records.length} search records.`);
