import pool from '../db/db.js';

// ============================================================
// reviews.controller.js — Review Business Logic (CRUD)
// ============================================================
// Handles creating, reading, updating, and deleting movie reviews.
// Also provides endpoints for fetching movies with their average ratings.
//
// KEY SQL CONCEPTS USED IN THIS FILE:
//
// COALESCE(value, fallback):
//   → Returns 'value' if it's not NULL, otherwise returns 'fallback'
//   → Example: COALESCE(AVG(r.rating), 0) → If no reviews exist, return 0 instead of NULL
//
// ROUND(AVG(r.rating)::NUMERIC, 1):
//   → AVG() calculates the average of all ratings
//   → ::NUMERIC casts the result to NUMERIC type (required for ROUND in PostgreSQL)
//   → The second argument (1) = number of decimal places
//   → Example: 7.666667 → 7.7
//
// UNIQUE(movie_id, user_id) in the reviews table:
//   → Enforced at the database level — prevents duplicate reviews
//   → If a user tries to review the same movie twice, PostgreSQL throws error 23505
//   → We catch this error and return a friendly "already reviewed" message
//
// ARRAY_AGG(DISTINCT g.genre_name) FILTER (WHERE g.genre_name IS NOT NULL):
//   → Aggregates multiple genre rows into a single array per movie
//   → DISTINCT removes duplicates, FILTER removes NULLs
//   → Result: ['Action', 'Crime'] instead of separate rows
// ============================================================

