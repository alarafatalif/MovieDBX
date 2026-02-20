// ============================================================
// movies.routes.js — Defines All Movie-Related API Endpoints
// ============================================================
// This file maps URL paths to controller functions.
//
// HOW ROUTING WORKS:
//   When the frontend makes a request like GET /api/movies/5,
//   Express checks this file to find a matching route.
//   If it matches "/:id", it calls getMovieById(req, res).
//
// ROUTE ORDER MATTERS!
//   /suggestions and /top-rated MUST come BEFORE /:id
//   Otherwise Express thinks "suggestions" is a movie ID.
//   Express matches routes top-to-bottom — first match wins.
//
// HTTP METHODS:
//   GET    → Read/fetch data    (doesn't change the database)
//   POST   → Create new data    (inserts into the database)
//   DELETE → Remove data         (deletes from the database)
// ============================================================

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
