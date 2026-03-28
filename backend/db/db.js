
// db.js — Database Connection Setup
// This file creates and exports a "connection pool" to PostgreSQL.
import pkg from 'pg';           // PostgreSQL client library for Node.js
const { Pool } = pkg;           // Destructure the Pool class from the package
import dotenv from 'dotenv';    // Loads .env file variables into process.env

dotenv.config();

let dbUrl = process.env.DATABASE_URL || '';
dbUrl = dbUrl.replace(/[?&](sslmode|channel_binding)=[^&]*/g, '');
// Clean up leftover ? or & at the end
dbUrl = dbUrl.replace(/\?$/, '');

const shouldUseSsl =
  process.env.PGSSLMODE === 'require' ||
  /neon\.tech|supabase\.co|render\.com|amazonaws\.com/i.test(dbUrl);

// Create the connection pool using the DATABASE_URL from .env
const pool = new Pool({
  connectionString: dbUrl,              // The full database URL (cleaned)
  ...(shouldUseSsl
    ? {
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {})
});

// Log pool errors so they don't crash the process silently
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

// Test the connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Database connection failed:', err.message));

// Export the pool so other files can use it to run SQL queries
export default pool;