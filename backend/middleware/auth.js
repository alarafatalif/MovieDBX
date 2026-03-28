import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }
  return process.env.JWT_SECRET;
};
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = payload;
    return next();
  } catch (error) {
    const status = error.message === 'JWT_SECRET is not set' ? 500 : 401;
    const message = error.message === 'JWT_SECRET is not set' ? error.message : 'Invalid token';
    return res.status(status).json({ error: message });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
};
