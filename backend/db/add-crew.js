import pool from './db.js';

// ============================================================
// Seed writers table, actors, directors, and all junction tables
// for every movie and series in MovieDBX
// ============================================================

const movieCrewData = [
  // ── MOVIES ──
  {
    title: 'The Lion King',
    directors: ['Roger Allers', 'Rob Minkoff'],
    writers: ['Irene Mecchi', 'Jonathan Roberts', 'Linda Woolverton'],
    actors: [
      { name: 'Matthew Broderick', character: 'Simba' },
      { name: 'Jeremy Irons', character: 'Scar' },
      { name: 'James Earl Jones', character: 'Mufasa' },
      { name: 'Moira Kelly', character: 'Nala' },
    ]
  },
  {
    title: 'Jurassic Park',
    directors: ['Steven Spielberg'],
    writers: ['Michael Crichton', 'David Koepp'],
    actors: [
      { name: 'Sam Neill', character: 'Dr. Alan Grant' },
      { name: 'Laura Dern', character: 'Dr. Ellie Sattler' },
      { name: 'Jeff Goldblum', character: 'Dr. Ian Malcolm' },
      { name: 'Richard Attenborough', character: 'John Hammond' },
    ]
  },
  {
    title: 'Interstellar',
    directors: ['Christopher Nolan'],
    writers: ['Jonathan Nolan', 'Christopher Nolan'],
    actors: [
      { name: 'Matthew McConaughey', character: 'Cooper' },
      { name: 'Anne Hathaway', character: 'Brand' },
      { name: 'Jessica Chastain', character: 'Murph' },
      { name: 'Michael Caine', character: 'Professor Brand' },
    ]
  },
  {
    title: 'The Matrix',
    directors: ['Lana Wachowski', 'Lilly Wachowski'],
    writers: ['Lana Wachowski', 'Lilly Wachowski'],
    actors: [
      { name: 'Keanu Reeves', character: 'Neo' },
      { name: 'Laurence Fishburne', character: 'Morpheus' },
      { name: 'Carrie-Anne Moss', character: 'Trinity' },
      { name: 'Hugo Weaving', character: 'Agent Smith' },
    ]
  },
  {
    title: 'Titanic',
    directors: ['James Cameron'],
    writers: ['James Cameron'],
    actors: [
      { name: 'Leonardo DiCaprio', character: 'Jack Dawson' },
      { name: 'Kate Winslet', character: 'Rose DeWitt Bukater' },
      { name: 'Billy Zane', character: 'Cal Hockley' },
      { name: 'Kathy Bates', character: 'Molly Brown' },
    ]
  },
  {
    title: 'Forrest Gump',
    directors: ['Robert Zemeckis'],
    writers: ['Winston Groom', 'Eric Roth'],
    actors: [
      { name: 'Tom Hanks', character: 'Forrest Gump' },
      { name: 'Robin Wright', character: 'Jenny Curran' },
      { name: 'Gary Sinise', character: 'Lt. Dan Taylor' },
      { name: 'Sally Field', character: 'Mrs. Gump' },
    ]
  },
  {
    title: 'Avatar',
    directors: ['James Cameron'],
    writers: ['James Cameron'],
    actors: [
      { name: 'Sam Worthington', character: 'Jake Sully' },
      { name: 'Zoe Saldana', character: 'Neytiri' },
      { name: 'Sigourney Weaver', character: 'Dr. Grace Augustine' },
      { name: 'Stephen Lang', character: 'Colonel Quaritch' },
    ]
  },
  {
    title: 'The Silence of the Lambs',
    directors: ['Jonathan Demme'],
    writers: ['Thomas Harris', 'Ted Tally'],
    actors: [
      { name: 'Jodie Foster', character: 'Clarice Starling' },
      { name: 'Anthony Hopkins', character: 'Dr. Hannibal Lecter' },
      { name: 'Scott Glenn', character: 'Jack Crawford' },
      { name: 'Ted Levine', character: 'Buffalo Bill' },
    ]
  },
  {
    title: 'The Avengers',
    directors: ['Joss Whedon'],
    writers: ['Joss Whedon', 'Zak Penn'],
    actors: [
      { name: 'Robert Downey Jr.', character: 'Tony Stark / Iron Man' },
      { name: 'Chris Evans', character: 'Steve Rogers / Captain America' },
      { name: 'Scarlett Johansson', character: 'Natasha Romanoff / Black Widow' },
      { name: 'Mark Ruffalo', character: 'Bruce Banner / Hulk' },
      { name: 'Chris Hemsworth', character: 'Thor' },
    ]
  },
  {
    title: 'The Godfather',
    directors: ['Francis Ford Coppola'],
    writers: ['Mario Puzo', 'Francis Ford Coppola'],
    actors: [
      { name: 'Marlon Brando', character: 'Don Vito Corleone' },
      { name: 'Al Pacino', character: 'Michael Corleone' },
      { name: 'James Caan', character: 'Sonny Corleone' },
      { name: 'Robert Duvall', character: 'Tom Hagen' },
    ]
  },
  {
    title: 'The Dark Knight',
    directors: ['Christopher Nolan'],
    writers: ['Jonathan Nolan', 'Christopher Nolan', 'David S. Goyer'],
    actors: [
      { name: 'Christian Bale', character: 'Bruce Wayne / Batman' },
      { name: 'Heath Ledger', character: 'The Joker' },
      { name: 'Aaron Eckhart', character: 'Harvey Dent' },
      { name: 'Gary Oldman', character: 'Commissioner Gordon' },
      { name: 'Morgan Freeman', character: 'Lucius Fox' },
    ]
  },
  {
    title: 'Parasite',
    directors: ['Bong Joon-ho'],
    writers: ['Bong Joon-ho', 'Han Jin-won'],
    actors: [
      { name: 'Song Kang-ho', character: 'Ki-taek' },
      { name: 'Lee Sun-kyun', character: 'Dong-ik' },
      { name: 'Cho Yeo-jeong', character: 'Yeon-gyo' },
      { name: 'Choi Woo-shik', character: 'Ki-woo' },
      { name: 'Park So-dam', character: 'Ki-jung' },
    ]
  },
  {
    title: 'Gladiator',
    directors: ['Ridley Scott'],
    writers: ['David Franzoni', 'John Logan', 'William Nicholson'],
    actors: [
      { name: 'Russell Crowe', character: 'Maximus' },
      { name: 'Joaquin Phoenix', character: 'Commodus' },
      { name: 'Connie Nielsen', character: 'Lucilla' },
      { name: 'Oliver Reed', character: 'Proximo' },
    ]
  },
  {
    title: 'Inception',
    directors: ['Christopher Nolan'],
    writers: ['Christopher Nolan'],
    actors: [
      { name: 'Leonardo DiCaprio', character: 'Dom Cobb' },
      { name: 'Joseph Gordon-Levitt', character: 'Arthur' },
      { name: 'Tom Hardy', character: 'Eames' },
      { name: 'Elliot Page', character: 'Ariadne' },
      { name: 'Ken Watanabe', character: 'Saito' },
    ]
  },
  {
    title: 'The Shawshank Redemption',
    directors: ['Frank Darabont'],
    writers: ['Stephen King', 'Frank Darabont'],
    actors: [
      { name: 'Tim Robbins', character: 'Andy Dufresne' },
      { name: 'Morgan Freeman', character: 'Ellis "Red" Redding' },
      { name: 'Bob Gunton', character: 'Warden Norton' },
      { name: 'William Sadler', character: 'Heywood' },
    ]
  },
  {
    title: 'Mad Max: Fury Road',
    directors: ['George Miller'],
    writers: ['George Miller', 'Brendan McCarthy', 'Nico Lathouris'],
    actors: [
      { name: 'Tom Hardy', character: 'Max Rockatansky' },
      { name: 'Charlize Theron', character: 'Imperator Furiosa' },
      { name: 'Nicholas Hoult', character: 'Nux' },
      { name: 'Hugh Keays-Byrne', character: 'Immortan Joe' },
    ]
  },
  {
    title: 'John Wick',
    directors: ['Chad Stahelski'],
    writers: ['Derek Kolstad'],
    actors: [
      { name: 'Keanu Reeves', character: 'John Wick' },
      { name: 'Michael Nyqvist', character: 'Viggo Tarasov' },
      { name: 'Alfie Allen', character: 'Iosef Tarasov' },
      { name: 'Willem Dafoe', character: 'Marcus' },
      { name: 'Ian McShane', character: 'Winston' },
    ]
  },
  {
    title: 'Mission: Impossible - Fallout',
    directors: ['Christopher McQuarrie'],
    writers: ['Christopher McQuarrie'],
    actors: [
      { name: 'Tom Cruise', character: 'Ethan Hunt' },
      { name: 'Henry Cavill', character: 'August Walker' },
      { name: 'Ving Rhames', character: 'Luther Stickell' },
      { name: 'Simon Pegg', character: 'Benji Dunn' },
      { name: 'Rebecca Ferguson', character: 'Ilsa Faust' },
    ]
  },
  {
    title: 'Spider-Man: Into the Spider-Verse',
    directors: ['Bob Persichetti', 'Peter Ramsey', 'Rodney Rothman'],
    writers: ['Phil Lord', 'Rodney Rothman'],
    actors: [
      { name: 'Shameik Moore', character: 'Miles Morales' },
      { name: 'Jake Johnson', character: 'Peter B. Parker' },
      { name: 'Hailee Steinfeld', character: 'Gwen Stacy' },
      { name: 'Mahershala Ali', character: 'Aaron Davis' },
    ]
  },
  {
    title: 'The Raid',
    directors: ['Gareth Evans'],
    writers: ['Gareth Evans'],
    actors: [
      { name: 'Iko Uwais', character: 'Rama' },
      { name: 'Joe Taslim', character: 'Jaka' },
      { name: 'Donny Alamsyah', character: 'Andi' },
      { name: 'Ray Sahetapy', character: 'Tama Riyadi' },
    ]
  },
  {
    title: '12 Years a Slave',
    directors: ['Steve McQueen'],
    writers: ['John Ridley'],
    actors: [
      { name: 'Chiwetel Ejiofor', character: 'Solomon Northup' },
      { name: 'Michael Fassbender', character: 'Edwin Epps' },
      { name: 'Lupita Nyong\'o', character: 'Patsey' },
      { name: 'Benedict Cumberbatch', character: 'William Ford' },
    ]
  },
  {
    title: 'Moonlight',
    directors: ['Barry Jenkins'],
    writers: ['Barry Jenkins', 'Tarell Alvin McCraney'],
    actors: [
      { name: 'Trevante Rhodes', character: 'Black / Adult Chiron' },
      { name: 'Ashton Sanders', character: 'Teenage Chiron' },
      { name: 'Mahershala Ali', character: 'Juan' },
      { name: 'Naomie Harris', character: 'Paula' },
      { name: 'Janelle Monáe', character: 'Teresa' },
    ]
  },
  {
    title: 'The Pianist',
    directors: ['Roman Polanski'],
    writers: ['Ronald Harwood', 'Władysław Szpilman'],
    actors: [
      { name: 'Adrien Brody', character: 'Władysław Szpilman' },
      { name: 'Thomas Kretschmann', character: 'Captain Wilm Hosenfeld' },
      { name: 'Frank Finlay', character: 'Father' },
      { name: 'Emilia Fox', character: 'Dorota' },
    ]
  },
  {
    title: 'Room',
    directors: ['Lenny Abrahamson'],
    writers: ['Emma Donoghue'],
    actors: [
      { name: 'Brie Larson', character: 'Ma / Joy Newsome' },
      { name: 'Jacob Tremblay', character: 'Jack Newsome' },
      { name: 'Joan Allen', character: 'Nancy' },
      { name: 'William H. Macy', character: 'Robert' },
    ]
  },
  {
    title: 'The Grand Budapest Hotel',
    directors: ['Wes Anderson'],
    writers: ['Wes Anderson', 'Hugo Guinness'],
    actors: [
      { name: 'Ralph Fiennes', character: 'M. Gustave H.' },
      { name: 'Tony Revolori', character: 'Zero Moustafa' },
      { name: 'Saoirse Ronan', character: 'Agatha' },
      { name: 'Adrien Brody', character: 'Dmitri' },
      { name: 'Willem Dafoe', character: 'Jopling' },
    ]
  },
  {
    title: 'Blade Runner 2049',
    directors: ['Denis Villeneuve'],
    writers: ['Hampton Fancher', 'Michael Green'],
    actors: [
      { name: 'Ryan Gosling', character: 'Officer K' },
      { name: 'Harrison Ford', character: 'Rick Deckard' },
      { name: 'Ana de Armas', character: 'Joi' },
      { name: 'Jared Leto', character: 'Niander Wallace' },
    ]
  },
  {
    title: 'Arrival',
    directors: ['Denis Villeneuve'],
    writers: ['Eric Heisserer', 'Ted Chiang'],
    actors: [
      { name: 'Amy Adams', character: 'Dr. Louise Banks' },
      { name: 'Jeremy Renner', character: 'Ian Donnelly' },
      { name: 'Forest Whitaker', character: 'Colonel Weber' },
    ]
  },
  {
    title: 'Ex Machina',
    directors: ['Alex Garland'],
    writers: ['Alex Garland'],
    actors: [
      { name: 'Domhnall Gleeson', character: 'Caleb Smith' },
      { name: 'Alicia Vikander', character: 'Ava' },
      { name: 'Oscar Isaac', character: 'Nathan Bateman' },
    ]
  },
  {
    title: 'Dune',
    directors: ['Denis Villeneuve'],
    writers: ['Jon Spaihts', 'Denis Villeneuve', 'Eric Roth'],
    actors: [
      { name: 'Timothée Chalamet', character: 'Paul Atreides' },
      { name: 'Rebecca Ferguson', character: 'Lady Jessica' },
      { name: 'Oscar Isaac', character: 'Duke Leto Atreides' },
      { name: 'Zendaya', character: 'Chani' },
      { name: 'Jason Momoa', character: 'Duncan Idaho' },
    ]
  },
  {
    title: 'Edge of Tomorrow',
    directors: ['Doug Liman'],
    writers: ['Christopher McQuarrie', 'Jez Butterworth', 'John-Henry Butterworth'],
    actors: [
      { name: 'Tom Cruise', character: 'Major William Cage' },
      { name: 'Emily Blunt', character: 'Rita Vrataski' },
      { name: 'Bill Paxton', character: 'Master Sergeant Farell' },
      { name: 'Brendan Gleeson', character: 'General Brigham' },
    ]
  },
  {
    title: 'Get Out',
    directors: ['Jordan Peele'],
    writers: ['Jordan Peele'],
    actors: [
      { name: 'Daniel Kaluuya', character: 'Chris Washington' },
      { name: 'Allison Williams', character: 'Rose Armitage' },
      { name: 'Bradley Whitford', character: 'Dean Armitage' },
      { name: 'Catherine Keener', character: 'Missy Armitage' },
      { name: 'LilRel Howery', character: 'Rod Williams' },
    ]
  },
  {
    title: 'Gone Girl',
    directors: ['David Fincher'],
    writers: ['Gillian Flynn'],
    actors: [
      { name: 'Ben Affleck', character: 'Nick Dunne' },
      { name: 'Rosamund Pike', character: 'Amy Dunne' },
      { name: 'Neil Patrick Harris', character: 'Desi Collings' },
      { name: 'Tyler Perry', character: 'Tanner Bolt' },
    ]
  },
  {
    title: 'Shutter Island',
    directors: ['Martin Scorsese'],
    writers: ['Laeta Kalogridis', 'Dennis Lehane'],
    actors: [
      { name: 'Leonardo DiCaprio', character: 'Teddy Daniels' },
      { name: 'Mark Ruffalo', character: 'Chuck Aule' },
      { name: 'Ben Kingsley', character: 'Dr. Cawley' },
      { name: 'Michelle Williams', character: 'Dolores' },
    ]
  },
  {
    title: 'A Quiet Place',
    directors: ['John Krasinski'],
    writers: ['Bryan Woods', 'Scott Beck', 'John Krasinski'],
    actors: [
      { name: 'Emily Blunt', character: 'Evelyn Abbott' },
      { name: 'John Krasinski', character: 'Lee Abbott' },
      { name: 'Millicent Simmonds', character: 'Regan Abbott' },
      { name: 'Noah Jupe', character: 'Marcus Abbott' },
    ]
  },
  {
    title: 'Hereditary',
    directors: ['Ari Aster'],
    writers: ['Ari Aster'],
    actors: [
      { name: 'Toni Collette', character: 'Annie Graham' },
      { name: 'Alex Wolff', character: 'Peter Graham' },
      { name: 'Milly Shapiro', character: 'Charlie Graham' },
      { name: 'Gabriel Byrne', character: 'Steve Graham' },
    ]
  },
  {
    title: 'Knives Out',
    directors: ['Rian Johnson'],
    writers: ['Rian Johnson'],
    actors: [
      { name: 'Daniel Craig', character: 'Benoit Blanc' },
      { name: 'Ana de Armas', character: 'Marta Cabrera' },
      { name: 'Chris Evans', character: 'Ransom Drysdale' },
      { name: 'Jamie Lee Curtis', character: 'Linda Drysdale' },
      { name: 'Christopher Plummer', character: 'Harlan Thrombey' },
    ]
  },
  {
    title: 'The Nice Guys',
    directors: ['Shane Black'],
    writers: ['Shane Black', 'Anthony Bagarozzi'],
    actors: [
      { name: 'Russell Crowe', character: 'Jackson Healy' },
      { name: 'Ryan Gosling', character: 'Holland March' },
      { name: 'Angourie Rice', character: 'Holly March' },
      { name: 'Matt Bomer', character: 'John Boy' },
    ]
  },
  {
    title: 'Jojo Rabbit',
    directors: ['Taika Waititi'],
    writers: ['Taika Waititi', 'Christine Leunens'],
    actors: [
      { name: 'Roman Griffin Davis', character: 'Jojo Betzler' },
      { name: 'Taika Waititi', character: 'Adolf Hitler (Imaginary)' },
      { name: 'Scarlett Johansson', character: 'Rosie Betzler' },
      { name: 'Thomasin McKenzie', character: 'Elsa Korr' },
      { name: 'Sam Rockwell', character: 'Captain Klenzendorf' },
    ]
  },
  {
    title: 'The Hangover',
    directors: ['Todd Phillips'],
    writers: ['Jon Lucas', 'Scott Moore'],
    actors: [
      { name: 'Bradley Cooper', character: 'Phil Wenneck' },
      { name: 'Ed Helms', character: 'Stu Price' },
      { name: 'Zach Galifianakis', character: 'Alan Garner' },
      { name: 'Justin Bartha', character: 'Doug Billings' },
    ]
  },
  {
    title: 'La La Land',
    directors: ['Damien Chazelle'],
    writers: ['Damien Chazelle'],
    actors: [
      { name: 'Ryan Gosling', character: 'Sebastian Wilder' },
      { name: 'Emma Stone', character: 'Mia Dolan' },
      { name: 'John Legend', character: 'Keith' },
      { name: 'J.K. Simmons', character: 'Bill' },
    ]
  },
  {
    title: 'The Notebook',
    directors: ['Nick Cassavetes'],
    writers: ['Nicholas Sparks', 'Jan Sardi'],
    actors: [
      { name: 'Ryan Gosling', character: 'Noah Calhoun' },
      { name: 'Rachel McAdams', character: 'Allie Hamilton' },
      { name: 'James Garner', character: 'Duke / Older Noah' },
      { name: 'Gena Rowlands', character: 'Older Allie' },
    ]
  },
  {
    title: 'Call Me by Your Name',
    directors: ['Luca Guadagnino'],
    writers: ['James Ivory', 'André Aciman'],
    actors: [
      { name: 'Timothée Chalamet', character: 'Elio Perlman' },
      { name: 'Armie Hammer', character: 'Oliver' },
      { name: 'Michael Stuhlbarg', character: 'Mr. Perlman' },
      { name: 'Amira Casar', character: 'Annella Perlman' },
    ]
  },
  {
    title: 'Crazy Rich Asians',
    directors: ['Jon M. Chu'],
    writers: ['Peter Chiarelli', 'Adele Lim', 'Kevin Kwan'],
    actors: [
      { name: 'Constance Wu', character: 'Rachel Chu' },
      { name: 'Henry Golding', character: 'Nick Young' },
      { name: 'Michelle Yeoh', character: 'Eleanor Young' },
      { name: 'Awkwafina', character: 'Peik Lin' },
    ]
  },
  {
    title: 'The Shape of Water',
    directors: ['Guillermo del Toro'],
    writers: ['Guillermo del Toro', 'Vanessa Taylor'],
    actors: [
      { name: 'Sally Hawkins', character: 'Elisa Esposito' },
      { name: 'Michael Shannon', character: 'Richard Strickland' },
      { name: 'Richard Jenkins', character: 'Giles' },
      { name: 'Octavia Spencer', character: 'Zelda' },
      { name: 'Doug Jones', character: 'Amphibian Man' },
    ]
  },
  {
    title: 'The Departed',
    directors: ['Martin Scorsese'],
    writers: ['William Monahan'],
    actors: [
      { name: 'Leonardo DiCaprio', character: 'Billy Costigan' },
      { name: 'Matt Damon', character: 'Colin Sullivan' },
      { name: 'Jack Nicholson', character: 'Frank Costello' },
      { name: 'Mark Wahlberg', character: 'Sgt. Dignam' },
    ]
  },
  {
    title: 'No Country for Old Men',
    directors: ['Joel Coen', 'Ethan Coen'],
    writers: ['Joel Coen', 'Ethan Coen', 'Cormac McCarthy'],
    actors: [
      { name: 'Javier Bardem', character: 'Anton Chigurh' },
      { name: 'Josh Brolin', character: 'Llewelyn Moss' },
      { name: 'Tommy Lee Jones', character: 'Sheriff Bell' },
      { name: 'Woody Harrelson', character: 'Carson Wells' },
    ]
  },
  {
    title: 'The Town',
    directors: ['Ben Affleck'],
    writers: ['Peter Craig', 'Ben Affleck', 'Aaron Stockard'],
    actors: [
      { name: 'Ben Affleck', character: 'Doug MacRay' },
      { name: 'Rebecca Hall', character: 'Claire Keesey' },
      { name: 'Jon Hamm', character: 'FBI Agent Adam Frawley' },
      { name: 'Jeremy Renner', character: 'Jem Coughlin' },
    ]
  },
  {
    title: 'Hell or High Water',
    directors: ['David Mackenzie'],
    writers: ['Taylor Sheridan'],
    actors: [
      { name: 'Chris Pine', character: 'Toby Howard' },
      { name: 'Ben Foster', character: 'Tanner Howard' },
      { name: 'Jeff Bridges', character: 'Marcus Hamilton' },
      { name: 'Gil Birmingham', character: 'Alberto Parker' },
    ]
  },
  {
    title: 'Wind River',
    directors: ['Taylor Sheridan'],
    writers: ['Taylor Sheridan'],
    actors: [
      { name: 'Jeremy Renner', character: 'Cory Lambert' },
      { name: 'Elizabeth Olsen', character: 'Jane Banner' },
      { name: 'Jon Bernthal', character: 'Matt' },
      { name: 'Graham Greene', character: 'Ben' },
    ]
  },
  {
    title: 'Whiplash',
    directors: ['Damien Chazelle'],
    writers: ['Damien Chazelle'],
    actors: [
      { name: 'Miles Teller', character: 'Andrew Neiman' },
      { name: 'J.K. Simmons', character: 'Terence Fletcher' },
      { name: 'Melissa Benoist', character: 'Nicole' },
      { name: 'Paul Reiser', character: 'Jim Neiman' },
    ]
  },
  {
    title: 'Baby Driver',
    directors: ['Edgar Wright'],
    writers: ['Edgar Wright'],
    actors: [
      { name: 'Ansel Elgort', character: 'Baby' },
      { name: 'Kevin Spacey', character: 'Doc' },
      { name: 'Lily James', character: 'Debora' },
      { name: 'Jamie Foxx', character: 'Bats' },
      { name: 'Jon Hamm', character: 'Buddy' },
    ]
  },
  {
    title: 'The Social Network',
    directors: ['David Fincher'],
    writers: ['Aaron Sorkin', 'Ben Mezrich'],
    actors: [
      { name: 'Jesse Eisenberg', character: 'Mark Zuckerberg' },
      { name: 'Andrew Garfield', character: 'Eduardo Saverin' },
      { name: 'Justin Timberlake', character: 'Sean Parker' },
      { name: 'Armie Hammer', character: 'Cameron & Tyler Winklevoss' },
    ]
  },
  {
    title: 'Django Unchained',
    directors: ['Quentin Tarantino'],
    writers: ['Quentin Tarantino'],
    actors: [
      { name: 'Jamie Foxx', character: 'Django' },
      { name: 'Christoph Waltz', character: 'Dr. King Schultz' },
      { name: 'Leonardo DiCaprio', character: 'Calvin Candie' },
      { name: 'Samuel L. Jackson', character: 'Stephen' },
      { name: 'Kerry Washington', character: 'Broomhilda von Shaft' },
    ]
  },
  {
    title: 'Joker',
    directors: ['Todd Phillips'],
    writers: ['Todd Phillips', 'Scott Silver'],
    actors: [
      { name: 'Joaquin Phoenix', character: 'Arthur Fleck / Joker' },
      { name: 'Robert De Niro', character: 'Murray Franklin' },
      { name: 'Zazie Beetz', character: 'Sophie Dumond' },
      { name: 'Frances Conroy', character: 'Penny Fleck' },
    ]
  },

  // ── SERIES ──
  {
    title: 'Breaking Bad',
    directors: ['Vince Gilligan'],
    writers: ['Vince Gilligan', 'Peter Gould', 'George Mastras'],
    actors: [
      { name: 'Bryan Cranston', character: 'Walter White' },
      { name: 'Aaron Paul', character: 'Jesse Pinkman' },
      { name: 'Anna Gunn', character: 'Skyler White' },
      { name: 'Dean Norris', character: 'Hank Schrader' },
      { name: 'Bob Odenkirk', character: 'Saul Goodman' },
    ]
  },
  {
    title: 'Game of Thrones',
    directors: ['David Benioff', 'D.B. Weiss'],
    writers: ['David Benioff', 'D.B. Weiss', 'George R.R. Martin'],
    actors: [
      { name: 'Emilia Clarke', character: 'Daenerys Targaryen' },
      { name: 'Kit Harington', character: 'Jon Snow' },
      { name: 'Peter Dinklage', character: 'Tyrion Lannister' },
      { name: 'Lena Headey', character: 'Cersei Lannister' },
      { name: 'Nikolaj Coster-Waldau', character: 'Jaime Lannister' },
    ]
  },
  {
    title: 'Stranger Things',
    directors: ['The Duffer Brothers'],
    writers: ['Matt Duffer', 'Ross Duffer'],
    actors: [
      { name: 'Millie Bobby Brown', character: 'Eleven' },
      { name: 'Finn Wolfhard', character: 'Mike Wheeler' },
      { name: 'Winona Ryder', character: 'Joyce Byers' },
      { name: 'David Harbour', character: 'Jim Hopper' },
      { name: 'Gaten Matarazzo', character: 'Dustin Henderson' },
    ]
  },
  {
    title: 'The Witcher',
    directors: ['Lauren Schmidt Hissrich'],
    writers: ['Lauren Schmidt Hissrich', 'Andrzej Sapkowski'],
    actors: [
      { name: 'Henry Cavill', character: 'Geralt of Rivia' },
      { name: 'Anya Chalotra', character: 'Yennefer' },
      { name: 'Freya Allan', character: 'Princess Ciri' },
      { name: 'Joey Batey', character: 'Jaskier' },
    ]
  },
  {
    title: 'Money Heist',
    directors: ['Álex Pina'],
    writers: ['Álex Pina'],
    actors: [
      { name: 'Álvaro Morte', character: 'The Professor' },
      { name: 'Úrsula Corberó', character: 'Tokyo' },
      { name: 'Itziar Ituño', character: 'Raquel Murillo' },
      { name: 'Pedro Alonso', character: 'Berlin' },
      { name: 'Jaime Lorente', character: 'Denver' },
    ]
  },
  {
    title: 'Dark',
    directors: ['Baran bo Odar'],
    writers: ['Baran bo Odar', 'Jantje Friese'],
    actors: [
      { name: 'Louis Hofmann', character: 'Jonas Kahnwald' },
      { name: 'Lisa Vicari', character: 'Martha Nielsen' },
      { name: 'Andreas Pietschmann', character: 'The Stranger' },
      { name: 'Maja Schöne', character: 'Hannah Kahnwald' },
    ]
  },
  {
    title: 'The Crown',
    directors: ['Peter Morgan'],
    writers: ['Peter Morgan'],
    actors: [
      { name: 'Claire Foy', character: 'Queen Elizabeth II (young)' },
      { name: 'Olivia Colman', character: 'Queen Elizabeth II (mid)' },
      { name: 'Imelda Staunton', character: 'Queen Elizabeth II (later)' },
      { name: 'Matt Smith', character: 'Prince Philip (young)' },
      { name: 'Helena Bonham Carter', character: 'Princess Margaret' },
    ]
  },
  {
    title: 'Peaky Blinders',
    directors: ['Steven Knight'],
    writers: ['Steven Knight'],
    actors: [
      { name: 'Cillian Murphy', character: 'Thomas Shelby' },
      { name: 'Helen McCrory', character: 'Polly Gray' },
      { name: 'Paul Anderson', character: 'Arthur Shelby' },
      { name: 'Tom Hardy', character: 'Alfie Solomons' },
      { name: 'Anya Taylor-Joy', character: 'Gina Gray' },
    ]
  },
  {
    title: 'The Mandalorian',
    directors: ['Jon Favreau'],
    writers: ['Jon Favreau', 'Dave Filoni'],
    actors: [
      { name: 'Pedro Pascal', character: 'The Mandalorian / Din Djarin' },
      { name: 'Giancarlo Esposito', character: 'Moff Gideon' },
      { name: 'Carl Weathers', character: 'Greef Karga' },
      { name: 'Katee Sackhoff', character: 'Bo-Katan Kryze' },
    ]
  },
  {
    title: 'Chernobyl',
    directors: ['Johan Renck'],
    writers: ['Craig Mazin'],
    actors: [
      { name: 'Jared Harris', character: 'Valery Legasov' },
      { name: 'Stellan Skarsgård', character: 'Boris Shcherbina' },
      { name: 'Emily Watson', character: 'Ulana Khomyuk' },
      { name: 'Paul Ritter', character: 'Anatoly Dyatlov' },
    ]
  },
  {
    title: 'The Last of Us',
    directors: ['Craig Mazin', 'Neil Druckmann'],
    writers: ['Craig Mazin', 'Neil Druckmann'],
    actors: [
      { name: 'Pedro Pascal', character: 'Joel Miller' },
      { name: 'Bella Ramsey', character: 'Ellie Williams' },
      { name: 'Gabriel Luna', character: 'Tommy Miller' },
      { name: 'Nick Offerman', character: 'Bill' },
    ]
  },
  {
    title: 'Wednesday',
    directors: ['Tim Burton', 'James Marshall'],
    writers: ['Alfred Gough', 'Miles Millar'],
    actors: [
      { name: 'Jenna Ortega', character: 'Wednesday Addams' },
      { name: 'Gwendoline Christie', character: 'Larissa Weems' },
      { name: 'Catherine Zeta-Jones', character: 'Morticia Addams' },
      { name: 'Luis Guzmán', character: 'Gomez Addams' },
    ]
  },
  {
    title: 'Squid Game',
    directors: ['Hwang Dong-hyuk'],
    writers: ['Hwang Dong-hyuk'],
    actors: [
      { name: 'Lee Jung-jae', character: 'Seong Gi-hun' },
      { name: 'Park Hae-soo', character: 'Cho Sang-woo' },
      { name: 'Wi Ha-joon', character: 'Hwang Jun-ho' },
      { name: 'Jung Ho-yeon', character: 'Kang Sae-byeok' },
    ]
  },
  {
    title: 'The Boys',
    directors: ['Eric Kripke'],
    writers: ['Eric Kripke', 'Garth Ennis', 'Darick Robertson'],
    actors: [
      { name: 'Karl Urban', character: 'Billy Butcher' },
      { name: 'Jack Quaid', character: 'Hughie Campbell' },
      { name: 'Antony Starr', character: 'Homelander' },
      { name: 'Erin Moriarty', character: 'Starlight' },
      { name: 'Karen Fukuhara', character: 'Kimiko Miyashiro' },
    ]
  },
  {
    title: 'Arcane',
    directors: ['Pascal Charrue', 'Arnaud Delord'],
    writers: ['Christian Linke', 'Alex Yee'],
    actors: [
      { name: 'Hailee Steinfeld', character: 'Vi' },
      { name: 'Ella Purnell', character: 'Jinx' },
      { name: 'Katie Leung', character: 'Caitlyn Kiramman' },
      { name: 'Kevin Alejandro', character: 'Jayce Talis' },
    ]
  },
];


