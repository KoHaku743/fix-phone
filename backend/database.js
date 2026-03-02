const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'phone_repair.db');

let db = null;
let SQL = null;

// Persist db to disk
function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.error('Failed to save DB:', e.message);
  }
}

// Convenience wrappers that mimic better-sqlite3 API
function prepare(sql) {
  return {
    all(...params) {
      const stmt = db.prepare(sql);
      const rows = [];
      stmt.bind(params);
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    },
    get(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      let row = null;
      if (stmt.step()) row = stmt.getAsObject();
      stmt.free();
      return row;
    },
    run(...params) {
      db.run(sql, params);
      const changes = db.getRowsModified();
      const lastId  = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] ?? null;
      saveDb();
      return { changes, lastInsertRowid: lastId };
    },
  };
}

function exec(sql) {
  db.run(sql);
  saveDb();
}

async function initDb() {
  if (db) return;
  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  initializeSchema();
}

function initializeSchema() {
  db.run(`PRAGMA journal_mode = WAL;`);

  db.run(`
    CREATE TABLE IF NOT EXISTS repair_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repair_type_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      duration_minutes INTEGER DEFAULT 60,
      in_stock INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repair_type_id) REFERENCES repair_types(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      device_model TEXT NOT NULL,
      service_id INTEGER,
      appointment_date TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id)
    );
  `);

  saveDb();

  // Seed data if empty
  const rows = db.exec('SELECT COUNT(*) as count FROM repair_types');
  const count = rows[0]?.values[0][0] ?? 0;
  if (count === 0) seedData();
}

function seedData() {
  const types = [
    ['Screen Repair',       'Cracked or broken screen replacement'],
    ['Battery Replacement', 'Worn out battery replacement'],
    ['Water Damage',        'Water damage diagnostic and repair'],
    ['Software Issues',     'Software restoration and troubleshooting'],
    ['Other',               'Other repair services'],
  ];
  types.forEach(([name, desc]) => db.run('INSERT INTO repair_types (name, description) VALUES (?, ?)', [name, desc]));

  const rows = db.exec('SELECT id, name FROM repair_types ORDER BY id');
  const typeMap = {};
  rows[0]?.values.forEach(([id, name]) => { typeMap[name] = id; });

  const services = [
    [typeMap['Screen Repair'],       'iPhone 14 Screen Replacement',          'OEM quality screen replacement for iPhone 14',              149, 90, 1],
    [typeMap['Screen Repair'],       'Samsung Galaxy S23 Screen Replacement', 'Original AMOLED screen replacement for Samsung S23',        129, 90, 1],
    [typeMap['Battery Replacement'], 'iPhone 14 Battery Replacement',         'Genuine Apple battery replacement for iPhone 14',            89, 45, 1],
    [typeMap['Battery Replacement'], 'Samsung Galaxy S23 Battery Replacement','OEM battery replacement for Samsung Galaxy S23',             79, 45, 1],
    [typeMap['Water Damage'],        'Water Damage Diagnostic',               'Full diagnostic and cleaning for water damaged devices',     49, 120, 1],
    [typeMap['Software Issues'],     'Software Restore',                      'Full software restore, data backup and recovery',            59, 60, 1],
  ];
  services.forEach(([rtId, name, desc, price, dur, stock]) => {
    db.run(
      'INSERT INTO services (repair_type_id, name, description, price, duration_minutes, in_stock) VALUES (?,?,?,?,?,?)',
      [rtId, name, desc, price, dur, stock]
    );
  });

  saveDb();
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return { prepare, exec };
}

module.exports = { initDb, getDb };

