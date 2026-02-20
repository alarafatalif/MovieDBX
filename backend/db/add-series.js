import pool from './db.js';

const addSeries = async () => {
  try {
    console.log('🔄 Adding series support...');

    // 1. Add content_type and seasons columns if they don't exist
    await pool.query(`
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS content_type VARCHAR(10) DEFAULT 'movie';
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS seasons INTEGER;
    `);
    console.log('✅ content_type & seasons columns added');

    // 2. Mark all existing entries as movies
    await pool.query(`UPDATE movies SET content_type = 'movie' WHERE content_type IS NULL`);
    console.log('✅ Existing movies marked as type=movie');

    // 3. Add new genres that series commonly use
    await pool.query(`
      INSERT INTO genres (genre_name) VALUES
      ('Fantasy'),
      ('Mystery'),
      ('Adventure'),
      ('Animation'),
      ('Documentary'),
      ('Western')
      ON CONFLICT (genre_name) DO NOTHING
    `);
    console.log('✅ New genres added');

    // 4. Insert 15 series
    const seriesResult = await pool.query(`
      INSERT INTO movies (title, description, release_year, duration, has_oscar, content_type, seasons) VALUES
      (
        'Breaking Bad',
        'A high school chemistry teacher turned methamphetamine manufacturer partners with a former student to secure his family''s future.',
        2008, 49, false, 'series', 5
      ),
      (
        'Game of Thrones',
        'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns.',
        2011, 57, false, 'series', 8
      ),
      (
        'Stranger Things',
        'When a young boy disappears, his mother and friends uncover a series of extraordinary mysteries involving supernatural forces.',
        2016, 51, false, 'series', 4
      ),
      (
        'The Witcher',
        'Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.',
        2019, 60, false, 'series', 3
      ),
      (
        'Money Heist',
        'An unusual group of robbers attempt to carry out the most perfect robbery in Spanish history — stealing 2.4 billion euros from the Royal Mint.',
        2017, 50, false, 'series', 5
      ),
      (
        'Dark',
        'A family saga with a supernatural twist, set in a German town where the disappearance of two young children exposes relationships among four families.',
        2017, 52, false, 'series', 3
      ),
      (
        'The Crown',
        'Follows the political rivalries and romance of Queen Elizabeth II''s reign and the events that shaped the second half of the 20th century.',
        2016, 58, false, 'series', 6
      ),
      (
        'Peaky Blinders',
        'A gangster family epic set in 1900s England, centering on a gang who sew razor blades in the peaks of their caps.',
        2013, 55, false, 'series', 6
      ),
      (
        'The Mandalorian',
        'The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.',
        2019, 40, false, 'series', 3
      ),
      (
        'Chernobyl',
        'In April 1986, an explosion at the Chernobyl nuclear power plant in Ukraine becomes one of the world''s worst man-made catastrophes.',
        2019, 65, false, 'series', 1
      ),
      (
        'The Last of Us',
        'After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl on a dangerous journey across what remains of the United States.',
        2023, 55, false, 'series', 2
      ),
      (
        'Wednesday',
        'Follows Wednesday Addams'' years as a student at Nevermore Academy, where she attempts to master her psychic ability.',
        2022, 48, false, 'series', 1
      ),
      (
        'Squid Game',
        'Hundreds of cash-strapped players accept a strange invitation to compete in children''s games for a tempting prize, but the stakes are deadly.',
        2021, 54, false, 'series', 2
      ),
      (
        'The Boys',
        'A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers.',
        2019, 58, false, 'series', 4
      ),
      (
        'Arcane',
        'Set in the utopian Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League of Legends champions.',
        2021, 42, false, 'series', 2
      )
      RETURNING movie_id, title
    `);
    console.log(`✅ ${seriesResult.rows.length} series added`);

    // 5. Link series to genres
    // We'll get genre IDs dynamically
    const getGenreId = async (name) => {
      const r = await pool.query('SELECT genre_id FROM genres WHERE genre_name = $1', [name]);
      return r.rows.length > 0 ? r.rows[0].genre_id : null;
    };

    const seriesGenres = {
      'Breaking Bad': ['Drama', 'Crime', 'Thriller'],
      'Game of Thrones': ['Fantasy', 'Drama', 'Adventure'],
      'Stranger Things': ['Sci-Fi', 'Horror', 'Drama'],
      'The Witcher': ['Fantasy', 'Action', 'Adventure'],
      'Money Heist': ['Crime', 'Thriller', 'Drama'],
      'Dark': ['Sci-Fi', 'Mystery', 'Thriller'],
      'The Crown': ['Drama'],
      'Peaky Blinders': ['Crime', 'Drama'],
      'The Mandalorian': ['Sci-Fi', 'Action', 'Adventure'],
      'Chernobyl': ['Drama', 'Thriller'],
      'The Last of Us': ['Drama', 'Action', 'Horror'],
      'Wednesday': ['Comedy', 'Mystery', 'Fantasy'],
      'Squid Game': ['Thriller', 'Drama'],
      'The Boys': ['Action', 'Comedy', 'Sci-Fi'],
      'Arcane': ['Animation', 'Action', 'Fantasy'],
    };

    for (const row of seriesResult.rows) {
      const genreNames = seriesGenres[row.title] || [];
      for (const gName of genreNames) {
        const gId = await getGenreId(gName);
        if (gId) {
          await pool.query(
            'INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [row.movie_id, gId]
          );
        }
      }
    }
    console.log('✅ Series-genre relationships added');

    console.log('🎉 Series setup complete!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding series:', error.message);
    await pool.end();
    process.exit(1);
  }
};

addSeries();
