// ================================================================
// MOVIES CONTROLLER — The heart of the application
// ================================================================
// This is the BIGGEST controller in the project. It handles:
//   - Searching movies (autocomplete + full search)
//   - Listing movies with filters (genre, oscar, type)
//   - Getting full movie details (cast, directors, reviews, etc.)
//   - Finding similar movies (SQL-based recommendation)
//   - Top rated movies
//   - Adding and deleting movies
//
// SQL CONCEPTS used heavily here:
// ─────────────────────────────────
//   ILIKE '%text%'      → Case-insensitive search (PostgreSQL-specific)
//   ARRAY_AGG(DISTINCT)  → Combine multiple rows into one array
//   LEFT JOIN            → Keep all movies even if no match in joined table
//   Subqueries           → A query inside another query (used for filters)
//   Promise.all()        → Run multiple DB queries at the same time
//   Dynamic query building → Adding WHERE clauses based on user filters
//
// PARAMETERIZED QUERIES ($1, $2, ...):
//   → NEVER build SQL strings with user input like `WHERE title = '${title}'`
//   → That allows SQL injection attacks!
//   → Always use $1, $2 placeholders with a values array
// ================================================================
import pool from '../db/db.js';

// ============================================================
// GET /api/movies/search?q=bat&type=movie → Search Suggestions
// ============================================================
// Lightweight endpoint used by the search bar's autocomplete.
// Returns max 6 results with just enough data for the dropdown.
// Uses ILIKE for case-insensitive partial matching.
// ============================================================
export const getSearchSuggestions = async (req, res) => {
  try {
    // q = search text, type = optional filter ('movie' or 'series')
    const { q, type } = req.query;

    // Don't search if query is too short (avoids returning everything)
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    // Build the search query:
    //   ILIKE $1 → case-insensitive pattern matching
    //   '%text%' → matches "text" anywhere in the title
    //   ARRAY_AGG → collects all genre names into one array per movie
    //   FILTER (WHERE ... IS NOT NULL) → excludes NULL genres from the array
    let query = `
      WITH base AS (
        SELECT DISTINCT ON (LOWER(m.title), m.content_type)
          m.movie_id,
          m.title,
          m.poster_url,
          m.release_year,
          m.content_type
        FROM movies m
        WHERE m.title ILIKE $1
    `;
    const values = [`%${q.trim()}%`];  // %...% = match anywhere in title
    let idx = 2;                        // Next parameter index

    // Optionally filter by content type
    if (type && (type === 'movie' || type === 'series')) {
      query += ` AND m.content_type = $${idx}`;
      values.push(type);
      idx++;
    }

    query += `
        ORDER BY LOWER(m.title), m.content_type, m.release_year DESC, m.movie_id DESC
      )
      SELECT base.movie_id, base.title, base.poster_url, base.release_year, base.content_type,
        ARRAY_AGG(DISTINCT g.genre_name) FILTER (WHERE g.genre_name IS NOT NULL) AS genres
      FROM base
      LEFT JOIN movie_genres mg ON base.movie_id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.genre_id
      GROUP BY base.movie_id, base.title, base.poster_url, base.release_year, base.content_type
      ORDER BY base.title ASC
      LIMIT 6
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/movies → Get All Movies (with optional filters)
// ============================================================
// This is the MAIN endpoint used by the Home page.
// It supports multiple filters that can be combined:
//   ?genre=Action         → only Action movies
//   ?oscar=true           → only Oscar winners
//   ?search=batman        → title contains "batman"
//   ?type=series           → only TV series
//   ?genre=Drama&oscar=true → Drama + Oscar winner (combined)
//
// DYNAMIC QUERY BUILDING:
//   Instead of writing 16 separate queries for every filter
//   combination, we build the query dynamically:
//   1. Start with the base query (all movies with genres)
//   2. For each filter the user provides, add a WHERE condition
//   3. Combine conditions with AND
//   This is a very common pattern in real-world APIs.
// ============================================================
export const getAllMovies = async (req, res) => {
  try {
    // Extract all possible filters from the query string
    const { genre, oscar, search, type } = req.query;

    // Base query: get all movies with their genres aggregated into an array
    // DISTINCT m.* → avoid duplicate movie rows when joining multiple tables
    let query = `
      SELECT DISTINCT m.*,
        ARRAY_AGG(DISTINCT g.genre_name) FILTER (WHERE g.genre_name IS NOT NULL) AS genres
      FROM movies m
      LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.genre_id
    `;

    // ── Dynamic WHERE clause building ──
    // We collect conditions in an array, then join them with AND
    const conditions = [];  // e.g., ['m.content_type = $1', 'm.has_oscar = $2']
    const values = [];      // e.g., ['movie', true]
    let valueIndex = 1;     // Parameter index ($1, $2, $3...)

    // Filter by content type (movie vs series)
    if (type && (type === 'movie' || type === 'series')) {
      conditions.push(`m.content_type = $${valueIndex}`);
      values.push(type);
      valueIndex++;
    }

    // Filter by genre using a SUBQUERY
    // Why a subquery? Because genres are in a separate table (movie_genres).
    // The subquery finds all movie_ids that have the matching genre,
    // then the outer query checks if our movie is IN that list.
    if (genre) {
      conditions.push(`m.movie_id IN (
        SELECT mg2.movie_id FROM movie_genres mg2
        JOIN genres g2 ON mg2.genre_id = g2.genre_id
        WHERE g2.genre_name = $${valueIndex}
      )`);
      values.push(genre);
      valueIndex++;
    }

    // Filter by Oscar winners (has_oscar = true)
    if (oscar === 'true') {
      conditions.push(`m.has_oscar = $${valueIndex}`);
      values.push(true);    // Parameterized even for booleans (security best practice)
      valueIndex++;
    }

    // Search by title (case-insensitive partial match)
    // ILIKE = case-insensitive LIKE (PostgreSQL-specific)
    // '%batman%' matches "Batman", "The Batman Returns", "BATMAN", etc.
    if (search) {
      conditions.push(`m.title ILIKE $${valueIndex}`);
      values.push(`%${search}%`);
      valueIndex++;
    }

    // Combine all conditions with AND
    // Result: "WHERE m.content_type = $1 AND m.has_oscar = $2"
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // GROUP BY is required because of ARRAY_AGG
    // ORDER BY created_at DESC → newest movies first
    query += ' GROUP BY m.movie_id ORDER BY m.created_at DESC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/movies/:id → Get Single Movie by ID
// ============================================================
// Returns one movie with its genres aggregated into an array.
// Used when you need basic movie info without the full details.
// For full details (cast, reviews, etc.), use getMovieFull instead.
// ============================================================
export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;  // Extract movie ID from URL: /api/movies/42 → id = 42

    // Validate that id is a number to prevent bad SQL
    // isNaN("abc") → true, isNaN("42") → false
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }

    const query = `
      SELECT m.*,
        ARRAY_AGG(DISTINCT g.genre_name) FILTER (WHERE g.genre_name IS NOT NULL) AS genres
      FROM movies m
      LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.genre_id
      WHERE m.movie_id = $1
      GROUP BY m.movie_id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/movies/:id/cast → Get Cast Members for a Movie
// ============================================================
// Queries the persons table filtered by role='actor'.
// No junction table needed — movie_id and role live directly on persons.
// ============================================================
export const getMovieCast = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT DISTINCT ON (LOWER(name), LOWER(COALESCE(character_name, '')))
        person_id, name, bio, photo_url, character_name
      FROM persons
      WHERE movie_id = $1 AND role = 'actor'
      ORDER BY LOWER(name), LOWER(COALESCE(character_name, '')), person_id DESC
    `;

    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/movies/:id/directors → Get Directors for a Movie
// ============================================================
// Same persons table, filtered by role='director'.
// ============================================================
export const getMovieDirectors = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT DISTINCT ON (LOWER(name))
        person_id, name, bio, photo_url
      FROM persons
      WHERE movie_id = $1 AND role = 'director'
      ORDER BY LOWER(name), person_id DESC
    `;

    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/movies/:id/writers → Get Writers for a Movie
// ============================================================
// Same persons table, filtered by role='writer'.
// ============================================================
export const getMovieWriters = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT DISTINCT ON (LOWER(name))
        person_id, name
      FROM persons
      WHERE movie_id = $1 AND role = 'writer'
      ORDER BY LOWER(name), person_id DESC
    `;

    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/movies/:id/full?userId=5 → Get EVERYTHING About a Movie
// ============================================================
// This is the MOST POWERFUL endpoint in the entire API.
// Instead of making 6-7 separate API calls, it returns EVERYTHING
// the frontend needs for the MovieDetails page in ONE response:
//   - Movie info + average rating + genres
//   - All reviews (with usernames)
//   - Full cast (actors + character names)
//   - Directors
//   - Writers
//   - Similar movies (recommendation)
//   - Whether the current user has it in their watchlist
//
// PERFORMANCE TRICK: Promise.all()
//   Instead of running queries one-by-one (slow):
//     query1 → wait → query2 → wait → query3 → wait  (sequential)
//   We run them ALL at the same time (fast):
//     query1 + query2 + query3 → wait once  (parallel)
//   This can be 5-7x faster!
// ============================================================
export const getMovieFull = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId;  // Optional: check watchlist status

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }

    // ── Launch ALL 7 queries in parallel using Promise.all() ──
    // Each query is independent, so they can run simultaneously.
    // The database handles them as separate connections from the pool.
    const queries = [
      // Query 0: Movie details + average rating + genres
      // (Same complex multi-JOIN from reviews controller)
      pool.query(`
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
      `, [id]),
      // Query 1: All reviews for this movie (with reviewer usernames)
      pool.query(`
        SELECT r.*, u.username
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.movie_id = $1
        ORDER BY r.created_at DESC
      `, [id]),
      // Query 2: Cast members (actors + character names)
      pool.query(`
        SELECT DISTINCT ON (LOWER(name), LOWER(COALESCE(character_name, '')))
          person_id, name, bio, photo_url, character_name
        FROM persons
        WHERE movie_id = $1 AND role = 'actor'
        ORDER BY LOWER(name), LOWER(COALESCE(character_name, '')), person_id DESC
      `, [id]),
      // Query 3: Directors
      pool.query(`
        SELECT DISTINCT ON (LOWER(name))
          person_id, name, bio, photo_url
        FROM persons
        WHERE movie_id = $1 AND role = 'director'
        ORDER BY LOWER(name), person_id DESC
      `, [id]),
      // Query 4: Writers
      pool.query(`
        SELECT DISTINCT ON (LOWER(name))
          person_id, name
        FROM persons
        WHERE movie_id = $1 AND role = 'writer'
        ORDER BY LOWER(name), person_id DESC
      `, [id]),
      // Query 5: Similar movies (same genre-based recommendation)
      pool.query(`
        SELECT m.movie_id, m.title, m.poster_url, m.release_year,
          COUNT(*) AS shared_genres
        FROM movies m
        JOIN movie_genres mg ON m.movie_id = mg.movie_id
        WHERE mg.genre_id IN (
          SELECT genre_id FROM movie_genres WHERE movie_id = $1
        )
        AND m.movie_id != $1
        GROUP BY m.movie_id, m.title, m.poster_url, m.release_year
        ORDER BY shared_genres DESC
        LIMIT 4
      `, [id]),
      // Query 6: Watchlist check (only runs if userId is provided)
      // If no userId, we resolve with null immediately (no DB call)
      userId ? pool.query(`
        SELECT COUNT(*) > 0 AS "inWatchlist"
        FROM watchlist WHERE user_id = $1 AND movie_id = $2
      `, [userId, id]) : Promise.resolve(null)
    ];

    // Wait for ALL queries to finish. results[0] through results[6]
    // correspond to the queries above.
    const results = await Promise.all(queries);

    // If movie not found, none of the other data matters
    if (results[0].rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Combine all results into one clean response object.
    // The frontend receives this as a single JSON object with
    // movie, reviews, cast, directors, writers, similar, inWatchlist.
    res.json({
      movie: results[0].rows[0],           // Single movie object
      reviews: results[1].rows,             // Array of review objects
      cast: results[2].rows,                // Array of actor objects
      directors: results[3].rows,           // Array of director objects
      writers: results[4].rows,             // Array of writer objects
      similar: results[5].rows,             // Array of similar movies
      inWatchlist: results[6] ? results[6].rows[0]?.inWatchlist || false : false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/movies/:id/similar → Find Similar Movies
// ============================================================
// A SQL-based recommendation engine!
//
// How it works (step by step):
//   1. Find all genre_ids for movie #42 (e.g., Action=1, Sci-Fi=3)
//   2. Search ALL other movies that have genre_id 1 OR 3
//   3. COUNT how many genres they share with movie #42
//   4. Sort by shared_genres DESC → most similar first
//   5. LIMIT 4 → only show top 4 similar movies
//
// Example:
//   Movie #42: Action, Sci-Fi
//   Movie #10: Action, Sci-Fi, Drama  → shared_genres = 2 ✓ (top match)
//   Movie #15: Action                 → shared_genres = 1
//   Movie #20: Comedy                 → shared_genres = 0 (not returned)
// ============================================================
export const getSimilarMovies = async (req, res) => {
  try {
    const { id } = req.params;

    // Step-by-step SQL explanation:
    //   1. Inner subquery: SELECT genre_id FROM movie_genres WHERE movie_id = $1
    //      → Gets genre IDs for the target movie
    //   2. WHERE mg.genre_id IN (...)
    //      → Finds movies that share ANY of those genres
    //   3. AND m.movie_id != $1
    //      → Excludes the movie itself from results
    //   4. COUNT(*) AS shared_genres
    //      → Counts how many genre matches there are
    //   5. ORDER BY shared_genres DESC
    //      → Most similar first
    const query = `
      SELECT m.movie_id, m.title, m.poster_url, m.release_year,
        COUNT(*) AS shared_genres
      FROM movies m
      JOIN movie_genres mg ON m.movie_id = mg.movie_id
      WHERE mg.genre_id IN (
        SELECT genre_id FROM movie_genres WHERE movie_id = $1
      )
      AND m.movie_id != $1
      GROUP BY m.movie_id, m.title, m.poster_url, m.release_year
      ORDER BY shared_genres DESC
      LIMIT 4
    `;

    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET /api/reviews/top-rated?limit=10&type=movie → Top Rated
// ============================================================
// Returns movies sorted by their average review rating.
// Used for the "Top Rated" section on the Home page.
//
// Supports optional filters:
//   ?limit=10   → how many to return (default: 10)
//   ?type=movie  → only movies or only series
// ============================================================
export const getTopRatedMovies = async (req, res) => {
  try {
    // parseInt with fallback: if limit is missing or invalid, default to 10
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;

    let query = `
      SELECT m.*,
        COALESCE(AVG(r.rating), 0) AS average_rating,
        COUNT(r.review_id) AS review_count,
        ARRAY_AGG(DISTINCT g.genre_name) FILTER (WHERE g.genre_name IS NOT NULL) AS genres
      FROM movies m
      LEFT JOIN reviews r ON m.movie_id = r.movie_id
      LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.genre_id
    `;

    // Dynamic WHERE clause (same pattern as getAllMovies)
    const values = [];
    let idx = 1;

    if (type && (type === 'movie' || type === 'series')) {
      query += ` WHERE m.content_type = $${idx}`;
      values.push(type);
      idx++;
    }

    // ORDER BY average_rating DESC → highest rated first
    // LIMIT is parameterized too (security + flexibility)
    query += `
      GROUP BY m.movie_id
      ORDER BY average_rating DESC
      LIMIT $${idx}
    `;
    values.push(limit);

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// POST /api/movies → Add a New Movie
// ============================================================
// Creates a new movie record and links it to genres.
//
// Request body example:
//   {
//     title: "Inception",
//     description: "A mind-bending thriller...",
//     release_year: 2010,
//     genres: ["Sci-Fi", "Action"]   ← array of genre NAMES
//   }
//
// Two-step process:
//   1. INSERT the movie into the movies table
//   2. For each genre name, find its genre_id and INSERT into movie_genres
// ============================================================
export const addMovie = async (req, res) => {
  try {
    // Destructure all fields from the request body
    const {
      title,
      description,
      release_year,
      duration,
      poster_url,
      trailer_url,
      netflix_url,
      platforms,
      has_oscar,
      genres,
      content_type,
      seasons,
      total_episodes,
      episodes_per_season
    } = req.body;

    // Title is the only required field
    if (!title) {
      return res.status(400).json({ error: 'Movie title is required' });
    }

    // Step 1: Insert the movie itself
    // RETURNING * → gives us back the full inserted row (including auto-generated movie_id)
    const normalizedType = content_type === 'series' ? 'series' : 'movie';
    const hasOscar = has_oscar === true || has_oscar === 'true';
    const platformList = Array.isArray(platforms) ? platforms : [];
    const episodesPayload = episodes_per_season && typeof episodes_per_season === 'object'
      ? episodes_per_season
      : null;

    const movieQuery = `
      INSERT INTO movies (
        title,
        description,
        release_year,
        duration,
        poster_url,
        trailer_url,
        netflix_url,
        platforms,
        has_oscar,
        content_type,
        seasons,
        total_episodes,
        episodes_per_season
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const movieResult = await pool.query(movieQuery, [
      title,
      description,
      release_year,
      duration,
      poster_url,
      trailer_url,
      netflix_url,
      platformList,
      hasOscar,
      normalizedType,
      seasons || null,
      total_episodes || null,
      episodesPayload
    ]);

    const newMovie = movieResult.rows[0];

    // Step 2: Link the movie to its genres (via movie_genres junction table)
    // For each genre name like "Action", we:
    //   a) Look up the genre_id in the genres table
    //   b) Insert a row into movie_genres linking movie_id → genre_id
    if (genres && genres.length > 0) {
      for (const genreName of genres) {
        // Find the genre_id for this genre name
        const genreResult = await pool.query(
          'SELECT genre_id FROM genres WHERE genre_name = $1',
          [genreName]
        );
        // Only create the link if the genre exists in our database
        if (genreResult.rows.length > 0) {
          await pool.query(
            'INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2)',
            [newMovie.movie_id, genreResult.rows[0].genre_id]
          );
        }
      }
    }

    // 201 = "Created" — standard response for successful POST
    res.status(201).json(newMovie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// DELETE /api/movies/:id → Delete a Movie
// ============================================================
// Removes a movie from the database.
//
// IMPORTANT: Because of ON DELETE CASCADE in schema.sql,
// deleting a movie AUTOMATICALLY deletes all related records:
//   - movie_genres entries
//   - movie_crew entries (actors, directors, writers)
//   - reviews for this movie
//   - watchlist entries for this movie
//
// Without CASCADE, you'd have to manually delete all related
// records first, or the DELETE would fail due to foreign key
// constraints.
// ============================================================
export const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;

    // RETURNING * → gives us back the deleted movie data
    // This lets us confirm WHAT was deleted in the response
    const result = await pool.query(
      'DELETE FROM movies WHERE movie_id = $1 RETURNING *',
      [id]
    );

    // If no rows returned, the movie didn't exist
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Confirm deletion with the deleted movie's data
    // Thanks to CASCADE, all related data is already gone
    res.json({ message: 'Movie deleted successfully', movie: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
