const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'phone_repair.db');

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
      price REAL,
      price_from REAL,
      price_to REAL,
      duration_minutes INTEGER DEFAULT 60,
      in_stock INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repair_type_id) REFERENCES repair_types(id)
    );
  `);

  // Migrate: add price_from / price_to if upgrading from old schema
  try { db.run(`ALTER TABLE services ADD COLUMN price_from REAL`); } catch (_) {}
  try { db.run(`ALTER TABLE services ADD COLUMN price_to REAL`); } catch (_) {}
  // Make price nullable on existing DBs (SQLite cannot DROP NOT NULL, so we just allow nulls by default)

  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      device_model TEXT NOT NULL,
      service_id INTEGER,
      appointment_date TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      quoted_price REAL,
      conversation_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id)
    );
  `);

  // Migrate: add new appointment columns if upgrading from old schema
  try { db.run(`ALTER TABLE appointments ADD COLUMN quoted_price REAL`); } catch (_) {}
  try { db.run(`ALTER TABLE appointments ADD COLUMN conversation_token TEXT`); } catch (_) {}
  try { db.run(`ALTER TABLE appointments ADD COLUMN assigned_to TEXT`); } catch (_) {}
  try { db.run(`ALTER TABLE appointments ADD COLUMN customer_lang TEXT DEFAULT 'sk'`); } catch (_) {}

  // Migrate: remove NOT NULL constraint from appointment_date if present (old schema)
  try {
    const tableInfo = db.exec(`PRAGMA table_info(appointments)`);
    const cols = tableInfo[0]?.values || [];
    const apptDateCol = cols.find(r => r[1] === 'appointment_date');
    if (apptDateCol && apptDateCol[3] === 1) {
      db.run(`CREATE TABLE appointments_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        device_model TEXT NOT NULL,
        service_id INTEGER,
        appointment_date TEXT,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        quoted_price REAL,
        conversation_token TEXT,
        assigned_to TEXT,
        customer_lang TEXT DEFAULT 'sk',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id)
      )`);
      db.run(`INSERT INTO appointments_v2 (id, customer_name, customer_email, customer_phone, device_model, service_id, appointment_date, notes, status, quoted_price, conversation_token, assigned_to, customer_lang, created_at) SELECT id, customer_name, customer_email, customer_phone, device_model, service_id, appointment_date, notes, status, quoted_price, conversation_token, assigned_to, customer_lang, created_at FROM appointments`);
      db.run(`DROP TABLE appointments`);
      db.run(`ALTER TABLE appointments_v2 RENAME TO appointments`);
    }
  } catch (e) {
    console.error('Migration (appointment_date nullable):', e.message);
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL,
      sender TEXT NOT NULL CHECK(sender IN ('customer','admin')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_name TEXT NOT NULL,
      model_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      min_quantity INTEGER DEFAULT 1,
      unit_price REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    [typeMap['Screen Repair'],       'iPhone 14 Screen Replacement',          'OEM quality screen replacement for iPhone 14',              120, 160, 90, 1],
    [typeMap['Screen Repair'],       'Samsung Galaxy S23 Screen Replacement', 'Original AMOLED screen replacement for Samsung S23',        100, 149, 90, 1],
    [typeMap['Battery Replacement'], 'iPhone 14 Battery Replacement',         'Genuine Apple battery replacement for iPhone 14',            70,  99, 45, 1],
    [typeMap['Battery Replacement'], 'Samsung Galaxy S23 Battery Replacement','OEM battery replacement for Samsung Galaxy S23',             60,  89, 45, 1],
    [typeMap['Water Damage'],        'Water Damage Diagnostic',               'Full diagnostic and cleaning for water damaged devices',     40,  80, 120, 1],
    [typeMap['Software Issues'],     'Software Restore',                      'Full software restore, data backup and recovery',            40,  70, 60, 1],
  ];
  services.forEach(([rtId, name, desc, priceFrom, priceTo, dur, stock]) => {
    db.run(
      'INSERT INTO services (repair_type_id, name, description, price_from, price_to, duration_minutes, in_stock) VALUES (?,?,?,?,?,?,?)',
      [rtId, name, desc, priceFrom, priceTo, dur, stock]
    );
  });

  saveDb();
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return { prepare, exec };
}

module.exports = { initDb, getDb };

