
// CONTROLLER PATTERN:
//   1. Receive the request (req) from Express
//   2. Run a SQL query against the database (pool.query)
//   3. Send the result back as JSON (res.json)
//   4. If something goes wrong, send a 500 error
// ============================================================

import pool from '../db/db.js';

// ============================================================
// GET /api/genres → Get All Genres
// ============================================================
// Returns every genre from the genres table, sorted alphabetically.
// The frontend uses this to populate the genre filter dropdown on the Home page.
//
// SQL: SELECT * FROM genres ORDER BY genre_name
//   → Returns: [{genre_id: 1, genre_name: 'Action'}, {genre_id: 2, genre_name: 'Comedy'}, ...]
// ============================================================
export const getAllGenres = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM genres ORDER BY genre_name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/genres/:id/movies → Get Movies by Genre
// ============================================================
// Returns all movies that belong to a specific genre.
//
// HOW IT WORKS:
//   The genre_id comes from the URL parameter (req.params.id)
//   We JOIN movies with movie_genres to find the connection
//   movie_genres is the junction table that links movies ↔ genres
//
// SQL FLOW:
//   movies → JOIN movie_genres (on movie_id) → WHERE genre_id = 3
//   This gives us all movies tagged with genre ID 3
// ============================================================
export const getMoviesByGenre = async (req, res) => {
  try {
    const { id } = req.params;   // Extract genre ID from URL (e.g., /api/genres/3/movies)
    
    const query = `
      SELECT m.*
      FROM movies m
      JOIN movie_genres mg ON m.movie_id = mg.movie_id
      WHERE mg.genre_id = $1
      ORDER BY m.title
    `;
    
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};