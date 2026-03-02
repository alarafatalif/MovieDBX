
import express from 'express';
import {
  addReview,
  getMovieReviews,
  getMovieWithRating,
  getAllMoviesWithRatings,
  updateReview,
  deleteReview
} from '../controllers/reviews.controller.js';

const router = express.Router();

// POST /api/reviews → Submit a new review (sends user_id, movie_id, rating, review_text in body)
router.post('/', addReview);
// GET /api/reviews/movie/5 → Get all reviews for movie ID 5 (with usernames)
router.get('/movie/:movieId', getMovieReviews);

// GET /api/reviews/movie-rating/5 → Get movie ID 5 with its average rating and review count
router.get('/movie-rating/:movieId', getMovieWithRating);

// GET /api/reviews/all-ratings → Get ALL movies with their average ratings (used on Home page)
router.get('/all-ratings', getAllMoviesWithRatings);

// PUT /api/reviews/12 → Update review ID 12 (only the review owner can do this)
router.put('/:reviewId', updateReview);

// DELETE /api/reviews/12 → Delete review ID 12 (only the review owner can do this)
router.delete('/:reviewId', deleteReview);

export default router;