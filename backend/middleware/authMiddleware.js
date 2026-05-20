const jwt = require('jsonwebtoken');

// Verifies the JWT and attaches { id, role } to req.user — no database hit.
// Controllers that need the full user document fetch it themselves.
const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role ?? 'user' };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const admin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access required' });
};

module.exports = { protect, admin };
