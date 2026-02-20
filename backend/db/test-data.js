import pool from './db.js';
const testData = async () => {
  try{
    console.log('\n📊 Testing database data...\n');
    const moviesResult = await pool.query('SELECT * FROM movies');
    console.log(`✅ Total movies: ${moviesResult.rows.length}`);
    if (moviesResult.rows.length > 0) {
      console.log('Movies:');
      moviesResult.rows.forEach(movie => {
        console.log(`  - ${movie.title} (${movie.release_year}) ${movie.has_oscar ? '🏆' : ''}`);
      });
    } else {
      console.log('⚠️  No movies found in database!');
    }
    console.log('\n✅ Test complete!\n');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
};
testData();