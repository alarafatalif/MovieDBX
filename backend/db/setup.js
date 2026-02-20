// ============================================================
// setup.js — Creates All Database Tables
// ============================================================
// RUN THIS FIRST when setting up the project:
//   node db/setup.js
//
// WHAT IT DOES:
//   1. Reads the schema.sql file (which contains all CREATE TABLE statements)
//   2. Sends the entire SQL to PostgreSQL to execute
//   3. Creates all 12 tables: users, movies, genres, directors, actors,
//      writers, reviews, watchlist, and all junction tables
//
// SAFE TO RE-RUN:
//   The schema uses "CREATE TABLE IF NOT EXISTS" so running this
//   multiple times won't destroy existing data.
//
// ORDER OF OPERATIONS FOR A FRESH PROJECT:
//   1. node db/setup.js    ← Creates tables (this file)
//   2. node db/seed.js     ← Adds initial sample data
//   3. node server.js      ← Starts the API server
// ============================================================

import pool from './db.js';                      // Database connection pool
import fs from 'fs';                             // File system — to read schema.sql
import { fileURLToPath } from 'url';             // Converts ES module URL to file path
import { dirname, join } from 'path';            // Path utilities for cross-OS compatibility

// In ES modules, __filename and __dirname don't exist by default.
// These two lines recreate them so we can locate schema.sql reliably.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const setupDatabase = async () => {
  try {
    console.log('🔄 Setting up database...');
    
    // Read the schema.sql file as a string
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute all the CREATE TABLE statements at once
    await pool.query(schema);
    
    console.log('✅ Database setup complete!');
    console.log('📋 Tables created successfully.');
    
    // Close the database connection and exit the script
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    await pool.end();
    process.exit(1);   // Exit with error code 1 (non-zero = something went wrong)
  }
};

// Run the setup function
setupDatabase();