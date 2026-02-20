import pool from './db.js';

// ============================================================
// Add Netflix / streaming URLs for all movies and series
// ============================================================

const netflixData = [
  // ── MOVIES ──
  { title: 'The Lion King',                    netflix_url: 'https://www.netflix.com/title/18189396' },
  { title: 'Jurassic Park',                    netflix_url: 'https://www.netflix.com/title/60000724' },
  { title: 'Interstellar',                     netflix_url: 'https://www.netflix.com/title/70305903' },
  { title: 'The Matrix',                       netflix_url: 'https://www.netflix.com/title/20557937' },
  { title: 'Titanic',                          netflix_url: 'https://www.netflix.com/title/1181461' },
  { title: 'Forrest Gump',                     netflix_url: 'https://www.netflix.com/title/60000724' },
  { title: 'Avatar',                           netflix_url: 'https://www.netflix.com/title/70075064' },
  { title: 'The Silence of the Lambs',         netflix_url: 'https://www.netflix.com/title/14546747' },
  { title: 'The Avengers',                     netflix_url: 'https://www.netflix.com/title/70217913' },
  { title: 'The Godfather',                    netflix_url: 'https://www.netflix.com/title/60011152' },
  { title: 'The Dark Knight',                  netflix_url: 'https://www.netflix.com/title/70079583' },
  { title: 'Parasite',                         netflix_url: 'https://www.netflix.com/title/81227040' },
  { title: 'Gladiator',                        netflix_url: 'https://www.netflix.com/title/26736291' },
  { title: 'Inception',                        netflix_url: 'https://www.netflix.com/title/70131314' },
  { title: 'The Shawshank Redemption',         netflix_url: 'https://www.netflix.com/title/70005379' },
  { title: 'Mad Max: Fury Road',               netflix_url: 'https://www.netflix.com/title/80025919' },
  { title: 'John Wick',                        netflix_url: 'https://www.netflix.com/title/80013762' },
  { title: 'Mission: Impossible - Fallout',    netflix_url: 'https://www.netflix.com/title/81004279' },
  { title: 'Spider-Man: Into the Spider-Verse',netflix_url: 'https://www.netflix.com/title/81002747' },
  { title: 'The Raid',                         netflix_url: 'https://www.netflix.com/title/70262342' },
  { title: '12 Years a Slave',                 netflix_url: 'https://www.netflix.com/title/70274320' },
  { title: 'Moonlight',                        netflix_url: 'https://www.netflix.com/title/80121348' },
  { title: 'The Pianist',                      netflix_url: 'https://www.netflix.com/title/60025061' },
  { title: 'Room',                             netflix_url: 'https://www.netflix.com/title/80073950' },
  { title: 'The Grand Budapest Hotel',         netflix_url: 'https://www.netflix.com/title/70295915' },
  { title: 'Blade Runner 2049',                netflix_url: 'https://www.netflix.com/title/80185086' },
  { title: 'Arrival',                          netflix_url: 'https://www.netflix.com/title/80117533' },
  { title: 'Ex Machina',                       netflix_url: 'https://www.netflix.com/title/80023689' },
  { title: 'Dune',                             netflix_url: 'https://www.netflix.com/title/81340079' },
  { title: 'Edge of Tomorrow',                 netflix_url: 'https://www.netflix.com/title/70303377' },
  { title: 'Get Out',                          netflix_url: 'https://www.netflix.com/title/80149508' },
  { title: 'Gone Girl',                        netflix_url: 'https://www.netflix.com/title/70305893' },
  { title: 'Shutter Island',                   netflix_url: 'https://www.netflix.com/title/70095137' },
  { title: 'A Quiet Place',                    netflix_url: 'https://www.netflix.com/title/80227654' },
  { title: 'Hereditary',                       netflix_url: 'https://www.netflix.com/title/80199398' },
  { title: 'Knives Out',                       netflix_url: 'https://www.netflix.com/title/81037684' },
  { title: 'The Nice Guys',                    netflix_url: 'https://www.netflix.com/title/80079025' },
  { title: 'Jojo Rabbit',                      netflix_url: 'https://www.netflix.com/title/81186753' },
  { title: 'The Hangover',                     netflix_url: 'https://www.netflix.com/title/70113005' },
  { title: 'La La Land',                       netflix_url: 'https://www.netflix.com/title/80095365' },
  { title: 'The Notebook',                     netflix_url: 'https://www.netflix.com/title/60036227' },
  { title: 'Call Me by Your Name',             netflix_url: 'https://www.netflix.com/title/80169498' },
  { title: 'Crazy Rich Asians',                netflix_url: 'https://www.netflix.com/title/80230147' },
  { title: 'The Shape of Water',               netflix_url: 'https://www.netflix.com/title/80185425' },
  { title: 'The Departed',                     netflix_url: 'https://www.netflix.com/title/70044690' },
  { title: 'No Country for Old Men',           netflix_url: 'https://www.netflix.com/title/70071613' },
  { title: 'The Town',                         netflix_url: 'https://www.netflix.com/title/70135109' },
  { title: 'Hell or High Water',               netflix_url: 'https://www.netflix.com/title/80100067' },
  { title: 'Wind River',                       netflix_url: 'https://www.netflix.com/title/80149646' },
  { title: 'Whiplash',                         netflix_url: 'https://www.netflix.com/title/70299275' },
  { title: 'Baby Driver',                      netflix_url: 'https://www.netflix.com/title/80142090' },
  { title: 'The Social Network',               netflix_url: 'https://www.netflix.com/title/70132721' },
  { title: 'Django Unchained',                  netflix_url: 'https://www.netflix.com/title/70230640' },
  { title: 'Joker',                            netflix_url: 'https://www.netflix.com/title/81116004' },

  // ── SERIES ──
  { title: 'Breaking Bad',      netflix_url: 'https://www.netflix.com/title/70143836' },
  { title: 'Game of Thrones',   netflix_url: 'https://www.netflix.com/title/70220052' },
  { title: 'Stranger Things',   netflix_url: 'https://www.netflix.com/title/80057281' },
  { title: 'The Witcher',       netflix_url: 'https://www.netflix.com/title/80189685' },
  { title: 'Money Heist',       netflix_url: 'https://www.netflix.com/title/80192098' },
  { title: 'Dark',              netflix_url: 'https://www.netflix.com/title/80100172' },
  { title: 'The Crown',         netflix_url: 'https://www.netflix.com/title/80025678' },
  { title: 'Peaky Blinders',    netflix_url: 'https://www.netflix.com/title/80002479' },
  { title: 'The Mandalorian',   netflix_url: 'https://www.netflix.com/title/81230911' },
  { title: 'Chernobyl',         netflix_url: 'https://www.netflix.com/title/81005916' },
  { title: 'The Last of Us',    netflix_url: 'https://www.netflix.com/title/81435684' },
  { title: 'Wednesday',         netflix_url: 'https://www.netflix.com/title/81231974' },
  { title: 'Squid Game',        netflix_url: 'https://www.netflix.com/title/81040344' },
  { title: 'The Boys',          netflix_url: 'https://www.netflix.com/title/81036534' },
  { title: 'Arcane',            netflix_url: 'https://www.netflix.com/title/81435684' },
];

const addNetflixUrls = async () => {
  try {
    console.log('🎬 Adding Netflix URLs...\n');

    let updated = 0;
    let notFound = 0;

    for (const item of netflixData) {
      const result = await pool.query(
        'UPDATE movies SET netflix_url = $1 WHERE title = $2 RETURNING movie_id, title',
        [item.netflix_url, item.title]
      );

      if (result.rows.length > 0) {
        console.log(`  ✅ ${result.rows[0].title}`);
        updated++;
      } else {
        console.log(`  ⚠️  Not found: ${item.title}`);
        notFound++;
      }
    }

    console.log(`\n📊 Updated: ${updated} | Not found: ${notFound}`);
    console.log('✅ Done!\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
};

addNetflixUrls();
