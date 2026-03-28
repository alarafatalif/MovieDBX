
import pool from './db.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const seedDatabase = async () => {
  try {
    console.log('Seeding database...');
    const seedPath = join(__dirname, 'dataInsertion.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    await pool.query(seedSQL);

    console.log('All data inserted (genres, movies, series, crew, users, reviews)');
    console.log('Database seeding complete!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    await pool.end();
    process.exit(1);
  }
};

seedDatabase();
