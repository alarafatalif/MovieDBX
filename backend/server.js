import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db/db.js';

import moviesRoutes from './routes/movies.routes.js';
import genresRoutes from './routes/genres.routes.js';
import watchlistRoutes from './routes/watchlist.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import usersRoutes from './routes/users.routes.js';
import aiRoutes from './routes/ai.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'MovieDBX API is running' });
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connected!', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/movies', moviesRoutes);
app.use('/api/genres', genresRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ai', aiRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.path} not found` });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
