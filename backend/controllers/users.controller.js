// ============================================================
// users.controller.js — User Authentication & Profile Logic
// ============================================================
// Handles registration, login, and user profile retrieval.
//
// PASSWORD SECURITY (bcrypt):
//   We NEVER store plain-text passwords in the database.
//   Instead, we use bcrypt to create a one-way hash:
//
//   Registration:
//     "myPassword123" → bcrypt.hash() → "$2b$10$N9qo8uLOickgx2ZMRZoMye..."
//     The hash is stored in the database. The original password is gone forever.
//
//   Login:
//     User types "myPassword123" → bcrypt.compare(typed, storedHash)
//     bcrypt runs the same algorithm and checks if they match.
//     Returns true/false. You can NEVER reverse a hash back to the password.
//
//   Salt Rounds (10):
//     The "10" in bcrypt.hash(password, 10) means the algorithm runs 2^10 = 1024
//     iterations. Higher = more secure but slower. 10 is the industry standard.
// ============================================================

import pool from '../db/db.js';
import bcrypt from 'bcrypt';   // Password hashing library

// ============================================================
// POST /api/users/register → Register a New User
// ============================================================
// 1. Validates that all fields are provided
// 2. Checks if username or email already exists
// 3. Hashes the password with bcrypt
// 4. Inserts into the users table
// 5. Returns the new user (WITHOUT the password hash)
//
// REQUEST BODY: { username: "alif", email: "alif@email.com", password: "secret123" }
// ============================================================
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ── Validation ───────────────────────────────────────────
    // NEVER trust frontend-only validation. A user could bypass
    // the frontend entirely (e.g., using Postman or curl) and send
    // invalid data directly to this endpoint. Always validate here too.
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // ── Check for Existing User ─────────────────────────────
    // Single query using OR — checks both username and email at once.
    // More efficient than two separate SELECT queries.
    const userCheck = await pool.query(
      'SELECT username, email FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      // Tell the user specifically WHICH one is taken
      const existing = userCheck.rows[0];
      if (existing.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      return res.status(400).json({ error: 'Email already registered' });
    }

    // ── Hash the Password ───────────────────────────────────
    // bcrypt.hash(plainPassword, saltRounds)
    //   "secret123" → "$2b$10$X7z8k9u..." (irreversible one-way hash)
    // This hashed version is what gets stored in the database.
    const hashedPassword = await bcrypt.hash(password, 10);

    // ── Insert into Database ─────────────────────────────────
    // Notice: we store hashedPassword, NOT the plain password.
    // RETURNING clause specifies which columns to return — we
    // deliberately EXCLUDE password_hash from the response.
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING user_id, username, email, created_at`,
      [username, email, hashedPassword]
    );

    // 201 = "Created" status code (standard for successful POST)
    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// POST /api/users/login → Authenticate a User
// ============================================================
// 1. Finds the user by username
// 2. Compares the typed password against the stored hash
// 3. If they match, returns user data (WITHOUT the password hash)
//
// SECURITY:
//   We use the SAME error message for wrong username AND wrong password.
//   "Invalid username or password" — this is intentional.
//   If we said "Username not found" vs "Wrong password", an attacker
//   could use that to figure out which usernames exist in our database.
//
// REQUEST BODY: { username: "alif", password: "secret123" }
// ============================================================
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Fetch the user by username — we need password_hash for comparison
    const result = await pool.query(
      'SELECT user_id, username, email, password_hash, created_at FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      // User doesn't exist — but we use a generic error message (see above)
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // bcrypt.compare(plainPassword, storedHash) → returns true/false
    // It takes the typed password, hashes it the same way, and checks if it matches
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Login successful! Return user data WITHOUT the password_hash.
    // The frontend stores this in localStorage to keep the user logged in.
    res.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/users/:userId → Get User Profile with Stats
// ============================================================
// Returns the user's profile information along with aggregate statistics:
//   - Total number of reviews they've written
//   - Their average rating given across all reviews
//   - Number of movies in their watchlist
//   - Their 5 most recent reviews (with movie titles)
//
// SQL TECHNIQUES USED:
//   COUNT(DISTINCT r.review_id) → Counts unique reviews (avoids double-counting
//     from the LEFT JOIN with watchlist)
//   AVG(r.rating) → Average of all their review ratings
//   LEFT JOIN → Includes the user even if they have 0 reviews or 0 watchlist items
//   GROUP BY → Required because we're using aggregate functions (COUNT, AVG)
// ============================================================
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Step 1: Get basic user info
    const userResult = await pool.query(
      'SELECT user_id, username, email, created_at FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Step 2: Get aggregate stats (counts, averages)
    // LEFT JOIN ensures we get results even if user has 0 reviews or 0 watchlist items
    const statsResult = await pool.query(
      `SELECT 
         COUNT(DISTINCT r.review_id) AS total_reviews,
         ROUND(AVG(r.rating)::NUMERIC, 1) AS avg_rating_given,
         COUNT(DISTINCT w.movie_id) AS watchlist_count
       FROM users u
       LEFT JOIN reviews r ON u.user_id = r.user_id
       LEFT JOIN watchlist w ON u.user_id = w.user_id
       WHERE u.user_id = $1
       GROUP BY u.user_id`,
      [userId]
    );

    // Step 3: Get the user's 5 most recent reviews (with movie titles)
    // JOIN movies to get the title (reviews only store movie_id, not the title)
    const reviewsResult = await pool.query(
      `SELECT r.review_id, r.rating, r.review_text, r.created_at, m.title, m.movie_id
       FROM reviews r
       JOIN movies m ON r.movie_id = m.movie_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [userId]
    );

    // Provide default values if the user has no reviews/watchlist
    const stats = statsResult.rows[0] || { total_reviews: 0, avg_rating_given: null, watchlist_count: 0 };

    // Combine everything into a single response object
    res.json({
      ...userResult.rows[0],          // user_id, username, email, created_at
      stats: {
        total_reviews: parseInt(stats.total_reviews),
        avg_rating_given: stats.avg_rating_given ? parseFloat(stats.avg_rating_given) : null,
        watchlist_count: parseInt(stats.watchlist_count)
      },
      recent_reviews: reviewsResult.rows   // Last 5 reviews
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
