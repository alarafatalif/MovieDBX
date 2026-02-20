// ============================================================
// seed.js — Populates the Database with Initial Sample Data
// ============================================================
// RUN THIS AFTER setup.js:
//   node db/seed.js
//
// WHAT IT DOES:
//   1. Inserts 8 genres (Action, Drama, Comedy, etc.)
//   2. Inserts 6 sample movies (The Godfather, Inception, etc.)
//   3. Links movies to their genres via the movie_genres junction table
//
// ON CONFLICT DO NOTHING:
//   This means if a genre already exists (e.g., you run this twice),
//   it won't crash with a duplicate error — it simply skips it.
//   This makes the script safe to re-run.
//
// RETURNING movie_id:
//   After INSERT, PostgreSQL returns the auto-generated IDs of the
//   newly inserted rows. We use this to confirm the movies were added.
// ============================================================

import pool from './db.js';

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    // ── Step 1: Add Genres ─────────────────────────────────────
    // These are the genre categories that movies can belong to.
    // ON CONFLICT (genre_name) DO NOTHING → skip if already exists
    await pool.query(`
      INSERT INTO genres (genre_name) VALUES
      ('Action'),
      ('Drama'),
      ('Comedy'),
      ('Sci-Fi'),
      ('Thriller'),
      ('Horror'),
      ('Romance'),
      ('Crime')
      ON CONFLICT (genre_name) DO NOTHING
    `);
    console.log('✅ Genres added');

    // ── Step 2: Add Movies ─────────────────────────────────────
    // Each movie gets an auto-generated movie_id (SERIAL PRIMARY KEY).
    // RETURNING movie_id → gives us back the IDs of the inserted rows.
    const movieResult = await pool.query(`
      INSERT INTO movies (title, description, release_year, duration, has_oscar) VALUES
      ('The Godfather', 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.', 1972, 175, true),
      ('The Dark Knight', 'When the menace known as the Joker emerges, Batman must accept one of the greatest tests.', 2008, 152, false),
      ('Parasite', 'Greed and class discrimination threaten the newly formed symbiotic relationship.', 2019, 132, true),
      ('Gladiator', 'A former Roman General sets out to exact vengeance against the corrupt emperor.', 2000, 155, true),
      ('Inception', 'A thief who steals corporate secrets through dream-sharing technology.', 2010, 148, false),
      ('The Shawshank Redemption', 'Two imprisoned men bond over years, finding redemption through acts of common decency.', 1994, 142, false)
      RETURNING movie_id
    `);
    console.log('✅ Movies added');

    // ── Step 3: Link Movies to Genres (Many-to-Many) ───────────
    // This populates the movie_genres junction table.
    // Each row says "this movie belongs to this genre".
    //
    // We use subqueries like (SELECT genre_id FROM genres WHERE genre_name = 'Drama')
    // instead of hardcoding genre IDs, because IDs might differ between databases.
    //
    // Example: Movie 1 (The Godfather) → Drama + Crime
    //          Movie 2 (The Dark Knight) → Action + Crime
    await pool.query(`
      INSERT INTO movie_genres (movie_id, genre_id) VALUES
      (1, (SELECT genre_id FROM genres WHERE genre_name = 'Drama')),
      (1, (SELECT genre_id FROM genres WHERE genre_name = 'Crime')),
      (2, (SELECT genre_id FROM genres WHERE genre_name = 'Action')),
      (2, (SELECT genre_id FROM genres WHERE genre_name = 'Crime')),
      (3, (SELECT genre_id FROM genres WHERE genre_name = 'Drama')),
      (3, (SELECT genre_id FROM genres WHERE genre_name = 'Thriller')),
      (4, (SELECT genre_id FROM genres WHERE genre_name = 'Action')),
      (4, (SELECT genre_id FROM genres WHERE genre_name = 'Drama')),
      (5, (SELECT genre_id FROM genres WHERE genre_name = 'Sci-Fi')),
      (5, (SELECT genre_id FROM genres WHERE genre_name = 'Action')),
      (6, (SELECT genre_id FROM genres WHERE genre_name = 'Drama'))
    `);
    console.log('✅ Movie-Genre relationships added');

    console.log('🎉 Database seeding complete!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    await pool.end();
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();