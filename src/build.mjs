// Static site generator for Indigo Sapat Primary (Indigo Academy).
// Usage: node src/build.mjs   →   writes the site to ./docs (served by GitHub Pages from main /docs)
//        add --preview to also write docs/preview.html for the Claude artifact preview
// The admin panel (/admin/) runs the same templates (src/site.mjs) in the browser and commits docs/ itself.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite } from './site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'docs');

const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'content', f), 'utf8'));
const content = Object.fromEntries(['ky', 'ru', 'en', 'site', 'staff', 'menu', 'news', 'images'].map((k) => [k, read(`${k}.json`)]));
const out = buildSite(content, { preview: process.argv.includes('--preview') });

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), { recursive: true });
fs.cpSync(path.join(ROOT, 'admin'), path.join(DIST, 'admin'), { recursive: true });
// The panel loads the templates from admin/lib/
fs.mkdirSync(path.join(DIST, 'admin', 'lib'), { recursive: true });
for (const f of ['site.mjs', 'icons.mjs']) fs.copyFileSync(path.join(ROOT, 'src', f), path.join(DIST, 'admin', 'lib', f));
for (const [rel, text] of Object.entries(out.files)) {
  fs.mkdirSync(path.dirname(path.join(DIST, rel)), { recursive: true });
  fs.writeFileSync(path.join(DIST, rel), text);
}
fs.mkdirSync(path.join(ROOT, 'server'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'server', 'knowledge.json'), out.knowledge);
console.log(`Built ${out.pages} pages in ${out.langs} languages → ${path.relative(ROOT, DIST)}/`);
