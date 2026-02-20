// ============================================================
// watchlist.controller.js — Watchlist Business Logic
// ============================================================
// Manages the user's personal movie watchlist.
//
// THE WATCHLIST TABLE:
//   watchlist(user_id, movie_id, added_at, watched)
//   PRIMARY KEY (user_id, movie_id) ← Composite key
//
// WHAT IS A COMPOSITE PRIMARY KEY?
//   It means the COMBINATION of user_id + movie_id must be unique.
//   So:
//     User 1 + Movie 5 → allowed (one entry)
//     User 1 + Movie 5 → NOT allowed again (duplicate!)
//     User 2 + Movie 5 → allowed (different user)
//   This prevents a user from adding the same movie twice.
//
// OPERATIONS:
//   addToWatchlist   → Add a movie to the user's watchlist
//   getUserWatchlist → Get all movies in a user's watchlist
//   removeFromWatchlist → Remove a movie from watchlist
//   checkWatchlist   → Check if a specific movie is in the watchlist
//   toggleWatched    → Mark a movie as watched/unwatched
// ============================================================

import pool from '../db/db.js';

// ============================================================
// POST /api/watchlist → Add Movie to Watchlist
// ============================================================
// Inserts a new row into the watchlist table.
// If the movie is already in the watchlist, PostgreSQL throws error 23505
// (unique_violation) which we catch and return a friendly message.
//
// REQUEST BODY: { user_id: 1, movie_id: 5 }
// ============================================================
export const addToWatchlist = async (req, res) => {
  try {
    const { user_id, movie_id } = req.body;

    // Validate required fields
    if (!user_id || !movie_id) {
      return res.status(400).json({ error: 'user_id and movie_id are required' });
    }

    // Verify the movie actually exists in the database
    const movieCheck = await pool.query(
      'SELECT movie_id FROM movies WHERE movie_id = $1',
      [movie_id]
    );

    if (movieCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Insert into watchlist — RETURNING * gives us back the inserted row
    const result = await pool.query(
      'INSERT INTO watchlist (user_id, movie_id) VALUES ($1, $2) RETURNING *',
      [user_id, movie_id]
    );

    res.status(201).json({
      message: 'Movie added to watchlist',
      watchlist: result.rows[0]
    });
  } catch (error) {
    // Error code 23505 = unique_violation (movie already in watchlist)
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Movie already in watchlist' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/watchlist/:userId → Get User's Watchlist
// ============================================================
// Returns all movies in a user's watchlist with full movie details
// and their genres (aggregated into an array).
//
// SQL JOINS CHAIN:
//   watchlist → movies (to get movie details)
//   movies → movie_genres → genres (to get genre names)
//
// ARRAY_AGG groups multiple genre rows per movie into a single array:
//   Without it: Movie appears once per genre (3 genres = 3 rows)
//   With it:    Movie appears once, genres = ['Action', 'Crime', 'Drama']
// ============================================================
export const getUserWatchlist = async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT m.*, w.added_at, w.watched,
        ARRAY_AGG(DISTINCT g.genre_name) FILTER (WHERE g.genre_name IS NOT NULL) AS genres
      FROM watchlist w
      JOIN movies m ON w.movie_id = m.movie_id
      LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.genre_id
      WHERE w.user_id = $1
      GROUP BY m.movie_id, w.added_at, w.watched
      ORDER BY w.added_at DESC
    `;

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// DELETE /api/watchlist/:userId/:movieId → Remove from Watchlist
// ============================================================
// Deletes a specific movie from a user's watchlist.
// RETURNING * makes PostgreSQL return the deleted row, so we can
// confirm the deletion actually happened (if rows.length === 0,
// the movie wasn't in the watchlist to begin with).
// ============================================================
export const removeFromWatchlist = async (req, res) => {
  try {
    const { userId, movieId } = req.params;

    const result = await pool.query(
      'DELETE FROM watchlist WHERE user_id = $1 AND movie_id = $2 RETURNING *',
      [userId, movieId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not in watchlist' });
    }

    res.json({ message: 'Movie removed from watchlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/watchlist/check/:userId/:movieId → Check if in Watchlist
// ============================================================
// Returns { inWatchlist: true } or { inWatchlist: false }.
// The frontend uses this to show "In Watchlist" vs "Add to Watchlist" button.
// ============================================================
export const checkWatchlist = async (req, res) => {
  try {
    const { userId, movieId } = req.params;

    const result = await pool.query(
      'SELECT * FROM watchlist WHERE user_id = $1 AND movie_id = $2',
      [userId, movieId]
    );

    // If a row exists, the movie IS in the watchlist
    res.json({ inWatchlist: result.rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// PATCH /api/watchlist/:userId/:movieId/watched → Toggle Watched
// ============================================================
// Flips the "watched" boolean:
//   If currently true  → sets to false (mark as unwatched)
//   If currently false → sets to true  (mark as watched)
//
// This uses a two-step approach:
//   1. SELECT the current watched status
//   2. UPDATE with the opposite value (!current)
// ============================================================
export const toggleWatched = async (req, res) => {
  try {
    const { userId, movieId } = req.params;

    // Step 1: Get the current watched status
    const current = await pool.query(
      'SELECT watched FROM watchlist WHERE user_id = $1 AND movie_id = $2',
      [userId, movieId]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not in watchlist' });
    }

    // Step 2: Flip the boolean (true → false, false → true)
    const newStatus = !current.rows[0].watched;

    const result = await pool.query(
      'UPDATE watchlist SET watched = $1 WHERE user_id = $2 AND movie_id = $3 RETURNING *',
      [newStatus, userId, movieId]
    );

    res.json({
      message: `Movie marked as ${newStatus ? 'watched' : 'unwatched'}`,
      watched: newStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
