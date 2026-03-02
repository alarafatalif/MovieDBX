// ============================================================
// seed.js — Populates the Database with ALL Sample Data
// ============================================================
// RUN THIS AFTER setup.js:
//   node db/seed.js
//
// WHAT IT DOES:
//   Reads seed.sql and executes it. That single SQL file contains:
//     - 14 genres
//     - 54 movies + 15 series (with posters, trailers, Netflix URLs)
//     - Movie-genre relationships
//     - Cast, directors, and writers (persons table)
//     - Test users + reviewer accounts
//     - Reviews for movies and series
//
// This replaces ALL the old individual JS scripts:
//   seed.js, movie-manager.js, add-series.js, add-posters.js,
//   add-trailers.js, add-netflix.js, add-crew.js, add-users.js,
//   add-posters-reviews.js, update-series.js, fix-ratings.js
//
// SAFE TO RE-RUN:
//   Uses ON CONFLICT DO NOTHING where applicable.
//
// ORDER OF OPERATIONS FOR A FRESH PROJECT:
//   1. node db/reset.js    ← Drop all tables
//   2. node db/setup.js    ← Create tables (reads schema.sql)
//   3. node db/seed.js     ← Add all data (reads seed.sql) ← THIS FILE
// ============================================================

import pool from './db.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    const seedPath = join(__dirname, 'dataInsertion.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    await pool.query(seedSQL);

    console.log('✅ All data inserted (genres, movies, series, crew, users, reviews)');
    console.log('🎉 Database seeding complete!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    await pool.end();
    process.exit(1);
  }
};

seedDatabase();