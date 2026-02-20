// ============================================================
// fetch-posters.js
// Run this ONE TIME to fill in missing poster URLs for all movies
// using the TMDB (The Movie Database) API.
//
// HOW TO RUN:
//   cd backend
//   node db/fetch-posters.js
//
// WHAT IT DOES:
//   1. Queries your DB for all movies with no poster_url
//   2. Searches TMDB for each movie by title + year
//   3. Updates the poster_url column in your DB with the real poster
//
// REQUIRES:
//   REACT_APP_TMDB_API_KEY in your frontend/.env
//   Or add TMDB_API_KEY to your backend/.env
// ============================================================

import pool from './db.js';
import dotenv from 'dotenv';

dotenv.config();

// You already have this key in frontend/.env — paste it here or add to backend/.env
const TMDB_API_KEY = process.env.TMDB_API_KEY || '20c115f7b27df617f1b726f30f1d9f2b';
const TMDB_BASE    = 'https://api.themoviedb.org/3';
const TMDB_IMG     = 'https://image.tmdb.org/t/p/w500';

// Helper: fetch with no external deps (Node 18+ has built-in fetch)
const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// Search TMDB for a movie and return poster URL + overview
const getTMDBData = async (title, year) => {
  const encoded = encodeURIComponent(title);
  const yearParam = year ? `&year=${year}` : '';
  const url = `${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encoded}${yearParam}`;

  const data = await fetchJSON(url);
  if (!data.results || data.results.length === 0) return null;

  const movie = data.results[0];
  return {
    poster_url: movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null,
    description: movie.overview || null
  };
};

const run = async () => {
  try {
    console.log('🎬 Fetching posters from TMDB...\n');

    // Get all movies — we'll update both missing posters AND missing descriptions
    const { rows: movies } = await pool.query(
      `SELECT movie_id, title, release_year, poster_url, description FROM movies ORDER BY movie_id`
    );

    console.log(`Found ${movies.length} movies in DB\n`);

    let updated = 0;
    let skipped = 0;
    let failed  = 0;

    for (const movie of movies) {
      const needsPoster = !movie.poster_url;
      const needsDesc   = !movie.description || movie.description.trim() === '';

      if (!needsPoster && !needsDesc) {
        console.log(`⏭  Skipping "${movie.title}" (already has poster + description)`);
        skipped++;
        continue;
      }

      try {
        console.log(`🔍 Searching TMDB for "${movie.title}" (${movie.release_year})...`);
        const data = await getTMDBData(movie.title, movie.release_year);

        if (!data || !data.poster_url) {
          console.log(`   ⚠️  No poster found for "${movie.title}"`);
          failed++;
          continue;
        }

        // Build the UPDATE query dynamically based on what's missing
        if (needsPoster && needsDesc && data.description) {
          await pool.query(
            'UPDATE movies SET poster_url = $1, description = $2 WHERE movie_id = $3',
            [data.poster_url, data.description, movie.movie_id]
          );
          console.log(`   ✅ Updated poster + description`);
        } else if (needsPoster) {
          await pool.query(
            'UPDATE movies SET poster_url = $1 WHERE movie_id = $2',
            [data.poster_url, movie.movie_id]
          );
          console.log(`   ✅ Updated poster`);
        } else if (needsDesc && data.description) {
          await pool.query(
            'UPDATE movies SET description = $1 WHERE movie_id = $2',
            [data.description, movie.movie_id]
          );
          console.log(`   ✅ Updated description`);
        }

        updated++;

        // Wait 250ms between requests — TMDB rate limits to ~40 requests/10s
        await new Promise(r => setTimeout(r, 250));

      } catch (err) {
        console.log(`   ❌ Error for "${movie.title}": ${err.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Done!`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭  Skipped: ${skipped}`);
    console.log(`   ❌ Failed:  ${failed}`);

  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

run();
