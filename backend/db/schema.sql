-- ============================================================
-- MovieDBX Database Schema
-- ============================================================
-- KEY CONCEPTS EXPLAINED:
--

-- ON DELETE CASCADE: When the parent row is deleted, child rows are
--   automatically deleted too. E.g., deleting a movie deletes its reviews.
-- UNIQUE: Ensures no two rows have the same value(s) in these column(s).
-- NOT NULL: This column can never be empty — enforced by the DB.
-- DEFAULT: What value to use if none is provided during INSERT.
-- CHECK: A validation rule enforced by the DB (e.g., rating between 0 and 10).
-- INDEX: A lookup structure that makes SELECT queries faster on that column.
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id     SERIAL PRIMARY KEY,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- Always store hashed, never plain text
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movies table
CREATE TABLE IF NOT EXISTS movies (
    movie_id     SERIAL PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    release_year INTEGER,
    duration     INTEGER,       -- in minutes (for series: avg episode length)
    poster_url   TEXT,
    trailer_url  TEXT,
    netflix_url  TEXT,
    has_oscar    BOOLEAN DEFAULT false,
    content_type VARCHAR(10) DEFAULT 'movie' CHECK (content_type IN ('movie', 'series')),
    seasons      INTEGER,       -- only for series
    total_episodes INTEGER,     -- only for series
    episodes_per_season JSONB,  -- e.g. [{"season":1,"episodes":7},{"season":2,"episodes":13}]
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Genres table
CREATE TABLE IF NOT EXISTS genres (
    genre_id   SERIAL PRIMARY KEY,
    genre_name VARCHAR(50) UNIQUE NOT NULL
);

-- Movie-Genre junction table (many-to-many)
-- A movie can have multiple genres; a genre can belong to many movies
-- The composite PRIMARY KEY prevents a movie from having the same genre twice
CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(genre_id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)  -- Composite primary key
);

-- Directors table
CREATE TABLE IF NOT EXISTS directors (
    director_id SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    bio         TEXT,
    photo_url   TEXT
);

-- Movie-Director junction table (many-to-many)
CREATE TABLE IF NOT EXISTS movie_directors (
    movie_id    INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
    director_id INTEGER REFERENCES directors(director_id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, director_id)
);

-- Actors table
CREATE TABLE IF NOT EXISTS actors (
    actor_id  SERIAL PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    bio       TEXT,
    photo_url TEXT
);

-- Movie-Actor junction table (many-to-many)
-- character_name is extra data that belongs to THIS RELATIONSHIP, not actors alone
-- (Same actor can play different characters in different movies)
CREATE TABLE IF NOT EXISTS movie_cast (
    movie_id       INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
    actor_id       INTEGER REFERENCES actors(actor_id) ON DELETE CASCADE,
    character_name VARCHAR(100),
    PRIMARY KEY (movie_id, actor_id)
);

-- Writers table
CREATE TABLE IF NOT EXISTS writers (
    writer_id SERIAL PRIMARY KEY,
    name      VARCHAR(100) NOT NULL
);

-- Movie-Writer junction table (many-to-many)
CREATE TABLE IF NOT EXISTS movie_writers (
    movie_id   INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
    writer_id  INTEGER REFERENCES writers(writer_id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, writer_id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    review_id   SERIAL PRIMARY KEY,
    movie_id    INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
    user_id     INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    rating      DECIMAL(4,1) CHECK (rating >= 0 AND rating <= 10),
    review_text TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(movie_id, user_id)  -- One review per user per movie
);

-- Watchlist table (junction table between users and movies)
-- watched column added: tracks if the user has seen the movie yet
CREATE TABLE IF NOT EXISTS watchlist (
    user_id  INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    watched  BOOLEAN DEFAULT false,  -- NEW: track watched status
    PRIMARY KEY (user_id, movie_id)
);

-- ============================================================
-- INDEXES — Speed up common queries
--
-- Without an index, PostgreSQL scans every row in the table (full table scan).
-- An index is like a book's index — it lets the DB jump directly to the right rows.
-- We add indexes on columns that appear frequently in WHERE clauses.
-- ============================================================

-- Reviews are almost always looked up by movie_id (show all reviews for a movie)
CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(movie_id);

-- Reviews also looked up by user_id (show all reviews by a user)
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Watchlist almost always filtered by user_id
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);

-- movie_genres filtered by genre_id when filtering movies by genre
CREATE INDEX IF NOT EXISTS idx_movie_genres_genre_id ON movie_genres(genre_id);

-- movie_cast looked up by movie_id to get a movie's cast
CREATE INDEX IF NOT EXISTS idx_movie_cast_movie_id ON movie_cast(movie_id);

-- movie_directors looked up by movie_id to get a movie's directors
CREATE INDEX IF NOT EXISTS idx_movie_directors_movie_id ON movie_directors(movie_id);

-- movie_writers looked up by movie_id to get a movie's writers
CREATE INDEX IF NOT EXISTS idx_movie_writers_movie_id ON movie_writers(movie_id);
