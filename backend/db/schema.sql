
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
CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(genre_id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)  -- Composite primary key
);
-- Persons table (unified: actors, directors, writers — all in one table)
CREATE TABLE IF NOT EXISTS persons(
    person_id      SERIAL PRIMARY KEY,
    movie_id       INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
    name           VARCHAR(100) NOT NULL,
    role           VARCHAR(20) NOT NULL CHECK (role IN ('actor', 'director', 'writer')),
    character_name VARCHAR(100),  -- Only used for actors
    bio            TEXT,
    photo_url      TEXT
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
-- Reviews are almost always looked up by movie_id (show all reviews for a movie)
CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(movie_id);
-- Reviews also looked up by user_id (show all reviews by a user)
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
-- Watchlist almost always filtered by user_id
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);

-- movie_genres filtered by genre_id when filtering movies by genre
CREATE INDEX IF NOT EXISTS idx_movie_genres_genre_id ON movie_genres(genre_id);

-- persons looked up by movie_id to get a movie's cast/directors/writers
CREATE INDEX IF NOT EXISTS idx_persons_movie_id ON persons(movie_id);

-- persons filtered by role (actor, director, writer)
CREATE INDEX IF NOT EXISTS idx_persons_role ON persons(role);
