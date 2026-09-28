const pool = require('../config/db');

async function listAll({ category, q } = {}) {
  const params = [];
  let sql = 'SELECT * FROM news WHERE 1=1';
  if (category && category !== 'All') { sql += ' AND category = ?'; params.push(category); }
  if (q) { sql += ' AND (title LIKE ? OR body LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY published_date DESC';
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function listRecent(limit = 3) {
  const [rows] = await pool.query('SELECT * FROM news ORDER BY published_date DESC LIMIT ?', [limit]);
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM news WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create(data) {
  const [result] = await pool.query(
    'INSERT INTO news (category, title, body, link, published_date) VALUES (?,?,?,?,?)',
    [data.category, data.title, data.body || '', data.link || null, data.published_date]
  );
  return result.insertId;
}

async function update(id, data) {
  await pool.query(
    'UPDATE news SET category = ?, title = ?, body = ?, link = ?, published_date = ? WHERE id = ?',
    [data.category, data.title, data.body || '', data.link || null, data.published_date, id]
  );
}

async function remove(id) {
  await pool.query('DELETE FROM news WHERE id = ?', [id]);
}

module.exports = { listAll, listRecent, getById, create, update, remove };
