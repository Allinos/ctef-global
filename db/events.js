const pool = require('../config/db');

function slugify(title, id) {
  const base = String(title).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return id ? `${base}-${id}` : base;
}

async function listUpcoming(type) {
  const params = [];
  let sql = 'SELECT * FROM events WHERE event_date >= CURDATE()';
  if (type && type !== 'All') { sql += ' AND type = ?'; params.push(type); }
  sql += ' ORDER BY event_date ASC';
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function listPast(limit = 5) {
  const [rows] = await pool.query(
    'SELECT * FROM events WHERE event_date < CURDATE() ORDER BY event_date DESC LIMIT ?',
    [limit]
  );
  return rows;
}

async function listSoonest(limit = 3) {
  const [rows] = await pool.query(
    'SELECT * FROM events WHERE event_date >= CURDATE() ORDER BY event_date ASC LIMIT ?',
    [limit]
  );
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
  return rows[0] || null;
}

async function getBySlug(slug) {
  const [rows] = await pool.query('SELECT * FROM events WHERE slug = ?', [slug]);
  return rows[0] || null;
}

async function listAll(search) {
  const params = [];
  let sql = 'SELECT * FROM events';
  if (search) { sql += ' WHERE title LIKE ?'; params.push(`%${search}%`); }
  sql += ' ORDER BY event_date DESC';
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO events (type, title, slug, event_date, event_time, place, image, seats, description, fee, outcome_note)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [data.type, data.title, slugify(data.title), data.event_date, data.event_time, data.place,
      data.image || null, data.seats || 0, data.description || '', data.fee || '', data.outcome_note || null]
  );
  const id = result.insertId;
  await pool.query('UPDATE events SET slug = ? WHERE id = ?', [slugify(data.title, id), id]);
  return id;
}

async function update(id, data) {
  const fields = ['type', 'title', 'event_date', 'event_time', 'place', 'seats', 'description', 'fee', 'outcome_note'];
  const sets = fields.map((f) => `${f} = ?`);
  const values = fields.map((f) => data[f]);
  if (data.image) { sets.push('image = ?'); values.push(data.image); }
  sets.push('slug = ?'); values.push(slugify(data.title, id));
  values.push(id);
  await pool.query(`UPDATE events SET ${sets.join(', ')} WHERE id = ?`, values);
}

async function remove(id) {
  await pool.query('DELETE FROM events WHERE id = ?', [id]);
}

module.exports = { listUpcoming, listPast, listSoonest, getById, getBySlug, listAll, create, update, remove, slugify };
