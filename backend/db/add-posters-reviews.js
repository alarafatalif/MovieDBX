import pool from './db.js';
import bcrypt from 'bcrypt';

const run = async () => {
  try {
    console.log('🔄 Adding posters, reviews, and cleaning duplicates...\n');

    // ── 1. Delete old duplicate entries (IDs 55-64) that were seeded as type='movie' ──
    await pool.query(`DELETE FROM movies WHERE movie_id IN (55,56,57,58,59,60,61,62,63,64)`);
    console.log('✅ Removed 10 duplicate entries (IDs 55-64)');

    // ── 2. Add poster URLs for all 15 series (IDs 65-79) ──
    const seriesPosters = [
      { title: 'Breaking Bad',    poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg' },
      { title: 'Game of Thrones', poster: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg' },
      { title: 'Stranger Things',  poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg' },
      { title: 'The Witcher',     poster: 'https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg' },
      { title: 'Money Heist',     poster: 'https://image.tmdb.org/t/p/w500/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg' },
      { title: 'Dark',            poster: 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg' },
      { title: 'The Crown',       poster: 'https://image.tmdb.org/t/p/w500/1M876KPjulVwppEpldhdc8V4o68.jpg' },
      { title: 'Peaky Blinders',  poster: 'https://image.tmdb.org/t/p/w500/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg' },
      { title: 'The Mandalorian', poster: 'https://image.tmdb.org/t/p/w500/eU1i6eHXlzMOlEq0ku1Bdo719Nm.jpg' },
      { title: 'Chernobyl',       poster: 'https://image.tmdb.org/t/p/w500/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg' },
      { title: 'The Last of Us',  poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg' },
      { title: 'Wednesday',       poster: 'https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg' },
      { title: 'Squid Game',      poster: 'https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg' },
      { title: 'The Boys',        poster: 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg' },
      { title: 'Arcane',          poster: 'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg' },
    ];

    for (const s of seriesPosters) {
      await pool.query(
        `UPDATE movies SET poster_url = $1 WHERE title = $2 AND content_type = 'series'`,
        [s.poster, s.title]
      );
    }
    console.log('✅ Poster URLs added to all 15 series');

    // ── 3. Create reviewer users for realistic reviews ──
    const reviewers = [
      { username: 'CinematicCritic',   email: 'critic@moviedbx.com' },
      { username: 'FilmFanatic92',     email: 'fanatic@moviedbx.com' },
      { username: 'ReelTalkReviews',   email: 'reeltalk@moviedbx.com' },
      { username: 'PopcornPundit',     email: 'popcorn@moviedbx.com' },
      { username: 'ScreenSavant',      email: 'savant@moviedbx.com' },
      { username: 'MovieMaven',        email: 'maven@moviedbx.com' },
      { username: 'TheFrameJunkie',    email: 'frame@moviedbx.com' },
      { username: 'BingeWatcher101',   email: 'binge@moviedbx.com' },
    ];

    const hashedPw = await bcrypt.hash('reviewer123', 10);
    const userIds = [];

    for (const r of reviewers) {
      const res = await pool.query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email
         RETURNING user_id`,
        [r.username, r.email, hashedPw]
      );
      userIds.push(res.rows[0].user_id);
    }
    console.log(`✅ ${reviewers.length} reviewer accounts created (IDs: ${userIds.join(', ')})`);

    // ── 4. Add reviews ──
    // Helper to get movie_id by title and optional type
    const getMovieId = async (title, type = null) => {
      let q = 'SELECT movie_id FROM movies WHERE title = $1';
      const vals = [title];
      if (type) {
        q += ' AND content_type = $2';
        vals.push(type);
      }
      q += ' LIMIT 1';
      const r = await pool.query(q, vals);
      return r.rows.length > 0 ? r.rows[0].movie_id : null;
    };

    // Reviews data: realistic reviews like you'd see on IMDb/Rotten Tomatoes
    const allReviews = [
      // ── MOVIES ──
      { title: 'The Godfather', reviews: [
        { user: 0, rating: 9.8, text: 'A masterclass in storytelling. Brando and Pacino deliver performances that define cinema. The pacing, the music, the dialogue — everything is pitch-perfect. This is not just a movie about the mafia; it is a profound exploration of family, loyalty, and the corrupting nature of power.' },
        { user: 1, rating: 9.5, text: 'Coppola crafted something timeless. The way the film builds tension through quiet moments rather than explosions is brilliant. The baptism scene intercut with the assassinations remains one of cinema\'s greatest sequences.' },
        { user: 2, rating: 10, text: 'I\'ve watched this film over 20 times and discover something new each viewing. The cinematography by Gordon Willis — "The Prince of Darkness" — creates an atmosphere that pulls you into this world completely. An offer you truly cannot refuse.' },
        { user: 3, rating: 9.0, text: 'The transformation of Michael Corleone from war hero to ruthless don is one of the most compelling character arcs ever filmed. The dinner scene in the Italian restaurant is acting at its finest.' },
      ]},
      { title: 'The Dark Knight', reviews: [
        { user: 0, rating: 9.5, text: 'Heath Ledger\'s Joker is the greatest villain performance in cinema history. Every scene he\'s in crackles with menacing energy. Nolan elevated the superhero genre into high art with this film.' },
        { user: 1, rating: 9.0, text: 'More than a superhero movie — it\'s a gripping crime thriller that happens to feature a man in a bat suit. The moral dilemmas, the Harvey Dent arc, the practical effects. Everything works.' },
        { user: 4, rating: 9.7, text: 'The interrogation scene between Batman and Joker is cinema perfection. Two opposing forces colliding with incredible dialogue and performances. Hans Zimmer\'s score elevates every single moment.' },
      ]},
      { title: 'Parasite', reviews: [
        { user: 2, rating: 9.5, text: 'Bong Joon-ho masterfully blends dark comedy, thriller, and social commentary into a seamless narrative. The way the film shifts tone — from funny to deeply unsettling — without ever feeling jarring is extraordinary filmmaking.' },
        { user: 3, rating: 9.8, text: 'A scathing critique of wealth inequality wrapped in a genre-bending thriller. Every frame is meticulously composed. The "smell" motif is subtle genius. Deserved every single Oscar it won.' },
        { user: 5, rating: 9.0, text: 'The less you know going in, the better. This film takes turns you genuinely cannot predict. The contrast between the Park family\'s modernist home and the Kim family\'s semi-basement tells the entire story in architecture.' },
      ]},
      { title: 'Inception', reviews: [
        { user: 0, rating: 9.0, text: 'Nolan built a puzzle-box blockbuster that respects the audience\'s intelligence. The rotating hallway fight is jaw-dropping, and the emotional core — Cobb\'s guilt over Mal — gives the spectacle real weight.' },
        { user: 4, rating: 8.5, text: 'A mind-bending heist film that layers dreams within dreams without losing coherence. The ensemble cast is fantastic. Hans Zimmer\'s "Time" might be the most emotionally devastating piece of film music ever composed.' },
        { user: 6, rating: 9.2, text: 'The ending — that spinning top — sparked more debate than any other film moment this century. Whether it falls or not doesn\'t matter; what matters is that Cobb walks away. Brilliant storytelling.' },
      ]},
      { title: 'The Shawshank Redemption', reviews: [
        { user: 1, rating: 10, text: 'Hope is a dangerous thing, and this film makes you feel every ounce of it. Tim Robbins and Morgan Freeman have possibly the greatest on-screen friendship in movie history. The final act is pure catharsis.' },
        { user: 3, rating: 9.8, text: 'A film that flopped at the box office but found eternal life through word of mouth. The storytelling is patient, warm, and rewards you for every minute invested. The rooftop beer scene is sublime.' },
        { user: 5, rating: 9.5, text: 'Frank Darabont adapted Stephen King\'s novella into something transcendent. The narration by Morgan Freeman is iconic. It\'s a film about maintaining your humanity in inhuman conditions.' },
      ]},
      { title: 'Interstellar', reviews: [
        { user: 0, rating: 9.2, text: 'Nolan\'s most ambitious and emotionally devastating film. The docking scene had me gripping my seat, but it\'s the video messages scene that broke me. McConaughey sobbing watching his children grow up is heartbreaking.' },
        { user: 2, rating: 8.8, text: 'Hard science fiction meets raw human emotion. The visualization of a black hole — created with actual physics equations — is stunning. The organ-heavy score by Zimmer is overwhelming in the best way.' },
        { user: 6, rating: 9.0, text: 'Love as a dimension you can interact with sounds cheesy on paper, but Nolan earns it through 2.5 hours of meticulous storytelling. The time dilation on Miller\'s planet is the most gut-wrenching use of physics in cinema.' },
      ]},
      { title: 'Titanic', reviews: [
        { user: 1, rating: 8.5, text: 'Cameron created the definitive disaster film wrapped in an epic romance. The attention to historical detail is remarkable — from the china patterns to the ship\'s orchestra playing as it sinks. Winslet and DiCaprio have incredible chemistry.' },
        { user: 5, rating: 8.0, text: 'A technical marvel that still holds up visually decades later. The sinking sequence is absolutely terrifying in its realism. Yes, there was room on that door, but the emotional impact is undeniable.' },
      ]},
      { title: 'The Matrix', reviews: [
        { user: 0, rating: 9.0, text: 'The Wachowskis created a new cinematic vocabulary with this film. Bullet time, the green-tinted visual style, the blend of cyberpunk and martial arts — everything about it was revolutionary. "What is the Matrix?" remains one of cinema\'s great questions.' },
        { user: 4, rating: 9.3, text: 'Philosophy wrapped in leather and sunglasses. The red pill/blue pill choice has become a cultural touchstone. The lobby shootout and the rooftop helicopter rescue are still exhilarating after countless viewings.' },
        { user: 7, rating: 8.8, text: 'Beyond the action spectacle, this is a genuinely thought-provoking film about reality, free will, and human consciousness. Keanu\'s "I know kung fu" might be the coolest line delivery in action movie history.' },
      ]},
      { title: 'Whiplash', reviews: [
        { user: 2, rating: 9.5, text: 'J.K. Simmons delivers a terrifyingly intense performance as Fletcher. The final drum solo is one of the most exhilarating climaxes in film. Chazelle asks a disturbing question: is greatness worth the cost of everything else?' },
        { user: 6, rating: 9.0, text: 'A psychological thriller disguised as a music drama. The editing in the performance scenes is razor-sharp — you can feel every cymbal crash. Miles Teller bleeds for his art, literally.' },
      ]},
      { title: 'Joker', reviews: [
        { user: 3, rating: 8.5, text: 'Joaquin Phoenix disappears into Arthur Fleck completely. His physical transformation and the way he carries pain in his body language is mesmerizing. The bathroom dance scene is haunting — beautiful and disturbing simultaneously.' },
        { user: 7, rating: 8.0, text: 'A character study that draws heavily from Taxi Driver and The King of Comedy, but Phoenix makes it his own. The staircase dance to Gary Glitter\'s "Rock and Roll Part 2" is an iconic cinema moment. Gotham has never felt this real.' },
      ]},
      { title: 'Django Unchained', reviews: [
        { user: 0, rating: 9.0, text: 'Tarantino takes a brutal chapter of American history and crafts a wildly entertaining revenge fantasy. DiCaprio\'s Candie is deliciously villainous, Waltz\'s Schultz is endlessly charming, and Foxx carries the emotional weight with quiet intensity.' },
        { user: 4, rating: 8.7, text: 'The dinner scene at Candyland is a masterclass in sustained tension. You can feel the danger radiating from every character. The Ennio Morricone-inspired score is perfect. Tarantino at the peak of his powers.' },
      ]},
      { title: 'Get Out', reviews: [
        { user: 2, rating: 9.0, text: 'Jordan Peele\'s directorial debut is a masterpiece of social horror. The sunken place is a terrifyingly perfect metaphor. Every rewatch reveals new details — the deer, the cotton, the teacup. Nothing is accidental.' },
        { user: 5, rating: 8.8, text: 'Horror has always been political, but Peele makes it personal. The genius is in how uncomfortable the "nice" white liberals make you feel. The TSA friend Rod provides perfect comic relief without undermining the tension.' },
      ]},
      { title: 'Dune', reviews: [
        { user: 0, rating: 8.8, text: 'Villeneuve achieved what was long considered impossible — a faithful, visually spectacular adaptation of Herbert\'s dense novel. The sandworm reveal gave me chills. Timothée Chalamet carries the weight of prophecy convincingly.' },
        { user: 6, rating: 9.0, text: 'The sound design alone deserves every award. You don\'t just watch Arrakis — you feel the sand in your bones. Greig Fraser\'s cinematography is otherworldly. This is what blockbuster filmmaking should aspire to be.' },
      ]},
      { title: 'La La Land', reviews: [
        { user: 1, rating: 8.5, text: 'Chazelle\'s love letter to old Hollywood musicals is bittersweet perfection. The Griffith Observatory sequence is pure magic, and that ending montage of "what could have been" is devastating. Gosling and Stone have effortless chemistry.' },
        { user: 3, rating: 8.0, text: 'A film about chasing dreams and the sacrifices that come with it. The opening freeway number is a technical marvel shot in one take. The epilogue might be the most emotionally complex ending in modern musical cinema.' },
      ]},
      { title: 'Mad Max: Fury Road', reviews: [
        { user: 4, rating: 9.5, text: 'George Miller, at 70 years old, made the greatest action film ever. Two hours of relentless forward momentum with more visual storytelling than most franchises manage in a decade. Furiosa is an all-time great character.' },
        { user: 7, rating: 9.0, text: 'Practical stunts, real vehicles, actual explosions — in an age of CGI overload, this feels like a miracle. The war rig chase through the sandstorm is cinema in its purest, most exhilarating form. WHAT A LOVELY DAY.' },
      ]},
      { title: 'Blade Runner 2049', reviews: [
        { user: 0, rating: 9.0, text: 'Villeneuve created a worthy sequel to Ridley Scott\'s masterpiece — which seemed impossible. Roger Deakins\' cinematography is maybe the most beautiful ever captured on film. The Joi hologram scene in the rain is hauntingly poetic.' },
        { user: 2, rating: 8.7, text: 'Slow, meditative, and visually stunning. This film asks what it means to be human and finds beauty in artificial life\'s longing for meaning. Ryan Gosling\'s restrained performance anchors the existential weight perfectly.' },
      ]},
      { title: 'The Social Network', reviews: [
        { user: 1, rating: 9.0, text: 'Sorkin\'s razor-sharp dialogue meets Fincher\'s clinical direction. The opening breakup scene sets the pace — rapid-fire, uncomfortable, brilliant. Eisenberg\'s Zuckerberg is simultaneously sympathetic and repellent. Trent Reznor\'s score is ice-cold perfection.' },
        { user: 6, rating: 8.8, text: 'A film about a website shouldn\'t be this compelling, but Fincher makes it a Shakespearean tragedy about ambition, jealousy, and betrayal in the digital age. The rowing regatta sequence set to "In the Hall of the Mountain King" is pure cinema.' },
      ]},

      // ── SERIES ──
      { title: 'Breaking Bad', type: 'series', reviews: [
        { user: 0, rating: 10, text: 'The greatest television series ever made. Walter White\'s transformation from mild-mannered teacher to Heisenberg is the most compelling character arc in TV history. Bryan Cranston delivers the performance of a lifetime — every season, every episode.' },
        { user: 1, rating: 9.8, text: 'Vince Gilligan crafted a perfect five-season story with an ending that actually delivers. The tension in "Ozymandias" is almost unbearable. Aaron Paul\'s Jesse Pinkman provides the emotional heart that keeps you invested through the darkness.' },
        { user: 2, rating: 9.5, text: 'What starts as a darkly comic premise becomes a Shakespearean tragedy. The cinematography of the New Mexico desert is stunning. Every character — Hank, Skyler, Mike, Gus — is fully realized. The train heist episode is the most tense hour of TV ever produced.' },
        { user: 5, rating: 9.7, text: 'This show respects its audience more than any other. The foreshadowing, the symbolism (the fly, the pink teddy bear), the callbacks — everything is intentional. Gus Fring walking out of the exploded room is the most shocking moment in television.' },
      ]},
      { title: 'Game of Thrones', type: 'series', reviews: [
        { user: 0, rating: 8.5, text: 'Seasons 1-4 are some of the greatest television ever produced. The Red Wedding, Tyrion\'s trial, the Battle of the Blackwater — unforgettable moments. The later seasons stumbled, but the first four years set a standard for prestige TV that hasn\'t been matched.' },
        { user: 3, rating: 8.0, text: 'An epic fantasy saga that proved the genre could dominate mainstream television. Peter Dinklage\'s Tyrion is the heart and soul of the show. The production values, the music by Ramin Djawadi, the scale of it all — nothing else comes close.' },
        { user: 7, rating: 7.5, text: 'The early seasons where the show faithfully adapted George R.R. Martin\'s novels are masterful television — complex, shocking, and deeply human. The quality dip in later seasons is disappointing, but the cultural impact is undeniable. Hardhome is peak TV.' },
      ]},
      { title: 'Stranger Things', type: 'series', reviews: [
        { user: 1, rating: 8.8, text: 'A love letter to 80s Spielberg and Stephen King that manages to feel fresh and original. The kids\' performances are remarkable — Millie Bobby Brown as Eleven is a revelation. Season 1 is nearly perfect television. The synth score by Kyle Dixon & Michael Stein is incredible.' },
        { user: 4, rating: 8.5, text: 'Captures the magic of childhood adventure while delivering genuine horror. The Upside Down is one of the most fully realized alternate dimensions in modern sci-fi. Season 4\'s Vecna arc brought the show back to its terrifying roots.' },
        { user: 7, rating: 8.0, text: 'The Duffer Brothers nailed the nostalgia factor without making it feel cheap. The ensemble cast grows with the show beautifully. "Running Up That Hill" becoming a cultural phenomenon again through this show proves its power.' },
      ]},
      { title: 'The Witcher', type: 'series', reviews: [
        { user: 3, rating: 7.5, text: 'Henry Cavill\'s dedication to Geralt is admirable — he clearly loves the source material. The fight choreography is excellent, particularly the Blaviken battle. The non-linear timeline in Season 1 is initially confusing but rewarding on rewatch.' },
        { user: 7, rating: 7.0, text: 'A solid fantasy series carried largely by Cavill\'s charisma and some impressive action sequences. The world-building improves each season. Joey Batey\'s Jaskier steals every scene he\'s in. "Toss a Coin to Your Witcher" is an earworm.' },
      ]},
      { title: 'Money Heist', type: 'series', reviews: [
        { user: 2, rating: 8.5, text: 'The Professor\'s master plan unfolds with addictive precision. This Spanish thriller proves that great storytelling transcends language barriers. Tokyo\'s narration adds urgency, and the ensemble cast makes you root for criminals. Bella Ciao never sounded so revolutionary.' },
        { user: 5, rating: 8.0, text: 'A heist series that keeps raising the stakes without jumping the shark (mostly). The character dynamics inside the Mint are fascinating — watching strangers become family under pressure. Berlin is one of the most complex antiheroes in recent TV.' },
      ]},
      { title: 'Dark', type: 'series', reviews: [
        { user: 0, rating: 9.5, text: 'The most intricately plotted show ever made. The way Dark weaves together multiple timelines, paradoxes, and family connections is staggering. Every detail matters. You need a family tree chart to follow it, and that\'s a compliment. German sci-fi at its absolute finest.' },
        { user: 6, rating: 9.2, text: 'Makes most time travel stories look like children\'s books. The show\'s commitment to its own internal logic is unmatched. Ben Frost\'s haunting score and the perpetually overcast aesthetic create an atmosphere of beautiful dread. The final season ties everything together masterfully.' },
      ]},
      { title: 'The Crown', type: 'series', reviews: [
        { user: 1, rating: 8.5, text: 'Peter Morgan transforms royal history into compelling human drama. Claire Foy\'s Elizabeth II and Olivia Colman\'s evolution of the character are both extraordinary. The production design is impeccable — every palace, every costume feels authentic.' },
        { user: 5, rating: 8.0, text: 'A fascinating exploration of duty versus personal desire. The show\'s strength is making you empathize with one of the most privileged families on Earth. The Diana seasons are heartbreaking. Imelda Staunton\'s final portrayal brings regal dignity to the role.' },
      ]},
      { title: 'Peaky Blinders', type: 'series', reviews: [
        { user: 3, rating: 8.8, text: 'Cillian Murphy\'s Tommy Shelby is one of TV\'s greatest antiheroes — calculating, haunted, magnetic. The anachronistic soundtrack choices (Nick Cave, Arctic Monkeys over 1920s Birmingham) shouldn\'t work but absolutely do. Style and substance in equal measure.' },
        { user: 4, rating: 8.5, text: 'A crime saga that gets more ambitious with each season. Tom Hardy\'s Alfie Solomons is a scene-stealing force of nature. The slow-motion walks set to rock music became iconic for a reason — pure television swagger.' },
      ]},
      { title: 'The Mandalorian', type: 'series', reviews: [
        { user: 1, rating: 8.5, text: 'Jon Favreau recaptured the spirit of the original Star Wars trilogy — simple storytelling with heart. Pedro Pascal gives a full performance behind a helmet. Baby Yoda (Grogu) is the most adorable character in the franchise. "This is the way" became an instant catchphrase.' },
        { user: 7, rating: 8.0, text: 'A space western that proves Star Wars works best on a personal scale. The episodic format allows for creative guest directors to put their stamp on each chapter. The practical effects and sets through StageCraft technology look incredible.' },
      ]},
      { title: 'Chernobyl', type: 'series', reviews: [
        { user: 0, rating: 9.8, text: 'The most terrifying miniseries ever made — because it actually happened. The first episode, depicting the immediate aftermath of the explosion, is almost unwatchable in its horror. Jared Harris and Stellan Skarsgård deliver career-defining performances. Essential viewing.' },
        { user: 2, rating: 9.5, text: 'Craig Mazin transformed a nuclear disaster into a meditation on truth, sacrifice, and institutional corruption. The bridge scene where citizens watch the reactor burn — unknowingly receiving lethal radiation — is haunting. The sound design is suffocatingly oppressive.' },
        { user: 6, rating: 9.7, text: 'Five episodes of pure, unrelenting brilliance. The show\'s thesis — "What is the cost of lies?" — resonates far beyond 1986 Soviet Union. The liquidators\' rooftop cleanup scene is the most stressful 10 minutes of television I have ever watched.' },
      ]},
      { title: 'The Last of Us', type: 'series', reviews: [
        { user: 1, rating: 9.0, text: 'The gold standard for video game adaptations. Pedro Pascal and Bella Ramsey have incredible chemistry as Joel and Ellie. Episode 3 — "Long, Long Time" with Nick Offerman and Murray Bartlett — is a standalone masterpiece that made the entire world cry.' },
        { user: 4, rating: 9.2, text: 'Craig Mazin proves Chernobyl was no fluke. The show respects the source material while making bold creative choices. The infected are genuinely terrifying, and the practical makeup effects are outstanding. The cold open with the 1968 talk show is a brilliant way to set the tone.' },
        { user: 5, rating: 8.8, text: 'This show understands that the monsters aren\'t the point — the human connections are. Joel\'s PTSD, Ellie\'s survivor guilt, the communities they encounter — every interaction feels earned. The Kansas City arc is thrilling television.' },
      ]},
      { title: 'Wednesday', type: 'series', reviews: [
        { user: 3, rating: 7.8, text: 'Jenna Ortega IS Wednesday Addams. Her deadpan delivery and physicality are perfect. Tim Burton\'s gothic aesthetic gives Nevermore Academy real personality. The dance scene went viral for good reason — it\'s magnetic. A fun YA mystery with genuine style.' },
        { user: 7, rating: 7.5, text: 'A charming series that works thanks to Ortega\'s commitment to the role. The mystery plotline is serviceable, but the character interactions are where it shines. Thing (the sentient hand) is surprisingly one of the most expressive characters on the show.' },
      ]},
      { title: 'Squid Game', type: 'series', reviews: [
        { user: 0, rating: 9.0, text: 'Hwang Dong-hyuk created a global phenomenon — childhood games turned into life-or-death competitions is horrifyingly brilliant. The "Red Light, Green Light" sequence is immediately iconic. Beneath the violence is a sharp critique of capitalism that resonates worldwide.' },
        { user: 2, rating: 8.8, text: 'K-drama meets Battle Royale with a social conscience. The ensemble cast brings real humanity to characters who could easily be archetypes. Player 001\'s twist is genuinely shocking. The set designs — those pastel-colored stairways — are nightmarishly beautiful.' },
        { user: 4, rating: 8.5, text: 'The marbles episode destroyed me emotionally. What makes Squid Game special is that it makes you feel for people you just met. The VIPs arc is the weakest element, but the core game sequences are masterfully tense. The glass bridge episode is pure anxiety.' },
      ]},
      { title: 'The Boys', type: 'series', reviews: [
        { user: 3, rating: 8.8, text: 'The superhero deconstruction we needed. Homelander is the most terrifying villain on TV — Antony Starr plays him with laser-eyed menace and fragile narcissism. The show is viciously funny, shockingly violent, and surprisingly politically sharp.' },
        { user: 6, rating: 8.5, text: 'Karl Urban\'s Butcher provides the perfect counterweight to Homelander\'s god complex. The show pulls no punches — literally. The satire of corporate America using superheroes as a vehicle for critique is genius. "Herogasm" is the most unhinged episode of TV ever made.' },
        { user: 7, rating: 9.0, text: 'What if Superman was evil and Amazon owned him? That\'s the pitch, and the execution is brilliant. Each season escalates the stakes while deepening the characters. Starlight\'s arc from naive hero to genuine rebel is beautifully written.' },
      ]},
      { title: 'Arcane', type: 'series', reviews: [
        { user: 0, rating: 9.5, text: 'The best animated series since Avatar: The Last Airbender. Fortiche\'s animation style — blending 3D characters with 2D painted backgrounds — is breathtaking. Vi and Jinx\'s relationship is emotionally devastating. You don\'t need to know League of Legends to be blown away.' },
        { user: 2, rating: 9.2, text: 'Riot Games had no business making something this good. Every frame could be a painting. The voice acting is superb — Ella Purnell\'s Jinx is heartbreakingly unhinged. The soundtrack (Imagine Dragons, Sting) is perfectly integrated. Animation as high art.' },
        { user: 5, rating: 9.0, text: 'Arcane proves that video game adaptations can be prestige television. The class struggle between Piltover and Zaun drives a narrative full of complex characters with no easy heroes or villains. Silco is a surprisingly sympathetic antagonist. The fight choreography is stunning.' },
      ]},
    ];

    let reviewCount = 0;
    for (const entry of allReviews) {
      const movieId = await getMovieId(entry.title, entry.type || null);
      if (!movieId) {
        console.log(`  ⚠️ Could not find: ${entry.title}`);
        continue;
      }
      for (const r of entry.reviews) {
        try {
          await pool.query(
            `INSERT INTO reviews (movie_id, user_id, rating, review_text)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (movie_id, user_id) DO NOTHING`,
            [movieId, userIds[r.user], r.rating, r.text]
          );
          reviewCount++;
        } catch (e) {
          console.log(`  ⚠️ Review skip: ${entry.title} by user ${r.user}: ${e.message}`);
        }
      }
    }
    console.log(`✅ ${reviewCount} reviews added across movies and series`);

    console.log('\n🎉 All posters and reviews added successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
};

run();
