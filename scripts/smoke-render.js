/* Renders every EJS view with representative fake data, bypassing Express/MySQL,
 * to catch template errors (typos, undefined refs, bad tags) before a real DB
 * is available to test against end-to-end. */
const path = require('path');
const ejs = require('ejs');
const staticData = require('../data/static');

const VIEWS = path.join(__dirname, '..', 'views');

const helpers = {
  icon: (name, cls) => `<svg class="${cls || ''}"><use href="#i-${name}"/></svg>`,
  fmtDate: (iso, opt) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', opt || { day: 'numeric', month: 'short', year: 'numeric' }),
  bio: (name, focus) => `${name} bio focus ${focus}`,
  initials: (name) => (name || '').split(' ').map((w) => w[0]).join('').toUpperCase(),
  flash: null,
};

const sampleEvent = {
  id: 1, type: 'Workshop', title: 'Sample Workshop', slug: 'sample-workshop',
  event_date: '2026-10-10', event_time: '10:00 AM', place: 'Guwahati, Assam',
  image: '/images/legacy/ev1.jpg', seats: 60, description: 'Desc', fee: 'Free', outcome_note: null,
};
const samplePast = { ...sampleEvent, event_date: '2025-01-01', outcome_note: '42 honoured' };
const sampleNews = { id: 1, category: 'Announcement', title: 'Sample news', body: 'Body text', link: '/events', published_date: '2026-09-15' };
const sampleGalleryImg = { id: 1, image: '/images/legacy/gal0.jpg', caption: 'Caption', category: 'Workshops', sort_order: 0 };
const sampleIssue = {
  id: 1, volume: 'Volume 02', issue_no: 'Issue 01', year: 2025, theme: 'Theme text',
  cover_image: '/images/legacy/journal-latest-cover.jpg', issn: '3048-XXXX', published_date: '2025-05-01',
  language: 'English', pages: '120+',
};
const sampleArticle = { id: 1, title: 'Article title', authors: 'Author A', abstract: 'Abstract text' };
const sampleNewsletter = { id: 1, title: 'September 2026', published_date: '2026-09-20', highlights: 'Point one\nPoint two' };

const cases = [
  ['home', { title: 'Home', activeNav: 'home', events: [sampleEvent], news: [sampleNews] }],
  ['about', { title: 'About', activeNav: 'about', objectives: staticData.objectives }],
  ['stakeholders', { title: 'Stakeholders', activeNav: 'stakeholders', boards: staticData.boards, life: staticData.life, inst: staticData.inst, states: staticData.states }],
  ['membership', { title: 'Membership', activeNav: 'membership', plans: staticData.plans, benefits: staticData.benefits, states: staticData.states }],
  ['chapters', { title: 'Chapters', activeNav: 'chapters', chapters: staticData.chapters }],
  ['contact', { title: 'Contact', activeNav: 'contact' }],
  ['404', { title: '404', activeNav: '' }],
  ['events/index', { title: 'Events', activeNav: 'events', upcoming: [sampleEvent], past: [samplePast], gallery: [sampleGalleryImg], type: 'All' }],
  ['events/detail', { title: 'Event', activeNav: 'events', event: sampleEvent }],
  ['journal/index', { title: 'Journal', activeNav: 'journal', latest: sampleIssue, articles: [sampleArticle], previous: [sampleIssue], newsletters: [sampleNewsletter] }],
  ['journal/issue', { title: 'Issue', activeNav: 'journal', issue: sampleIssue, articles: [sampleArticle] }],
  ['journal/newsletter', { title: 'Newsletter', activeNav: 'journal', newsletter: sampleNewsletter }],
  ['news/index', { title: 'News', activeNav: 'news', list: [sampleNews], category: 'All', q: '' }],
  ['gallery/index', { title: 'Gallery', activeNav: 'gallery', images: [sampleGalleryImg], categories: ['Workshops'], category: 'All' }],
  ['admin/login', { title: 'Admin login', error: null }],
  ['admin/dashboard', { title: 'Dashboard', counts: { events: 1, gallery: 1, news: 1, issues: 1, newsletters: 1 }, adminUsername: 'admin', flash: null }],
  ['admin/events/list', { title: 'Events', events: [sampleEvent], search: '', adminUsername: 'admin', flash: null }],
  ['admin/events/form', { title: 'Event form', event: sampleEvent, errors: {}, adminUsername: 'admin', flash: null }],
  ['admin/events/form', { title: 'Event form (new)', event: {}, errors: { title: 'Required' }, adminUsername: 'admin', flash: null }],
  ['admin/gallery/list', { title: 'Gallery', images: [sampleGalleryImg], adminUsername: 'admin', flash: null }],
  ['admin/gallery/form', { title: 'Gallery form', image: sampleGalleryImg, errors: {}, adminUsername: 'admin', flash: null }],
  ['admin/news/list', { title: 'News', list: [sampleNews], adminUsername: 'admin', flash: null }],
  ['admin/news/form', { title: 'News form', item: sampleNews, errors: {}, adminUsername: 'admin', flash: null }],
  ['admin/journal/issues', { title: 'Issues', issues: [sampleIssue], adminUsername: 'admin', flash: null }],
  ['admin/journal/issue-form', { title: 'Issue form', issue: sampleIssue, articles: [sampleArticle], errors: {}, adminUsername: 'admin', flash: null }],
  ['admin/journal/newsletters', { title: 'Newsletters', newsletters: [sampleNewsletter], adminUsername: 'admin', flash: null }],
  ['admin/journal/newsletter-form', { title: 'Newsletter form', newsletter: sampleNewsletter, errors: {}, adminUsername: 'admin', flash: null }],
];

let failed = 0;
(async () => {
  for (const [view, locals] of cases) {
    const file = path.join(VIEWS, `${view}.ejs`);
    try {
      await ejs.renderFile(file, { ...helpers, ...locals });
      console.log(`OK   ${view}`);
    } catch (err) {
      failed++;
      console.error(`FAIL ${view}: ${err.message}`);
    }
  }
  console.log(failed ? `\n${failed} view(s) failed.` : '\nAll views rendered successfully.');
  process.exit(failed ? 1 : 0);
})();
