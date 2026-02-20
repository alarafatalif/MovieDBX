import pool from './db.js';

const moviesToAdd = [
  {
    title: 'Mad Max: Fury Road',
    description: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshiper, and a drifter named Max.',
    year: 2015,
    duration: 120,
    has_oscar: true,
    genres: ['Action', 'Sci-Fi']
  },
  {
    title: 'John Wick',
    description: 'An ex-hit-man comes out of retirement to track down the gangsters that killed his dog and took everything from him.',
    year: 2014,
    duration: 101,
    has_oscar: false,
    genres: ['Action', 'Thriller']
  },
  {
    title: 'Mission: Impossible - Fallout',
    description: 'Ethan Hunt and his IMF team, along with some familiar allies, race against time after a mission gone wrong.',
    year: 2018,
    duration: 147,
    has_oscar: false,
    genres: ['Action', 'Thriller']
  },
  {
    title: 'Spider-Man: Into the Spider-Verse',
    description: 'Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.',
    year: 2018,
    duration: 117,
    has_oscar: true,
    genres: ['Action', 'Sci-Fi']
  },
  {
    title: 'The Raid',
    description: 'A S.W.A.T. team becomes trapped in a tenement run by a ruthless mobster and his army of killers and thugs.',
    year: 2011,
    duration: 101,
    has_oscar: false,
    genres: ['Action', 'Thriller']
  },

  {
    title: '12 Years a Slave',
    description: 'In the antebellum United States, Solomon Northup, a free black man from upstate New York, is abducted and sold into slavery.',
    year: 2013,
    duration: 134,
    has_oscar: true,
    genres: ['Drama']
  },
  {
    title: 'Moonlight',
    description: 'A young African-American man grapples with his identity and sexuality while experiencing the everyday struggles of childhood, adolescence, and burgeoning adulthood.',
    year: 2016,
    duration: 111,
    has_oscar: true,
    genres: ['Drama']
  },
  {
    title: 'The Pianist',
    description: 'A Polish Jewish musician struggles to survive the destruction of the Warsaw ghetto of World War II.',
    year: 2002,
    duration: 150,
    has_oscar: true,
    genres: ['Drama']
  },
  {
    title: 'Room',
    description: 'Held captive for 7 years in an enclosed space, a woman and her young son finally gain their freedom, allowing the boy to experience the outside world for the first time.',
    year: 2015,
    duration: 118,
    has_oscar: true,
    genres: ['Drama', 'Thriller']
  },
  {
    title: 'The Grand Budapest Hotel',
    description: 'A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy in the hotel\'s glorious years under an exceptional concierge.',
    year: 2014,
    duration: 99,
    has_oscar: true,
    genres: ['Drama', 'Comedy']
  },

  {
    title: 'Blade Runner 2049',
    description: 'Young Blade Runner K\'s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who\'s been missing for thirty years.',
    year: 2017,
    duration: 164,
    has_oscar: true,
    genres: ['Sci-Fi', 'Thriller']
  },
  {
    title: 'Arrival',
    description: 'A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.',
    year: 2016,
    duration: 116,
    has_oscar: false,
    genres: ['Sci-Fi', 'Drama']
  },
  {
    title: 'Ex Machina',
    description: 'A young programmer is selected to participate in a ground-breaking experiment in synthetic intelligence by evaluating the human qualities of a highly advanced humanoid A.I.',
    year: 2014,
    duration: 108,
    has_oscar: true,
    genres: ['Sci-Fi', 'Thriller']
  },
  {
    title: 'Dune',
    description: 'Feature adaptation of Frank Herbert\'s science fiction novel about the son of a noble family entrusted with the protection of the most valuable asset in the galaxy.',
    year: 2021,
    duration: 155,
    has_oscar: true,
    genres: ['Sci-Fi', 'Action']
  },
  {
    title: 'Edge of Tomorrow',
    description: 'A soldier fighting aliens gets to relive the same day over and over again, the day restarting every time he dies.',
    year: 2014,
    duration: 113,
    has_oscar: false,
    genres: ['Sci-Fi', 'Action']
  },

  {
    title: 'Get Out',
    description: 'A young African-American visits his white girlfriend\'s parents for the weekend, where his simmering uneasiness about their reception of him eventually reaches a boiling point.',
    year: 2017,
    duration: 104,
    has_oscar: true,
    genres: ['Thriller', 'Horror']
  },
  {
    title: 'Gone Girl',
    description: 'With his wife\'s disappearance having become the focus of an intense media circus, a man sees the spotlight turned on him when it\'s suspected that he may not be innocent.',
    year: 2014,
    duration: 149,
    has_oscar: false,
    genres: ['Thriller', 'Drama']
  },
  {
    title: 'Shutter Island',
    description: 'In 1954, a U.S. Marshal investigates the disappearance of a murderer who escaped from a hospital for the criminally insane.',
    year: 2010,
    duration: 138,
    has_oscar: false,
    genres: ['Thriller', 'Drama']
  },
  {
    title: 'A Quiet Place',
    description: 'In a post-apocalyptic world, a family is forced to live in silence while hiding from monsters with ultra-sensitive hearing.',
    year: 2018,
    duration: 90,
    has_oscar: false,
    genres: ['Horror', 'Thriller']
  },
  {
    title: 'Hereditary',
    description: 'A grieving family is haunted by tragic and disturbing occurrences after the death of their secretive grandmother.',
    year: 2018,
    duration: 127,
    has_oscar: false,
    genres: ['Horror', 'Thriller']
  },

  {
    title: 'The Grand Budapest Hotel',
    description: 'The adventures of Gustave H, a legendary concierge at a famous hotel from the fictional Republic of Zubrowka.',
    year: 2014,
    duration: 99,
    has_oscar: true,
    genres: ['Comedy', 'Drama']
  },
  {
    title: 'Knives Out',
    description: 'A detective investigates the death of a patriarch of an eccentric, combative family.',
    year: 2019,
    duration: 130,
    has_oscar: false,
    genres: ['Comedy', 'Crime']
  },
  {
    title: 'The Nice Guys',
    description: 'In 1970s Los Angeles, a mismatched pair of private eyes investigate a missing girl and the mysterious death of a porn star.',
    year: 2016,
    duration: 116,
    has_oscar: false,
    genres: ['Comedy', 'Action']
  },
  {
    title: 'Jojo Rabbit',
    description: 'A young boy in Hitler\'s army finds out his mother is hiding a Jewish girl in their home.',
    year: 2019,
    duration: 108,
    has_oscar: true,
    genres: ['Comedy', 'Drama']
  },
  {
    title: 'The Hangover',
    description: 'Three buddies wake up from a bachelor party in Las Vegas, with no memory of the previous night and the bachelor missing.',
    year: 2009,
    duration: 100,
    has_oscar: false,
    genres: ['Comedy']
  },

  {
    title: 'La La Land',
    description: 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.',
    year: 2016,
    duration: 128,
    has_oscar: true,
    genres: ['Romance', 'Drama']
  },
  {
    title: 'The Notebook',
    description: 'A poor yet passionate young man falls in love with a rich young woman, giving her a sense of freedom, but they are soon separated because of their social differences.',
    year: 2004,
    duration: 123,
    has_oscar: false,
    genres: ['Romance', 'Drama']
  },
  {
    title: 'Call Me by Your Name',
    description: 'In 1980s Italy, romance blossoms between a seventeen-year-old student and the older man hired as his father\'s research assistant.',
    year: 2017,
    duration: 132,
    has_oscar: true,
    genres: ['Romance', 'Drama']
  },
  {
    title: 'Crazy Rich Asians',
    description: 'This contemporary romantic comedy follows native New Yorker Rachel Chu to Singapore to meet her boyfriend\'s family.',
    year: 2018,
    duration: 120,
    has_oscar: false,
    genres: ['Romance', 'Comedy']
  },
  {
    title: 'The Shape of Water',
    description: 'At a top secret research facility in the 1960s, a lonely janitor forms a unique relationship with an amphibious creature that is being held in captivity.',
    year: 2017,
    duration: 123,
    has_oscar: true,
    genres: ['Romance', 'Drama']
  },

  {
    title: 'The Departed',
    description: 'An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in South Boston.',
    year: 2006,
    duration: 151,
    has_oscar: true,
    genres: ['Crime', 'Drama']
  },
  {
    title: 'No Country for Old Men',
    description: 'Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and more than two million dollars in cash near the Rio Grande.',
    year: 2007,
    duration: 122,
    has_oscar: true,
    genres: ['Crime', 'Thriller']
  },
  {
    title: 'The Town',
    description: 'A proficient group of thieves rob a bank and hold Claire, the assistant manager, hostage. Things begin to get complicated when one of the crew members falls in love with Claire.',
    year: 2010,
    duration: 125,
    has_oscar: false,
    genres: ['Crime', 'Drama']
  },
  {
    title: 'Hell or High Water',
    description: 'A divorced father and his ex-con older brother resort to a desperate scheme in order to save their family\'s ranch in West Texas.',
    year: 2016,
    duration: 102,
    has_oscar: false,
    genres: ['Crime', 'Drama']
  },
  {
    title: 'Wind River',
    description: 'A veteran tracker with the Fish and Wildlife Service helps to investigate the murder of a young Native American woman, and uses the case as a means of seeking redemption.',
    year: 2017,
    duration: 107,
    has_oscar: false,
    genres: ['Crime', 'Thriller']
  },

  {
    title: 'Whiplash',
    description: 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student\'s potential.',
    year: 2014,
    duration: 106,
    has_oscar: true,
    genres: ['Drama']
  },
  {
    title: 'Baby Driver',
    description: 'After being coerced into working for a crime boss, a young getaway driver finds himself taking part in a heist doomed to fail.',
    year: 2017,
    duration: 113,
    has_oscar: false,
    genres: ['Action', 'Crime']
  },
  {
    title: 'The Social Network',
    description: 'As Harvard student Mark Zuckerberg creates the social networking site that would become known as Facebook, he is sued by the twins who claimed he stole their idea.',
    year: 2010,
    duration: 120,
    has_oscar: true,
    genres: ['Drama']
  },
  {
    title: 'Django Unchained',
    description: 'With the help of a German bounty-hunter, a freed slave sets out to rescue his wife from a brutal plantation owner in Mississippi.',
    year: 2012,
    duration: 165,
    has_oscar: true,
    genres: ['Drama', 'Action']
  },
  {
    title: 'Joker',
    description: 'In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral of revolution and bloody crime.',
    year: 2019,
    duration: 122,
    has_oscar: true,
    genres: ['Drama', 'Thriller']
  }
];
const seriesToAdd = [
  {
    title: 'Breaking Bad',
    description: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family\'s future.',
    year: 2008,
    duration: 49,
    has_oscar: false,
    genres: ['Drama', 'Crime']
  },
  {
    title: 'Game of Thrones',
    description: 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
    year: 2011,
    duration: 60,
    has_oscar: false,
    genres: ['Drama', 'Action']
  },
  {
    title: 'Stranger Things',
    description: 'When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces in order to get him back.',
    year: 2016,
    duration: 50,
    has_oscar: false,
    genres: ['Sci-Fi', 'Horror']
  },
  {
    title: 'The Crown',
    description: 'Follows the political rivalries and romance of Queen Elizabeth II\'s reign and the events that shaped the second half of the twentieth century.',
    year: 2016,
    duration: 58,
    has_oscar: false,
    genres: ['Drama']
  },
  {
    title: 'The Mandalorian',
    description: 'The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.',
    year: 2019,
    duration: 40,
    has_oscar: false,
    genres: ['Sci-Fi', 'Action']
  },
  {
    title: 'The Last of Us',
    description: 'After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity\'s last hope.',
    year: 2023,
    duration: 60,
    has_oscar: false,
    genres: ['Drama', 'Horror']
  },
  {
    title: 'True Detective',
    description: 'Seasonal anthology series in which police investigations unearth the personal and professional secrets of those involved, both within and outside the law.',
    year: 2014,
    duration: 55,
    has_oscar: false,
    genres: ['Crime', 'Thriller']
  },
  {
    title: 'Succession',
    description: 'The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their father steps down from the company.',
    year: 2018,
    duration: 60,
    has_oscar: false,
    genres: ['Drama']
  },
  {
    title: 'The Bear',
    description: 'A young chef from the fine dining world comes home to Chicago to run his family sandwich shop.',
    year: 2022,
    duration: 30,
    has_oscar: false,
    genres: ['Drama', 'Comedy']
  },
  {
    title: 'Wednesday',
    description: 'Follows Wednesday Addams\' years as a student at Nevermore Academy, where she tries to master her emerging psychic ability.',
    year: 2022,
    duration: 50,
    has_oscar: false,
    genres: ['Comedy', 'Horror']
  }
];

