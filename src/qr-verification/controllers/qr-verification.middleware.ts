import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

export const scanRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    status: 'fail',
    message: 'Too many scan requests. Please try again in a minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    status: 'fail',
    message: 'Too many OTP attempts. Please try again in a minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export function requireBodyFields(fields: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const missing: string[] = [];

    for (const field of fields) {
      const value = req.body[field];
      if (value === undefined || value === null || value === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      const error = {
        status: 'fail',
        message: `Missing required fields: ${missing.join(', ')}`,
      };
      return _res.status(400).json(error);
    }

    next();
  };
}
