# CTEF Global

Node.js / Express / EJS / MySQL website for CTEF Global (Council for Teacher
Education Foundation). Events, the Journal (issues, articles, newsletters),
Gallery photos, and News & Announcements are stored in MySQL and managed from
an admin panel. Everything else (Home, About, Membership, Stakeholders,
Chapters, Contact) is static content rendered by EJS, carried over from the
original site.

This app replaces the original single-file static site (`index.html`, kept in
the repo as a reference — it's no longer served).

## Stack

Express, EJS, MySQL (`mysql2`), `express-session`, `bcryptjs`, `multer` for
image uploads. No ORM — small hand-written query modules in `db/`.

## Project layout

```
server.js                  Express app entry point
config/db.js                mysql2 connection pool
db/schema.sql                table definitions
db/migrate.js                 applies schema.sql
db/seed.js                     migrates legacy content + creates the admin user
db/*.js                          query modules (events, gallery, news, journal, admin)
middleware/                  requireAdmin, upload (multer), flash messages
routes/                       public routes (events, journal, news, gallery, misc pages)
routes/admin*                  admin auth + CRUD routes per content type
views/                        EJS templates (public pages + views/admin/*)
public/css, public/js          site + admin stylesheets/scripts
public/images/legacy            images migrated from the original static site
public/uploads/<type>            images uploaded from the admin panel
data/legacy-content.json       one-time dump of the original site's content
data/static.js                   non-DB content (boards, life members, chapters, etc.)
scripts/extract-legacy.js      the one-off script that produced the two files above
scripts/smoke-render.js        renders every EJS view with sample data (no DB needed)
```

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Configure environment** — copy `.env.example` to `.env` and fill in your
   MySQL credentials and a session secret:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your-password
   DB_NAME=ctef_global
   SESSION_SECRET=some-long-random-string
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=choose-a-strong-password
   ```
   `ADMIN_USERNAME`/`ADMIN_PASSWORD` are only used once, by the seed script,
   to create the admin account (the password is hashed with bcrypt before
   being stored — it isn't kept in the database in plain text).

3. **Create the database schema**
   ```
   npm run db:migrate
   ```
   This connects to MySQL and runs `db/schema.sql`, which creates the
   `ctef_global` database and all tables if they don't already exist.

4. **Seed initial content**
   ```
   npm run db:seed
   ```
   Populates events, gallery photos, news, journal issues/articles, and
   newsletters from `data/legacy-content.json` (the original site's content),
   and creates the admin user from your `.env`. Safe to re-run — each step
   skips itself if that table already has rows.

5. **Run the app**
   ```
   npm run dev     # nodemon, auto-restarts on file changes
   # or
   npm start
   ```
   Visit `http://localhost:3000`. Admin panel: `http://localhost:3000/admin/login`.

## Verifying it works

- Public pages: Home, Events, Journal, News, Gallery should show the seeded
  content and look like the original site.
- Log in at `/admin/login` with the `ADMIN_USERNAME`/`ADMIN_PASSWORD` from
  your `.env`.
- From the admin dashboard, create/edit/delete an event, a gallery photo, a
  news item, and a journal issue — each change should appear immediately on
  the matching public page.
- Visiting any `/admin/*` route while logged out redirects to `/admin/login`.

## Notes on scope

- Only **Events, Journal, Gallery, and News & Announcements** are database-backed
  and admin-editable, per the original request. Home, About, Membership,
  Stakeholders/Boards, Life Members, Institutional Members, Chapters, and
  Contact remain static content (in `data/static.js` and the EJS templates
  directly) — not editable from the admin panel.
- Membership applications, event registration, the paper-submission form, and
  newsletter sign-up are **not persisted** — they show a confirmation message
  only, the same demo behaviour as the original static site. Wire these up to
  real storage/email later if needed.
- `scripts/extract-legacy.js` is a one-off migration tool; you shouldn't need
  to run it again unless `index.html` changes and you want to re-derive
  `data/legacy-content.json` and `public/images/legacy/`.
