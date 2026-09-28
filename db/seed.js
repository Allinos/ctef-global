require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const legacy = require('../data/legacy-content.json');
const eventsDb = require('./events');
const galleryDb = require('./gallery');
const newsDb = require('./news');
const journalDb = require('./journal');
const adminDb = require('./admin');

async function seedEvents() {
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM events');
  if (n > 0) { console.log('events already seeded, skipping'); return; }
  for (const e of legacy.events) {
    await eventsDb.create({
      type: e.type,
      title: e.title,
      event_date: e.date,
      event_time: e.time,
      place: e.place,
      image: e.image,
      seats: e.seats,
      description: e.desc,
      fee: e.fee,
      outcome_note: null,
    });
  }
  for (const p of legacy.past) {
    // Represent legacy "past highlight" entries as completed events too, so the
    // admin manages a single Events list (upcoming/past is derived from date).
    await eventsDb.create({
      type: 'Workshop',
      title: p.title,
      event_date: p.date,
      event_time: '',
      place: p.place,
      image: null,
      seats: 0,
      description: '',
      fee: '',
      outcome_note: p.note,
    });
  }
  console.log(`seeded ${legacy.events.length + legacy.past.length} events`);
}

async function seedGallery() {
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM gallery_images');
  if (n > 0) { console.log('gallery already seeded, skipping'); return; }
  let order = 0;
  for (const g of legacy.gallery) {
    await galleryDb.create({ image: g.src, caption: g.cap, category: g.cat, sort_order: order++ });
  }
  console.log(`seeded ${legacy.gallery.length} gallery images`);
}

function mapLegacyLink(link) {
  if (!link) return null;
  const clean = link.replace(/^#/, '');
  if (clean === '/journal/submit') return '/journal#submit';
  return clean || '/';
}

async function seedNews() {
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM news');
  if (n > 0) { console.log('news already seeded, skipping'); return; }
  for (const item of legacy.news) {
    await newsDb.create({
      category: item.cat,
      title: item.t,
      body: item.b,
      link: mapLegacyLink(item.link),
      published_date: item.d,
    });
  }
  console.log(`seeded ${legacy.news.length} news items`);
}

async function seedJournal() {
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM journal_issues');
  if (n > 0) { console.log('journal already seeded, skipping'); return; }

  const latestId = await journalDb.createIssue({
    volume: 'Volume 02',
    issue_no: 'Issue 01',
    year: 2025,
    theme: 'Innovative teaching practice, educational leadership, policy perspectives and classroom research',
    cover_image: '/images/legacy/journal-latest-cover.jpg',
    issn: '3048-XXXX',
    published_date: '2025-05-01',
    language: 'English',
    pages: '120+',
  });
  await journalDb.replaceArticles(latestId, legacy.articles.map((a) => ({
    title: a.title, authors: a.authors, abstract: a.abstract,
  })));

  for (const issue of legacy.issues) {
    await journalDb.createIssue({
      volume: issue.volume,
      issue_no: issue.issueNo,
      year: Number(issue.year),
      theme: issue.theme,
      cover_image: issue.cover,
      issn: '',
      published_date: `${issue.year}-01-01`,
      language: 'English',
      pages: '',
    });
  }
  console.log(`seeded ${legacy.issues.length + 1} journal issues`);

  const [[{ n: nlCount }]] = await pool.query('SELECT COUNT(*) AS n FROM newsletters');
  if (nlCount === 0) {
    for (const nl of legacy.newsletters) {
      await journalDb.createNewsletter({
        title: nl.title,
        published_date: nl.date,
        highlights: nl.highlights.join('\n'),
      });
    }
    console.log(`seeded ${legacy.newsletters.length} newsletters`);
  }
}

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.warn('ADMIN_PASSWORD not set in .env — skipping admin user creation.');
    return;
  }
  const existing = await adminDb.findByUsername(username);
  if (existing) { console.log(`admin user "${username}" already exists, skipping`); return; }
  const hash = await bcrypt.hash(password, 10);
  await adminDb.create(username, hash);
  console.log(`created admin user "${username}"`);
}

async function main() {
  await seedEvents();
  await seedGallery();
  await seedNews();
  await seedJournal();
  await seedAdmin();
  await pool.end();
  console.log('Seed complete.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
