// ================================================================
// API SERVICE — The Bridge Between Frontend and Backend
// ================================================================
// This file contains ALL the functions that make HTTP requests
// to our Express.js backend server.
//
// HOW IT WORKS:
//   1. Frontend component calls a function from this file
//   2. That function uses axios to send an HTTP request
//   3. Express backend receives the request and runs the controller
//   4. Controller queries PostgreSQL and sends back JSON
//   5. axios returns the response to the component
//
// Example flow:
//   Home.js → getAllMoviesWithRatings() → axios.get('/api/reviews/all-ratings')
//   → Express → reviews.controller.js → PostgreSQL → JSON response
//
// HTTP METHODS:
//   GET    → Read data (doesn't change anything in DB)
//   POST   → Create new data (insert into DB)
//   PUT    → Update/replace existing data
//   PATCH  → Partially update data (change one field)
//   DELETE → Remove data from DB
//
// axios returns a Promise, so we use async/await in components.
// The actual data is in response.data (axios wraps it).
// ================================================================
import axios from 'axios';

// Base URL for all API requests.
// REACT_APP_API_URL can be set in .env file for production.
// Falls back to localhost:3000 for development.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({ baseURL: API_URL });

const getStoredToken = () => {
  try {
    const saved = localStorage.getItem('moviedbx_user');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return parsed?.token || null;
  } catch {
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── MOVIE ENDPOINTS ───────────────────────────────────────────
// These functions correspond to routes in movies.routes.js

// GET /api/movies → Fetch all movies (no filters)
export const getAllMovies = (type) => {
  let url = `${API_URL}/movies`;
  if (type) url += `?type=${type}`;
  return api.get(url);
};

// GET /api/movies/:id → Fetch a single movie by its ID
export const getMovieById = (id) => 
  api.get(`${API_URL}/movies/${id}`);

// GET /api/movies?search=batman&type=movie → Search movies by title
// encodeURIComponent() makes the query URL-safe (handles spaces, special chars)
export const searchMovies = (query, type) => {
  let url = `${API_URL}/movies?search=${encodeURIComponent(query)}`;
  if (type) url += `&type=${type}`;
  return api.get(url);
};

// GET /api/movies/suggestions?q=bat&type=movie → Autocomplete suggestions (max 6)
export const getSearchSuggestions = (query, type) => {
  let url = `${API_URL}/movies/suggestions?q=${encodeURIComponent(query)}`;
  if (type) url += `&type=${type}`;
  return api.get(url);
};

// GET /api/movies?genre=Action&type=movie → Filter by genre
export const filterByGenre = (genre, type) => {
  let url = `${API_URL}/movies?genre=${encodeURIComponent(genre)}`;
  if (type) url += `&type=${type}`;
  return api.get(url);
};

// GET /api/movies?oscar=true&type=series → Filter Oscar winners
export const filterByOscar = (type) => {
  let url = `${API_URL}/movies?oscar=true`;
  if (type) url += `&type=${type}`;
  return api.get(url);
};

// POST /api/movies → Add a new movie (sends JSON body)
export const addMovie = (movieData) => 
  api.post(`${API_URL}/movies`, movieData);

export const deleteMovie = (movieId) =>
  api.delete(`${API_URL}/movies/${movieId}`);

// GET /api/movies/:id/cast → Fetch cast for a specific movie
export const getMovieCast = (movieId) => 
  api.get(`${API_URL}/movies/${movieId}/cast`);

// GET /api/movies/:id/directors → Fetch directors
export const getMovieDirectors = (movieId) => 
  api.get(`${API_URL}/movies/${movieId}/directors`);

// GET /api/movies/:id/writers → Fetch writers
export const getMovieWriters = (movieId) => 
  api.get(`${API_URL}/movies/${movieId}/writers`);

// GET /api/movies/:id/similar → Fetch similar movies based on shared genres
export const getSimilarMovies = (movieId) => 
  api.get(`${API_URL}/movies/${movieId}/similar`);

// GET /api/movies/:id/full?userId=5 → Fetch ALL movie details in ONE call
// This is the main endpoint used by MovieDetails.js page.
// Returns: movie info, reviews, cast, directors, writers, similar, watchlist status
export const getMovieFull = (movieId, userId) => {
  let url = `${API_URL}/movies/${movieId}/full`;
  if (userId) url += `?userId=${userId}`;
  return api.get(url);
};

// GET /api/movies/top-rated?limit=10&type=movie → Fetch top rated movies
export const getTopRatedMovies = (limit = 10, type) => {
  let url = `${API_URL}/movies/top-rated?limit=${limit}`;
  if (type) url += `&type=${type}`;
  return api.get(url);
};

// ── Genres ──────────────────────────────────────────────────
export const getAllGenres = () => 
  api.get(`${API_URL}/genres`);

// ── Watchlist ────────────────────────────────────────────────
export const getWatchlist = (userId) => 
  api.get(`${API_URL}/watchlist/${userId}`);

export const addToWatchlist = (userId, movieId) => 
  api.post(`${API_URL}/watchlist`, { user_id: userId, movie_id: movieId });

export const removeFromWatchlist = (userId, movieId) => 
  api.delete(`${API_URL}/watchlist/${userId}/${movieId}`);

export const checkInWatchlist = (userId, movieId) => 
  api.get(`${API_URL}/watchlist/check/${userId}/${movieId}`);

// NEW: Toggle watched/unwatched
export const toggleWatched = (userId, movieId) => 
  api.patch(`${API_URL}/watchlist/${userId}/${movieId}/watched`);

// ── Reviews ──────────────────────────────────────────────────
export const getMovieReviews = (movieId) => 
  api.get(`${API_URL}/reviews/movie/${movieId}`);

export const getMovieWithRating = (movieId) => 
  api.get(`${API_URL}/reviews/movie-rating/${movieId}`);

export const getAllMoviesWithRatings = (type) => {
  let url = `${API_URL}/reviews/all-ratings`;
  if (type) url += `?type=${type}`;
  return api.get(url);
};

// POST /api/reviews → Submit a new review (rating + optional text)
export const addReview = (reviewData) => 
  api.post(`${API_URL}/reviews`, reviewData);

// PUT /api/reviews/:reviewId → Update an existing review
export const updateReview = (reviewId, reviewData) => 
  api.put(`${API_URL}/reviews/${reviewId}`, reviewData);

// DELETE /api/reviews/:reviewId → Delete a review
// Note: user_id is sent in the request BODY (not URL) for security
// axios.delete needs { data: {...} } to send a body
export const deleteReview = (reviewId, userId) => 
  api.delete(`${API_URL}/reviews/${reviewId}`, { data: { user_id: userId } });

// ── USER/AUTH ENDPOINTS ─────────────────────────────────────

// POST /api/users/register → Create a new user account
export const registerUser = (userData) => 
  api.post(`${API_URL}/users/register`, userData);

// POST /api/users/login → Authenticate and get user data back
export const loginUser = (credentials) => 
  api.post(`${API_URL}/users/login`, credentials);

// GET /api/users/:userId → Fetch a user's profile
export const getUserProfile = (userId) => 
  api.get(`${API_URL}/users/${userId}`);

export const getAllUsers = () =>
  api.get(`${API_URL}/users`);

export const deleteUser = (userId) =>
  api.delete(`${API_URL}/users/${userId}`);

// ── Activities ─────────────────────────────────────────────
export const getActivities = (limit = 20, userId) => {
  let url = `${API_URL}/activities?limit=${limit}`;
  if (userId) url += `&userId=${userId}`;
  return api.get(url);
};
