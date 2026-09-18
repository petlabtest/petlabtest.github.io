import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve, sep } from 'node:path';

const siteRoot = resolve(import.meta.dirname, '..');
const scriptPath = resolve(siteRoot, 'assets/js/floating-assistant.js');

async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['components', 'tools'].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(path));
    else if (extname(entry.name).toLowerCase() === '.html') files.push(path);
  }
  return files;
}

let changed = 0;
for (const file of await collect(siteRoot)) {
  let html = await readFile(file, 'utf8');
  if (!/<body\b/i.test(html) || /floating-assistant\.js/i.test(html)) continue;
  const source = relative(dirname(file), scriptPath).split(sep).join('/');
  const tag = `  <script src="${source}?v=20260918-9" defer></script>\n`;
  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${tag}</body>`);
  else html += `\n${tag}`;
  await writeFile(file, html);
  changed += 1;
}

console.log(`Installed the floating assistant on ${changed} pages.`);
