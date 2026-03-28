
import pool from '../db/db.js';

//get all genres
export const getAllGenres = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM genres ORDER BY genre_name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//Get Movies by Genre
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