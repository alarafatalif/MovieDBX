// ============================================================
// reset.js — Drops ALL Tables (Nuclear Reset)
// ============================================================
// ⚠️  WARNING: This permanently deletes ALL data and ALL tables.
//     Only use this when you want to start completely fresh.
//
// RUN: node db/reset.js
//
// AFTER RESETTING, you'll need to run:
//   1. node db/setup.js     ← Recreate tables
//   2. node db/seed.js      ← Re-add sample data
//
// DROP ORDER MATTERS:
//   We drop junction tables FIRST (watchlist, reviews, movie_cast, etc.)
//   because they have FOREIGN KEY references to the main tables.
//   If we tried to drop 'movies' first, PostgreSQL would complain
//   because movie_genres still references it.
//
//   CASCADE → Forces the drop even if other objects depend on it.
//   IF EXISTS → Don't error if the table doesn't exist.
// ============================================================

import pool from './db.js';

const resetDatabase = async () => {
  try {
    console.log('🗑️  Dropping all tables...');
    
    // Drop tables in reverse dependency order:
    // First: junction/child tables (they reference the main tables)
    // Last: main/parent tables (users, movies, genres, etc.)
    await pool.query(`
      DROP TABLE IF EXISTS watchlist CASCADE;
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS movie_cast CASCADE;
      DROP TABLE IF EXISTS movie_directors CASCADE;
      DROP TABLE IF EXISTS movie_genres CASCADE;
      DROP TABLE IF EXISTS movie_writers CASCADE;
      DROP TABLE IF EXISTS actors CASCADE;
      DROP TABLE IF EXISTS directors CASCADE;
      DROP TABLE IF EXISTS writers CASCADE;
      DROP TABLE IF EXISTS genres CASCADE;
      DROP TABLE IF EXISTS movies CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    
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