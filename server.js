// ==========================================================================
// server.js — Express REST API server for Mandhi Website
// Database: lowdb (pure JavaScript JSON file — no compilation required)
// Serves static frontend files + exposes /api endpoints.
// ==========================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// Serve all static files from the project root (index.html, app.js, assets/, etc.)
app.use(express.static(path.join(__dirname)));

// ==================== HELPERS ====================

// (estimateWaitTime removed — wait time is not estimated)

/** Get the next auto-increment ID for a given collection key */
function nextId(metaKey) {
  const id = db.get(`_meta.${metaKey}`).value();
  db.set(`_meta.${metaKey}`, id + 1).write();
  return id;
}

// ==================== QUEUE / WAITLIST ROUTES ====================

/**
 * GET /api/queue
 * Returns the full live queue (only 'waiting' status entries).
 */
app.get('/api/queue', (req, res) => {
  try {
    const queue = db.get('waitlist')
      .filter({ status: 'waiting' })
      .sortBy('id')
      .value();

    const stats = {
      count: queue.length,
      activeTables: 12,
      lastUpdated: new Date().toISOString(),
    };

    res.json({ success: true, queue, stats });
  } catch (err) {
    console.error('[GET /api/queue]', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch queue.' });
  }
});

/**
 * GET /api/queue/status
 * Lightweight endpoint for stats only.
 */
app.get('/api/queue/status', (req, res) => {
  try {
    const count = db.get('waitlist').filter({ status: 'waiting' }).size().value();

    res.json({
      success: true,
      count,
      activeTables: 12,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/queue/status]', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch status.' });
  }
});

/**
 * POST /api/queue/join
 * Adds a new party to the waitlist.
 * Body: { name, phone, email, party_size }
 */
app.post('/api/queue/join', (req, res) => {
  const { name, phone, email, party_size } = req.body;

  // Validation
  if (!name || !phone || !email) {
    return res.status(400).json({ success: false, error: 'name, phone, and email are required.' });
  }

  const size = parseInt(party_size, 10);
  if (isNaN(size) || size < 1 || size > 20) {
    return res.status(400).json({ success: false, error: 'party_size must be a number between 1 and 20.' });
  }

  try {
    const id = nextId('next_waitlist_id');
    const entry = {
      id,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      party_size: size,
      joined_at: new Date().toISOString(),
      status: 'waiting',
    };

    db.get('waitlist').push(entry).write();

    // Position in queue
    const position = db.get('waitlist').filter({ status: 'waiting' }).sortBy('id').value()
      .findIndex(e => e.id === id) + 1;

    res.status(201).json({
      success: true,
      message: `Welcome, ${name}! You've been added to the queue.`,
      entry,
      position,
    });
  } catch (err) {
    console.error('[POST /api/queue/join]', err.message);
    res.status(500).json({ success: false, error: 'Failed to add entry to queue.' });
  }
});

/**
 * POST /api/admin/queue/add
 * Admin-only: Manually add a guest to the queue (no email required).
 * Body: { name, phone, party_size }
 */
app.post('/api/admin/queue/add', (req, res) => {
  const { name, phone, party_size } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'name is required.' });
  }

  const size = parseInt(party_size, 10);
  if (isNaN(size) || size < 1 || size > 50) {
    return res.status(400).json({ success: false, error: 'party_size must be between 1 and 50.' });
  }

  try {
    const id = nextId('next_waitlist_id');
    const entry = {
      id,
      name: name.trim(),
      phone: (phone || '').trim(),
      email: '',
      party_size: size,
      joined_at: new Date().toISOString(),
      status: 'waiting',
    };

    db.get('waitlist').push(entry).write();

    const position = db.get('waitlist').filter({ status: 'waiting' }).sortBy('id').value()
      .findIndex(e => e.id === id) + 1;

    res.status(201).json({
      success: true,
      message: `${name} added to queue by staff.`,
      entry,
      position,
    });
  } catch (err) {
    console.error('[POST /api/admin/queue/add]', err.message);
    res.status(500).json({ success: false, error: 'Failed to add entry.' });
  }
});

/**
 * DELETE /api/admin/queue/clear-all
 * Marks ALL currently 'waiting' entries as 'cancelled' (clears the queue).
 */
app.delete('/api/admin/queue/clear-all', (req, res) => {
  try {
    const waiting = db.get('waitlist').filter({ status: 'waiting' }).value();
    waiting.forEach(entry => {
      db.get('waitlist').find({ id: entry.id }).assign({ status: 'cancelled' }).write();
    });

    res.json({
      success: true,
      message: `Cleared ${waiting.length} entries from the queue.`,
      clearedCount: waiting.length,
    });
  } catch (err) {
    console.error('[DELETE /api/admin/queue/clear-all]', err.message);
    res.status(500).json({ success: false, error: 'Failed to clear queue.' });
  }
});

