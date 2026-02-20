import pool from './db.js';

const fix = async () => {
  try {
    // Fix rating column to allow 10.0
    await pool.query('ALTER TABLE reviews ALTER COLUMN rating TYPE DECIMAL(4,1)');
    console.log('✅ Rating column updated to DECIMAL(4,1)');

    // Insert the 3 reviews that failed due to overflow
    const fixes = [
      {
        title: 'The Godfather',
        userId: 6,
        rating: 10,
        text: "I've watched this film over 20 times and discover something new each viewing. The cinematography by Gordon Willis — 'The Prince of Darkness' — creates an atmosphere that pulls you into this world completely. An offer you truly cannot refuse."
      },
      {
        title: 'The Shawshank Redemption',
        userId: 5,
        rating: 10,
        text: 'Hope is a dangerous thing, and this film makes you feel every ounce of it. Tim Robbins and Morgan Freeman have possibly the greatest on-screen friendship in movie history. The final act is pure catharsis.'
      },
      {
        title: 'Breaking Bad',
        userId: 4,
        rating: 10,
        text: "The greatest television series ever made. Walter White's transformation from mild-mannered teacher to Heisenberg is the most compelling character arc in TV history. Bryan Cranston delivers the performance of a lifetime — every season, every episode."
      }
    ];

    for (const r of fixes) {
      const mid = await pool.query('SELECT movie_id FROM movies WHERE title = $1 LIMIT 1', [r.title]);
      if (mid.rows.length) {
        await pool.query(
          'INSERT INTO reviews (movie_id, user_id, rating, review_text) VALUES ($1, $2, $3, $4) ON CONFLICT (movie_id, user_id) DO NOTHING',
          [mid.rows[0].movie_id, r.userId, r.rating, r.text]
        );
        console.log(`  ✅ Added 10/10 review for ${r.title}`);
      }
    }

    console.log('🎉 Done!');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌', err.message);
    await pool.end();
    process.exit(1);
  }
};

fix();
