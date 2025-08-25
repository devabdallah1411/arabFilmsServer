const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Work = require('../models/work');

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

// Ensure the current user owns the work, or is admin
async function requireWorkOwnerOrAdmin(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if (req.user.role === 'admin') return next();
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid work id' });
    const work = await Work.findById(id).select('createdBy');
    if (!work) return res.status(404).json({ message: 'Work not found' });
    if (work.createdBy?.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate, requireRoles, requireWorkOwnerOrAdmin };
