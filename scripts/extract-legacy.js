/*
 * One-off migration helper. Reads the original static index.html, evaluates the
 * plain-data portion of its inline <script> (the const IMG/EVENTS/GALLERY/...
 * declarations, before any DOM code runs), decodes every embedded base64 image
 * to a real file under public/images/legacy/, and writes a single resolved JSON
 * dump to data/legacy-content.json for db/seed.js and the static routes to read.
 *
 * Safe to re-run; it overwrites its own output deterministically.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SRC_HTML = path.join(ROOT, 'index.html');
const IMG_DIR = path.join(ROOT, 'public', 'images', 'legacy');
const OUT_JSON = path.join(ROOT, 'data', 'legacy-content.json');

fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });

const html = fs.readFileSync(SRC_HTML, 'utf8');

const EXT_BY_MIME = { jpeg: 'jpg', jpg: 'jpg', png: 'png', webp: 'webp', gif: 'gif', svg: 'svg' };

function saveDataUri(dataUri, baseName) {
  const match = /^data:image\/([a-zA-Z+]+);base64,(.+)$/.exec(dataUri);
  if (!match) return null;
  const ext = EXT_BY_MIME[match[1].toLowerCase()] || 'jpg';
  const fileName = `${baseName}.${ext}`;
  const filePath = path.join(IMG_DIR, fileName);
  fs.writeFileSync(filePath, Buffer.from(match[2], 'base64'));
  return `/images/legacy/${fileName}`;
}

/* ---- 1. Extract the pure-data slice of the inline script (no DOM calls) ---- */
const startMarker = 'const IMG = {';
const endMarker = '/* ================= UI HELPERS ================= */';
const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker, startIdx);
if (startIdx === -1 || endIdx === -1) {
  throw new Error('Could not locate data block markers in index.html — has the file changed?');
}
const dataSrc = html.slice(startIdx, endIdx);

const extracted = new Function(
  `${dataSrc}\nreturn {IMG,EVENTS,PAST,GALLERY,NEWS,NEWSLETTERS,ISSUES,ARTICLES,CHAPTERS,BOARDS,LIFE,INST,PLANS,BENEFITS,OBJECTIVES,STATES};`
)();

/* ---- 2. Save every keyed IMG entry to disk, keep a key -> path map ---- */
const keyFile = {};
for (const [key, dataUri] of Object.entries(extracted.IMG)) {
  keyFile[key] = saveDataUri(dataUri, key);
}
const reverseByDataUri = Object.fromEntries(
  Object.entries(extracted.IMG).map(([key, dataUri]) => [dataUri, key])
);
const pathForDataUri = (dataUri) => {
  if (!dataUri) return null;
  const key = reverseByDataUri[dataUri];
  return key ? keyFile[key] : null;
};

/* ---- 3. Resolve each dataset's image references to real file paths ---- */
const events = extracted.EVENTS.map((e) => ({ ...e, image: keyFile[e.img] || null }));
const past = extracted.PAST.map(([date, title, place, note]) => ({ date, title, place, note }));
const gallery = extracted.GALLERY.map((g) => ({ ...g, src: pathForDataUri(g.src) }));
const news = extracted.NEWS;
const newsletters = extracted.NEWSLETTERS.map(([title, date, highlights]) => ({ title, date, highlights }));
const issues = extracted.ISSUES.map(([key, volume, issueNo, year, theme]) => ({
  key, volume, issueNo, year, theme, cover: keyFile[key] || null,
}));
const articles = extracted.ARTICLES.map(([title, authors, abstract]) => ({ title, authors, abstract }));
const chapters = extracted.CHAPTERS.map((c) => ({ ...c, img: pathForDataUri(c.img) }));
const boards = extracted.BOARDS.map((b) => ({
  ...b,
  people: b.people.map((p) => ({ ...p, img: pathForDataUri(p.img) })),
}));
const life = extracted.LIFE.map((m) => ({ ...m, img: pathForDataUri(m.img) }));

/* ---- 4. Extract the standalone inline <img> base64s that live in the body
   markup (logo, hero photo, founder photo, mosaic photos, QR codes) — these are
   not part of the IMG map. Dedupe identical payloads by content hash so a logo
   reused in the header and footer only gets written once. ---- */
const bodyHtml = html.slice(0, startIdx);
const inlineRegex = /<img[^>]*\ssrc="(data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+)"[^>]*>/g;
const seenHashes = new Map();
const inlineReport = [];
let m;
while ((m = inlineRegex.exec(bodyHtml))) {
  const dataUri = m[1];
  const hash = crypto.createHash('sha1').update(dataUri).digest('hex').slice(0, 10);
  let file = seenHashes.get(hash);
  if (!file) {
    file = saveDataUri(dataUri, `site-${hash}`);
    seenHashes.set(hash, file);
  }
  const contextStart = Math.max(0, m.index - 120);
  const context = bodyHtml.slice(contextStart, m.index).replace(/\s+/g, ' ').slice(-100);
  inlineReport.push({ context, file });
}

/* ---- 5. Write combined JSON dump ---- */
const dump = {
  events, past, gallery, news, newsletters, issues, articles,
  chapters, boards, life, inst: extracted.INST, plans: extracted.PLANS,
  benefits: extracted.BENEFITS, objectives: extracted.OBJECTIVES, states: extracted.STATES,
};
fs.writeFileSync(OUT_JSON, JSON.stringify(dump, null, 2));

console.log(`Wrote ${Object.keys(keyFile).length} keyed images + ${seenHashes.size} inline images to public/images/legacy/`);
console.log(`Wrote data dump to ${path.relative(ROOT, OUT_JSON)}`);
console.log('\nInline standalone image contexts (use these to wire up static templates):');
for (const { context, file } of inlineReport) {
  console.log(`  ...${context}  ->  ${file}`);
}