const seedCrewData = async () => {
  const client = await pool.connect();
  try {
    console.log('🎬 Creating writers table and seeding all crew data...\n');

    // 1. Create writers table and movie_writers junction
    await client.query(`
      CREATE TABLE IF NOT EXISTS writers (
        writer_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS movie_writers (
        movie_id   INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
        writer_id  INTEGER REFERENCES writers(writer_id) ON DELETE CASCADE,
        PRIMARY KEY (movie_id, writer_id)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_movie_writers_movie_id ON movie_writers(movie_id)`);
    console.log('  ✅ Writers tables created\n');

    // 2. Clear old data
    await client.query('DELETE FROM movie_cast');
    await client.query('DELETE FROM movie_directors');
    await client.query('DELETE FROM movie_writers');
    await client.query('DELETE FROM actors');
    await client.query('DELETE FROM directors');
    await client.query('DELETE FROM writers');
    console.log('  ✅ Old crew data cleared\n');

    // Maps to avoid duplicate inserts
    const actorMap = {};
    const directorMap = {};
    const writerMap = {};

    let processed = 0;
    let notFound = 0;

    for (const item of movieCrewData) {
      // Find movie ID
      const movieRes = await client.query('SELECT movie_id FROM movies WHERE title = $1', [item.title]);
      if (movieRes.rows.length === 0) {
        console.log(`  ⚠️  Not found: ${item.title}`);
        notFound++;
        continue;
      }
      const movieId = movieRes.rows[0].movie_id;

      // -- Directors --
      for (const dirName of item.directors) {
        if (!directorMap[dirName]) {
          const r = await client.query(
            'INSERT INTO directors (name) VALUES ($1) RETURNING director_id', [dirName]
          );
          directorMap[dirName] = r.rows[0].director_id;
        }
        await client.query(
          'INSERT INTO movie_directors (movie_id, director_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [movieId, directorMap[dirName]]
        );
      }

      // -- Writers --
      for (const writerName of item.writers) {
        if (!writerMap[writerName]) {
          const r = await client.query(
            'INSERT INTO writers (name) VALUES ($1) RETURNING writer_id', [writerName]
          );
          writerMap[writerName] = r.rows[0].writer_id;
        }
        await client.query(
          'INSERT INTO movie_writers (movie_id, writer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [movieId, writerMap[writerName]]
        );
      }

      // -- Actors/Cast --
      for (const actor of item.actors) {
        if (!actorMap[actor.name]) {
          const r = await client.query(
            'INSERT INTO actors (name) VALUES ($1) RETURNING actor_id', [actor.name]
          );
          actorMap[actor.name] = r.rows[0].actor_id;
        }
        await client.query(
          'INSERT INTO movie_cast (movie_id, actor_id, character_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [movieId, actorMap[actor.name], actor.character]
        );
      }

      console.log(`  ✅ ${item.title} — ${item.directors.length}D / ${item.writers.length}W / ${item.actors.length}A`);
      processed++;
    }

    const actorCount = Object.keys(actorMap).length;
    const dirCount = Object.keys(directorMap).length;
    const writerCount = Object.keys(writerMap).length;
    console.log(`\n📊 Processed: ${processed} titles | Not found: ${notFound}`);
    console.log(`📊 Unique: ${dirCount} directors, ${writerCount} writers, ${actorCount} actors`);
    console.log('✅ Done!\n');

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    client.release();
    await pool.end();
    process.exit(1);
  }
};

seedCrewData();
