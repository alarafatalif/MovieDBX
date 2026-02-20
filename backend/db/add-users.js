import pool from './db.js';

const addUsers = async () => {
  try {
    console.log('👤 Adding test users...');
    
    await pool.query(`
      INSERT INTO users (username, email, password_hash) VALUES
      ('john_doe', 'john@example.com', 'hashed_password_123'),
      ('jane_smith', 'jane@example.com', 'hashed_password_456'),
      ('movie_lover', 'lover@example.com', 'hashed_password_789')
      ON CONFLICT (username) DO NOTHING
    `);
    
    const result = await pool.query('SELECT user_id, username, email FROM users');
    
    console.log('✅ Users added:');
    result.rows.forEach(user => {
      console.log(`  - ${user.username} (ID: ${user.user_id}) - ${user.email}`);
    });
    
    console.log('\n💡 Use user_id to test watchlist!\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
};

addUsers();