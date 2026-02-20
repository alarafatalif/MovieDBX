import pool from './db.js';

const updateSeries = async () => {
  try {
    console.log('🔄 Updating series with episodes, trailers...');

    // 1. Add new columns if they don't exist
    await pool.query(`
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS total_episodes INTEGER;
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS episodes_per_season JSONB;
    `);
    console.log('✅ total_episodes & episodes_per_season columns added');

    // 2. Series data: episodes per season + trailer URLs
    const seriesData = [
      {
        title: 'Breaking Bad',
        total_episodes: 62,
        episodes_per_season: [
          { season: 1, episodes: 7 },
          { season: 2, episodes: 13 },
          { season: 3, episodes: 13 },
          { season: 4, episodes: 13 },
          { season: 5, episodes: 16 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=HhesaQXLuRY'
      },
      {
        title: 'Game of Thrones',
        total_episodes: 73,
        episodes_per_season: [
          { season: 1, episodes: 10 },
          { season: 2, episodes: 10 },
          { season: 3, episodes: 10 },
          { season: 4, episodes: 10 },
          { season: 5, episodes: 10 },
          { season: 6, episodes: 10 },
          { season: 7, episodes: 7 },
          { season: 8, episodes: 6 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=KPLWWIOCOOQ'
      },
      {
        title: 'Stranger Things',
        total_episodes: 34,
        episodes_per_season: [
          { season: 1, episodes: 8 },
          { season: 2, episodes: 9 },
          { season: 3, episodes: 8 },
          { season: 4, episodes: 9 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=b9EkMc79ZSU'
      },
      {
        title: 'The Witcher',
        total_episodes: 24,
        episodes_per_season: [
          { season: 1, episodes: 8 },
          { season: 2, episodes: 8 },
          { season: 3, episodes: 8 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=ndl1W4ltcmg'
      },
      {
        title: 'Money Heist',
        total_episodes: 41,
        episodes_per_season: [
          { season: 1, episodes: 9 },
          { season: 2, episodes: 6 },
          { season: 3, episodes: 8 },
          { season: 4, episodes: 8 },
          { season: 5, episodes: 10 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=p_PJbmrX4uk'
      },
      {
        title: 'Dark',
        total_episodes: 26,
        episodes_per_season: [
          { season: 1, episodes: 10 },
          { season: 2, episodes: 8 },
          { season: 3, episodes: 8 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=rrwycJ08PSA'
      },
      {
        title: 'The Crown',
        total_episodes: 60,
        episodes_per_season: [
          { season: 1, episodes: 10 },
          { season: 2, episodes: 10 },
          { season: 3, episodes: 10 },
          { season: 4, episodes: 10 },
          { season: 5, episodes: 10 },
          { season: 6, episodes: 10 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=JWtnJjn6ng0'
      },
      {
        title: 'Peaky Blinders',
        total_episodes: 36,
        episodes_per_season: [
          { season: 1, episodes: 6 },
          { season: 2, episodes: 6 },
          { season: 3, episodes: 6 },
          { season: 4, episodes: 6 },
          { season: 5, episodes: 6 },
          { season: 6, episodes: 6 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=oVzVdvGIC7U'
      },
      {
        title: 'The Mandalorian',
        total_episodes: 24,
        episodes_per_season: [
          { season: 1, episodes: 8 },
          { season: 2, episodes: 8 },
          { season: 3, episodes: 8 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=aOC8E8z_ifw'
      },
      {
        title: 'Chernobyl',
        total_episodes: 5,
        episodes_per_season: [
          { season: 1, episodes: 5 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=s9APLXM9Ei8'
      },
      {
        title: 'The Last of Us',
        total_episodes: 16,
        episodes_per_season: [
          { season: 1, episodes: 9 },
          { season: 2, episodes: 7 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=uLtkt8BonwM'
      },
      {
        title: 'Wednesday',
        total_episodes: 8,
        episodes_per_season: [
          { season: 1, episodes: 8 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=Di310WS8zLk'
      },
      {
        title: 'Squid Game',
        total_episodes: 16,
        episodes_per_season: [
          { season: 1, episodes: 9 },
          { season: 2, episodes: 7 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=oqxAJKy0ii4'
      },
      {
        title: 'The Boys',
        total_episodes: 32,
        episodes_per_season: [
          { season: 1, episodes: 8 },
          { season: 2, episodes: 8 },
          { season: 3, episodes: 8 },
          { season: 4, episodes: 8 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=tcrNsIaQkb4'
      },
      {
        title: 'Arcane',
        total_episodes: 18,
        episodes_per_season: [
          { season: 1, episodes: 9 },
          { season: 2, episodes: 9 }
        ],
        trailer_url: 'https://www.youtube.com/watch?v=fXmAurh012s'
      }
    ];

    // 3. Update each series
    for (const s of seriesData) {
      await pool.query(
        `UPDATE movies 
         SET total_episodes = $1, 
             episodes_per_season = $2,
             trailer_url = $3
         WHERE title = $4 AND content_type = 'series'`,
        [s.total_episodes, JSON.stringify(s.episodes_per_season), s.trailer_url, s.title]
      );
      console.log(`  ✅ Updated: ${s.title}`);
    }

    console.log('🎉 All series updated with episodes & trailers!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating series:', error.message);
    await pool.end();
    process.exit(1);
  }
};

updateSeries();
