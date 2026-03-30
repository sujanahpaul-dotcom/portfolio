const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               parseInt(process.env.DB_PORT) || 4000,
  database:           process.env.DB_NAME || 'test',
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  waitForConnections: true,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(120) NOT NULL,
        email      VARCHAR(180) NOT NULL,
        message    TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅  MySQL Database connected & table ready');
  } catch (err) {
    console.error('❌  MySQL connection error:', err);
  }
}
initDB();

app.get('/api/health',   (_, res) => res.json({ status: 'ok' }));

app.get('/api/contacts', async (_, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ success: false, error: 'All fields required.' });
  try {
    const [result] = await db.query(
      'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/{*path}', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀  Server on http://localhost:${PORT}`));