const moviesToRemove = [
];

const manageMovies = async () => {
  try {
    console.log('🎨 Movie Manager Started\n');

    if (moviesToRemove.length > 0) {
      console.log('🗑️  Removing movies...\n');

      for (const title of moviesToRemove) {
        const result = await pool.query(
          'DELETE FROM movies WHERE title = $1 RETURNING title',
          [title]
        );

        if (result.rows.length > 0) {
          console.log(`  ❌ Removed: ${title}`);
        } else {
          console.log(`  ⚠️  Not found: ${title}`);
        }
      }
      console.log('');
    }

    if (moviesToAdd.length > 0) {
      console.log('➕ Adding movies...\n');

      for (const movie of moviesToAdd) {
        const existCheck = await pool.query(
          'SELECT movie_id FROM movies WHERE title = $1',
          [movie.title]
        );

        if (existCheck.rows.length > 0) {
          console.log(`  ⚠️  Already exists: ${movie.title}`);
          continue; // Skip to next movie
        }

        const result = await pool.query(`
          INSERT INTO movies (title, description, release_year, duration, has_oscar)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING movie_id, title
        `, [movie.title, movie.description, movie.year, movie.duration, movie.has_oscar]);

        const movieId = result.rows[0].movie_id;
        console.log(`  ✅ Added: ${movie.title} (ID: ${movieId})`);

        for (const genreName of movie.genres) {
          const genreResult = await pool.query(
            'SELECT genre_id FROM genres WHERE genre_name = $1',
            [genreName]
          );

          if (genreResult.rows.length > 0) {
            await pool.query(
              'INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2)',
              [movieId, genreResult.rows[0].genre_id]
            );
          }
        }
      }
      console.log('');
    }

    if (seriesToAdd.length > 0) {
      console.log('📺 Adding series...\n');

      for (const series of seriesToAdd) {
        const existCheck = await pool.query(
          'SELECT movie_id FROM movies WHERE title = $1',
          [series.title]
        );

        if (existCheck.rows.length > 0) {
          console.log(`  ⚠️  Already exists: ${series.title}`);
          continue;
        }

        const result = await pool.query(`
          INSERT INTO movies (title, description, release_year, duration, has_oscar)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING movie_id, title
        `, [series.title, series.description, series.year, series.duration, series.has_oscar]);

        const seriesId = result.rows[0].movie_id;
        console.log(`  ✅ Added: ${series.title} (ID: ${seriesId})`);

        for (const genreName of series.genres) {
          const genreResult = await pool.query(
            'SELECT genre_id FROM genres WHERE genre_name = $1',
            [genreName]
          );

          if (genreResult.rows.length > 0) {
            await pool.query(
              'INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2)',
              [seriesId, genreResult.rows[0].genre_id]
            );
          }
        }
      }
      console.log('');
    }

    console.log('📊 Current movies/series in database:\n');
    const allMovies = await pool.query(
      'SELECT movie_id, title, release_year FROM movies ORDER BY movie_id'
    );

    allMovies.rows.forEach(movie => {
      console.log(`  ${movie.movie_id}. ${movie.title} (${movie.release_year})`);
    });

    console.log(`\n📈 Total: ${allMovies.rows.length} movies/series\n`);
    console.log('✅ Done!\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
};

manageMovies();
