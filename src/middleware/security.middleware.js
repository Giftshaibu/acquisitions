import aj from '../config/arcjet.js';
import logger from '../config/logger.js';
import { slidingWindow } from '@arcjet/node';

const rateLimits = {
  admin: {
    limit: 20,
    message: 'You have exceeded the rate limit for admin users.',
  },
  user: {
    limit: 10,
    message: 'You have exceeded the rate limit for regular users.',
  },
  guest: {
    limit: 5,
    message: 'You have exceeded the rate limit for guest users.',
  },
};

const clients = Object.fromEntries(
  Object.entries(rateLimits).map(([role, { limit }]) => [
    role,
    aj.withRule(slidingWindow({
      mode: 'LIVE',
      interval: '1m',
      max: limit,
      name: `${role}-rate-limit`,
    })),
  ]),
);

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role in rateLimits ? req.user.role : 'guest';
    const decision = await clients[role].protect(req);

    if (decision.isErrored()) {
      logger.error('Arcjet decision failed', {
        message: decision.reason.message,
        ip: req.ip,
        path: req.path,
        role,
      });
      return next();
    }
    
    if(decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot request denied', { ip: req.ip, userAgent: req.headers['user-agent'], path: req.path });
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied due to bot detection' });
    }
    if(decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield blocked request', { ip: req.ip, userAgent: req.headers['user-agent'], path: req.path, method: req.method });
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied due to bot detection' });
    }
    if(decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded', { ip: req.ip, userAgent: req.headers['user-agent'], path: req.path });
      return res.status(429).json({ error: 'Too Many Requests', message: rateLimits[role].message });
    }
    next();
  } catch (error) {
    console.error('Security middleware error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'something went wrong with security middleware' });
  }
};

export default securityMiddleware;
