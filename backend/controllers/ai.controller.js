import pool from '../db/db.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const buildContext = async (userId) => {
  const topRatedQuery = `
    SELECT m.movie_id, m.title, m.release_year, m.content_type,
      COALESCE(ROUND(AVG(r.rating)::NUMERIC, 1), 0) AS average_rating,
      COUNT(r.review_id) AS review_count,
      ARRAY_AGG(DISTINCT g.genre_name) FILTER (WHERE g.genre_name IS NOT NULL) AS genres
    FROM movies m
    LEFT JOIN reviews r ON m.movie_id = r.movie_id
    LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.genre_id
    GROUP BY m.movie_id
    ORDER BY average_rating DESC, review_count DESC
    LIMIT 60
  `;

  const recentQuery = `
    SELECT m.movie_id, m.title, m.release_year, m.content_type,
      ARRAY_AGG(DISTINCT g.genre_name) FILTER (WHERE g.genre_name IS NOT NULL) AS genres
    FROM movies m
    LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.genre_id
    GROUP BY m.movie_id
    ORDER BY m.created_at DESC
    LIMIT 40
  `;

  const watchlistQuery = `
    SELECT m.movie_id, m.title, m.release_year, m.content_type,
      ARRAY_AGG(DISTINCT g.genre_name) FILTER (WHERE g.genre_name IS NOT NULL) AS genres
    FROM watchlist w
    JOIN movies m ON w.movie_id = m.movie_id
    LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.genre_id
    WHERE w.user_id = $1
    GROUP BY m.movie_id
    ORDER BY w.added_at DESC
    LIMIT 50
  `;

  const [topRated, recent, watchlist] = await Promise.all([
    pool.query(topRatedQuery),
    pool.query(recentQuery),
    pool.query(watchlistQuery, [userId])
  ]);

  return {
    topRated: topRated.rows,
    recent: recent.rows,
    watchlist: watchlist.rows
  };
};

export const chatWithAssistant = async (req, res) => {
  try {
    const { user_id, message } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!message || message.trim().length < 2) {
      return res.status(400).json({ error: 'Message is too short' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not set' });
    }

    const userCheck = await pool.query(
      'SELECT user_id, username FROM users WHERE user_id = $1',
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const context = await buildContext(user_id);
    const contextJson = JSON.stringify(context);

    const systemPrompt =
      'You are MovieDBX Assistant. Answer only using the provided MovieDBX data. ' +
      'If the answer is not in the data, say you do not have that information. ' +
      'Answer only about movies and series in MovieDBX. Be concise and helpful.';

    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `MovieDBX data: ${contextJson}` },
          { role: 'user', content: message }
        ],
        temperature: 0.4,
        max_tokens: 300
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      return res.status(500).json({ error: 'AI request failed', details: errText });
    }

    const data = await apiResponse.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
