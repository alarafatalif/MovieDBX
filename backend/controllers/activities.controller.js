import pool from '../db/db.js';

export const logActivity = async ({ userId, movieId = null, actionType, rating = null }) => {
  try {
    await pool.query(
      `INSERT INTO activities (user_id, movie_id, action_type, rating)
       VALUES ($1, $2, $3, $4)`,
      [userId, movieId, actionType, rating]
    );
  } catch (error) {
    console.error('Activity log error:', error.message);
  }
};

export const getActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const userId = req.query.userId;

    let query = `
      SELECT a.activity_id, a.action_type, a.rating, a.created_at,
        u.user_id, u.username,
        m.movie_id, m.title, m.poster_url
      FROM activities a
      JOIN users u ON a.user_id = u.user_id
      LEFT JOIN movies m ON a.movie_id = m.movie_id
    `;

    const values = [];
    if (userId) {
      query += ' WHERE a.user_id = $1';
      values.push(userId);
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${values.length + 1}`;
    values.push(limit);

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