/**
 * DELETE /api/queue/:id
 * Marks a waitlist entry as 'seated' or 'cancelled' (soft delete).
 * Used by admin panel.
 * Query param: ?action=seated|cancelled  (defaults to 'seated')
 */
app.delete('/api/queue/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { action } = req.query;
  const newStatus = action === 'cancelled' ? 'cancelled' : 'seated';

  try {
    const entry = db.get('waitlist').find({ id }).value();
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Entry not found.' });
    }

    db.get('waitlist').find({ id }).assign({ status: newStatus }).write();

    res.json({
      success: true,
      message: `Entry #${id} marked as ${newStatus}.`,
      id,
      status: newStatus,
    });
  } catch (err) {
    console.error('[DELETE /api/queue/:id]', err.message);
    res.status(500).json({ success: false, error: 'Failed to update entry.' });
  }
});

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/all
 * Returns ALL entries (waiting, seated, cancelled) for admin view.
 */
app.get('/api/admin/all', (req, res) => {
  try {
    const all = db.get('waitlist').sortBy('id').reverse().value();

    const summary = {
      waiting:   all.filter(e => e.status === 'waiting').length,
      seated:    all.filter(e => e.status === 'seated').length,
      cancelled: all.filter(e => e.status === 'cancelled').length,
      total:     all.length,
    };

    res.json({ success: true, entries: all, summary });
  } catch (err) {
    console.error('[GET /api/admin/all]', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch all entries.' });
  }
});

/**
 * DELETE /api/admin/clear
 * Permanently removes all entries with 'seated' or 'cancelled' status.
 */
app.delete('/api/admin/clear', (req, res) => {
  try {
    const before = db.get('waitlist').size().value();
    db.get('waitlist')
      .remove(e => e.status === 'seated' || e.status === 'cancelled')
      .write();
    const after = db.get('waitlist').size().value();
    const deletedCount = before - after;

    res.json({
      success: true,
      message: `Cleared ${deletedCount} completed entries.`,
      deletedCount,
    });
  } catch (err) {
    console.error('[DELETE /api/admin/clear]', err.message);
    res.status(500).json({ success: false, error: 'Failed to clear entries.' });
  }
});

// ==================== SPIN REWARDS ROUTES ====================

/**
 * POST /api/rewards/save
 * Saves a spin wheel reward win.
 * Body: { name, phone, reward }
 */
app.post('/api/rewards/save', (req, res) => {
  const { name, phone, reward } = req.body;
  if (!name || !reward) {
    return res.status(400).json({ success: false, error: 'name and reward are required.' });
  }

  try {
    const id = nextId('next_reward_id');
    const entry = {
      id,
      name: name || 'Anonymous',
      phone: phone || '',
      reward,
      redeemed: false,
      won_at: new Date().toISOString(),
    };

    db.get('spin_rewards').push(entry).write();
    res.status(201).json({ success: true, entry });
  } catch (err) {
    console.error('[POST /api/rewards/save]', err.message);
    res.status(500).json({ success: false, error: 'Failed to save reward.' });
  }
});

/**
 * GET /api/admin/rewards
 * Returns all spin reward records for admin view.
 */
app.get('/api/admin/rewards', (req, res) => {
  try {
    const rewards = db.get('spin_rewards').sortBy('id').reverse().value();
    res.json({ success: true, rewards });
  } catch (err) {
    console.error('[GET /api/admin/rewards]', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch rewards.' });
  }
});

/**
 * POST /api/admin/rewards/:id/redeem
 * Marks a spin reward as redeemed.
 */
app.post('/api/admin/rewards/:id/redeem', (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const reward = db.get('spin_rewards').find({ id }).value();
    if (!reward) {
      return res.status(404).json({ success: false, error: 'Reward not found.' });
    }

    db.get('spin_rewards').find({ id }).assign({ redeemed: true }).write();
    res.json({ success: true, message: `Reward #${id} marked as redeemed.` });
  } catch (err) {
    console.error('[POST /api/admin/rewards/:id/redeem]', err.message);
    res.status(500).json({ success: false, error: 'Failed to redeem reward.' });
  }
});

// ==================== FALLBACK ====================

// Serve admin.html explicitly for /admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve index.html for any other unmatched GET routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== START SERVER ====================
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('');
    console.log('  ╔═══════════════════════════════════════════╗');
    console.log('  ║   🍖  MANDHI SERVER RUNNING  🍖           ║');
    console.log(`  ║   App:    http://localhost:${PORT}             ║`);
    console.log(`  ║   Admin:  http://localhost:${PORT}/admin        ║`);
    console.log('  ╚═══════════════════════════════════════════╝');
    console.log('');
  });
}

module.exports = app;