// ============================================================
// POST /api/reviews → Add a New Review
// ============================================================
// Creates a review for a specific movie by a specific user.
//
// VALIDATION STEPS:
//   1. Check required fields (user_id, movie_id, rating)
//   2. Validate rating range (0–10)
//   3. Verify the movie exists in the database
//   4. Verify the user exists in the database
//   5. Insert the review
//
// If the user has already reviewed this movie, PostgreSQL's
// UNIQUE constraint catches it (error code 23505).
//
// REQUEST BODY: { user_id: 1, movie_id: 5, rating: 8.5, review_text: "Great movie!" }
// ============================================================
export const addReview = async (req, res) => {
  try {
    const { user_id, movie_id, rating, review_text } = req.body;

    // Validate required fields
    if (!user_id || !movie_id || rating === undefined) {
      return res.status(400).json({ error: 'user_id, movie_id, and rating are required' });
    }

    // Validate rating range (database CHECK constraint also enforces this)
    if (rating < 0 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 0 and 10' });
    }

    // Verify the movie exists before allowing a review
    const movieCheck = await pool.query(
      'SELECT movie_id FROM movies WHERE movie_id = $1',
      [movie_id]
    );

    if (movieCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Verify the user exists before allowing a review
    const userCheck = await pool.query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Insert the review into the database
    // RETURNING * → gives us back the full inserted row
    const result = await pool.query(
      `INSERT INTO reviews (user_id, movie_id, rating, review_text) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [user_id, movie_id, rating, review_text]
    );

    // 201 = "Created" — standard status code for successful POST operations
    res.status(201).json({
      message: 'Review added successfully',
      review: result.rows[0]
    });
  } catch (error) {
    // PostgreSQL error 23505 = unique_violation
    // This fires when a user tries to review the same movie twice
    // (due to UNIQUE(movie_id, user_id) constraint in schema.sql)
    if (error.code === '23505') {
      return res.status(400).json({ error: 'You have already reviewed this movie' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/reviews/movie/:movieId → Get All Reviews for a Movie
// ============================================================
// Returns all reviews for a specific movie, along with the
// reviewer's username (fetched via JOIN with the users table).
//
// Without the JOIN, we'd only have user_id (a number like 7),
// which isn't useful for displaying on the frontend.
// The JOIN lets us show "reviewed by alif" instead of "reviewed by 7".
// ============================================================
export const getMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;

    // JOIN users table to get the reviewer's username alongside each review.
    // reviews table only stores user_id (a number), not the username string.
    const query = `
      SELECT r.review_id, r.rating, r.review_text, r.created_at,
             u.username, u.user_id
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.movie_id = $1
      ORDER BY r.created_at DESC
    `;

    const result = await pool.query(query, [movieId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/reviews/movie-rating/:movieId → Get Movie with Rating
// ============================================================
// Returns a single movie with its average rating, review count,
// and genres — all in one query using multiple JOINs.
//
// This is a complex multi-table JOIN with aggregation:
//   movies ← LEFT JOIN reviews     (to calculate AVG rating)
//   movies ← LEFT JOIN movie_genres → genres  (to get genre names)
// ============================================================
export const getMovieWithRating = async (req, res) => {
  try {
    const { movieId } = req.params;

    // Multi-table JOIN with aggregation:
    //   AVG(r.rating)                  → Average of all review ratings for this movie
    //   COUNT(r.review_id)             → Total number of reviews
    //   ARRAY_AGG(DISTINCT g.genre_name) → All genres combined into a single array
    //   COALESCE(..., 0)               → If no reviews, show 0 instead of NULL
    //   ROUND(..., 1)                  → Round to 1 decimal place
    const query = `
      SELECT m.*,
        COALESCE(ROUND(AVG(r.rating)::NUMERIC, 1), 0) AS average_rating,
        COUNT(r.review_id) AS review_count,
        ARRAY_AGG(DISTINCT g.genre_name) FILTER (WHERE g.genre_name IS NOT NULL) AS genres
      FROM movies m
      LEFT JOIN reviews r ON m.movie_id = r.movie_id
      LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.genre_id
      WHERE m.movie_id = $1
      GROUP BY m.movie_id
    `;

    const result = await pool.query(query, [movieId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/reviews/all-ratings → Get ALL Movies with Ratings
// ============================================================
// Returns every movie in the database with its average rating,
// review count, and genres. Used on the Home page to display
// the movie grid with rating badges.
//
// Optionally filters by content type (?type=movie or ?type=series)
// ============================================================
export const getAllMoviesWithRatings = async (req, res) => {
  try {
    const { type } = req.query;   // Optional: filter by 'movie' or 'series'

    // Same multi-table JOIN as above, but for ALL movies
    let query = `
      SELECT m.*,
        COALESCE(ROUND(AVG(r.rating)::NUMERIC, 1), 0) AS average_rating,
        COUNT(r.review_id) AS review_count,
        ARRAY_AGG(DISTINCT g.genre_name) FILTER (WHERE g.genre_name IS NOT NULL) AS genres
      FROM movies m
      LEFT JOIN reviews r ON m.movie_id = r.movie_id
      LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.genre_id
    `;

    // Add content type filter if provided
    const values = [];
    if (type && (type === 'movie' || type === 'series')) {
      query += ` WHERE m.content_type = $1`;
      values.push(type);
    }

    query += `
      GROUP BY m.movie_id
      ORDER BY m.created_at DESC
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// PUT /api/reviews/:reviewId → Update an Existing Review
// ============================================================
// Allows a user to edit their own review (rating and/or text).
//
// OWNERSHIP CHECK:
//   The WHERE clause includes "AND user_id = $4" to ensure
//   only the review OWNER can edit it. Without this check,
//   anyone who knows the review_id could modify any review.
//
// COALESCE($1, rating):
//   → If the user sends a new rating, use it
//   → If they send NULL (only updating text), keep the old rating
//   This allows partial updates.
// ============================================================
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, review_text, user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Validate rating range if a new rating is provided
    if (rating !== undefined && (rating < 0 || rating > 10)) {
      return res.status(400).json({ error: 'Rating must be between 0 and 10' });
    }

    // UPDATE with ownership check:
    //   WHERE review_id = $3 AND user_id = $4
    //   → Only updates if BOTH conditions are true
    //   → Prevents users from editing other people's reviews
    //
    // COALESCE($1, rating) → Use new value if provided, keep old value if NULL
    const result = await pool.query(
      `UPDATE reviews 
       SET rating = COALESCE($1, rating), 
           review_text = COALESCE($2, review_text)
       WHERE review_id = $3 AND user_id = $4
       RETURNING *`,
      [rating, review_text, reviewId, user_id]
    );

    // If no rows were updated, either the review doesn't exist
    // or the user doesn't own it
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or you do not own this review' });
    }

    res.json({ message: 'Review updated successfully', review: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// DELETE /api/reviews/:reviewId → Delete a Review
// ============================================================
// Deletes a review, but ONLY if the requesting user owns it.
// Same ownership pattern as updateReview above.
// ============================================================
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Only delete if the review belongs to this user (ownership check)
    // WHERE review_id = $1 AND user_id = $2 → both must match
    const result = await pool.query(
      'DELETE FROM reviews WHERE review_id = $1 AND user_id = $2 RETURNING *',
      [reviewId, user_id]
    );

    // If no rows were deleted, the review either doesn't exist or isn't owned by this user
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or you do not own this review' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
