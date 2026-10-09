import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { query } from '../database/db.js';

export async function requireAuth(req, res, next) {
  try {
    let token = null;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.airus_token) {
      // Or check HTTP-only cookie
      token = req.cookies.airus_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required to access this resource.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or expired authentication token.'
      });
    }

    // Retrieve user from DB to ensure user is active and valid
    const userResult = await query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User account no longer exists.'
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err.message);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed due to internal error.'
    });
  }
}
