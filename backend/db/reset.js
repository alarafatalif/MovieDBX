// ============================================================
// reset.js — Drops ALL Tables (Nuclear Reset)
// ============================================================
// ⚠️  WARNING: This permanently deletes ALL data and ALL tables.
//     Only use this when you want to start completely fresh.
//
// RUN: node db/reset.js
//
// AFTER RESETTING, you'll need to run:
//   1. node db/setup.js     ← Recreate tables  (reads schema.sql)
//   2. node db/seed.js      ← Re-add all data   (reads seed.sql)
// ============================================================

import pool from './db.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const resetDatabase = async () => {
  try {
    console.log('🗑️  Dropping all tables...');

    const resetPath = join(__dirname, 'reset.sql');
    const resetSQL = fs.readFileSync(resetPath, 'utf8');

    await pool.query(resetSQL);

    console.log('✅ All tables dropped!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
};

resetDatabase();