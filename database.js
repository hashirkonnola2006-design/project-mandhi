// ==========================================================================
// database.js — JSON file-based database using lowdb (pure JavaScript)
// No native compilation required — works on any platform without Visual Studio.
// Data is stored in mandhi-db.json in the project root.
// ==========================================================================

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'mandhi-db.json')
  : path.join(__dirname, 'mandhi-db.json');
const adapter = new FileSync(DB_PATH);
const db = low(adapter);

// ==================== SCHEMA DEFAULTS ====================
db.defaults({
  waitlist: [],
  spin_rewards: [],
  _meta: {
    next_waitlist_id: 1,
    next_reward_id: 1,
  }
}).write();

// ==================== SEED DATA ====================
// Only seed if the waitlist is completely empty (first run)
if (db.get('waitlist').value().length === 0) {
  const seedData = [
    { name: 'Rahul Sharma',  phone: '+91 98765 00001', email: 'rahul@example.com',  party_size: 4 },
    { name: 'Priya Verma',   phone: '+91 98765 00002', email: 'priya@example.com',  party_size: 3 },
    { name: 'Amit Patel',    phone: '+91 98765 00003', email: 'amit@example.com',   party_size: 2 },
    { name: 'Sneha Iyer',    phone: '+91 98765 00004', email: 'sneha@example.com',  party_size: 5 },
    { name: 'Karan Mehta',   phone: '+91 98765 00005', email: 'karan@example.com',  party_size: 3 },
    { name: 'Neha Kapoor',   phone: '+91 98765 00006', email: 'neha@example.com',   party_size: 2 },
    { name: 'Vikram Singh',  phone: '+91 98765 00007', email: 'vikram@example.com', party_size: 4 },
  ];

  let nextId = db.get('_meta.next_waitlist_id').value();
  const entries = seedData.map(d => ({
    id: nextId++,
    name: d.name,
    phone: d.phone,
    email: d.email,
    party_size: d.party_size,
    joined_at: new Date().toISOString(),
    status: 'waiting',
  }));

  db.get('waitlist').push(...entries).write();
  db.set('_meta.next_waitlist_id', nextId).write();

  console.log(`[DB] Seeded ${entries.length} initial waitlist entries.`);
}

console.log(`[DB] Database ready at: ${DB_PATH}`);

module.exports = db;
