
import pool from './db.js';                      // Database connection pool
import fs from 'fs';                             // File system — to read schema.sql
import { fileURLToPath } from 'url';             // Converts ES module URL to file path
import { dirname, join } from 'path';            // Path utilities for cross-OS compatibility

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const setupDatabase = async () => {
  try {
    console.log('Setting up database...');
    // Read the schema.sql file as a string
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    // Execute all the CREATE TABLE statements at once
    await pool.query(schema);
    console.log('All tables created (users, movies, genres, persons, reviews, watchlist, junction tables)');
    console.log('Database setup complete!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error.message);
    await pool.end();
    process.exit(1);
  }
};
setupDatabase();
