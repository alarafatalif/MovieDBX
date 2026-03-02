
import express from 'express';
import { 
  getAllMovies, 
  getMovieById, 
  addMovie, 
  deleteMovie,
  getMovieCast,
  getMovieDirectors,
  getMovieWriters,
  getMovieFull,
  getSimilarMovies,
  getTopRatedMovies,
  getSearchSuggestions
} from '../controllers/movies.controller.js';

const router = express.Router();

// ── Static routes (no :id parameter) ─ must come FIRST ───────

// GET /api/movies → Fetch all movies (supports ?search=, ?genre=, ?oscar=true, ?type=movie)
router.get('/', getAllMovies);

// GET /api/movies/suggestions?q=dark → Autocomplete search suggestions
router.get('/suggestions', getSearchSuggestions);

// GET /api/movies/top-rated?limit=10 → Get highest-rated movies
router.get('/top-rated', getTopRatedMovies);

// ── Dynamic routes (with :id parameter) ─ come AFTER static ───

// GET /api/movies/5 → Get a single movie by its ID
router.get('/:id', getMovieById);

// GET /api/movies/5/full → Get EVERYTHING about a movie in one call
// (movie details + cast + directors + writers + reviews + similar + watchlist status)
router.get('/:id/full', getMovieFull);

// GET /api/movies/5/cast → Get the actors/cast for movie ID 5
router.get('/:id/cast', getMovieCast);

// GET /api/movies/5/directors → Get the director(s) for movie ID 5
router.get('/:id/directors', getMovieDirectors);

// GET /api/movies/5/writers → Get the writer(s) for movie ID 5
router.get('/:id/writers', getMovieWriters);

// GET /api/movies/5/similar → Get movies that share the most genres with movie ID 5
router.get('/:id/similar', getSimilarMovies);

// POST /api/movies → Add a brand new movie to the database
router.post('/', addMovie);

// DELETE /api/movies/5 → Delete movie ID 5 (CASCADE removes all related data)
router.delete('/:id', deleteMovie);

export default router;
