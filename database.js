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

console.log(`[DB] Database ready at: ${DB_PATH}`);

module.exports = db;
