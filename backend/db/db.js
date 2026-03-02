
// db.js — Database Connection Setup
// This file creates and exports a "connection pool" to PostgreSQL.
// WHAT IS A CONNECTION POOL?
//   Instead of opening a new database connection for every single query
//   (which is slow), a pool keeps several connections open and ready.
//   When your code needs to run a query, it borrows a connection from
//   the pool, uses it, and returns it — like a library lending books.

//   Every controller file (movies, users, reviews, etc.) needs to
//   talk to the database. By exporting 'pool', they can all import it:
//     import pool from '../db/db.js';
//     const result = await pool.query('SELECT * FROM movies');
//
// DATABASE_URL FORMAT (from your .env file):
//   postgresql://username:password@host:port/database_name
//   Example: postgresql://alif:secret123@localhost:5432/moviedbx
// ============================================================

import pkg from 'pg';           // PostgreSQL client library for Node.js
const { Pool } = pkg;           // Destructure the Pool class from the package
import dotenv from 'dotenv';    // Loads .env file variables into process.env

// Load environment variables (DATABASE_URL, etc.) from the .env file
dotenv.config();

// Strip sslmode and channel_binding from the URL to avoid conflicts
// with the ssl config object below (newer pg versions treat sslmode=require
// as verify-full, which can break with rejectUnauthorized: false)
let dbUrl = process.env.DATABASE_URL || '';
dbUrl = dbUrl.replace(/[?&](sslmode|channel_binding)=[^&]*/g, '');
// Clean up leftover ? or & at the end
dbUrl = dbUrl.replace(/\?$/, '');

// Create the connection pool using the DATABASE_URL from .env
const pool = new Pool({
  connectionString: dbUrl,              // The full database URL (cleaned)
  ssl: {
    rejectUnauthorized: false           // Required for cloud-hosted databases (e.g., Neon, Supabase)
                                        // Set to false because free-tier DBs use self-signed SSL certs
  }
});

// Log pool errors so they don't crash the process silently
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

// Test the connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Database connected successfully'))
  .catch((err) => console.error('❌ Database connection failed:', err.message));

// Export the pool so other files can use it to run SQL queries
export default pool;