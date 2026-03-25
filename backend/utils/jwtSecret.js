import crypto from 'crypto';

// Keep JWT signing + verification consistent across the backend.
// If the env var is missing, we fall back to an ephemeral in-memory secret
// so the app can still run on Render (but tokens will break after restarts).
let jwtSecret =
  process.env.JWT_SECRET ||
  process.env.JWT_SECRET_KEY ||
  process.env.SECRET_KEY ||
  process.env.SECRET;

if (!jwtSecret) {
  jwtSecret = crypto.randomBytes(32).toString('hex');
  console.warn('[auth] JWT_SECRET is not set. Using an ephemeral in-memory secret.');
  console.warn('[auth] Set JWT_SECRET in Render for stable logins across restarts.');
}

export const getJwtSecret = () => jwtSecret;

