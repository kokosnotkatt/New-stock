import { query, param, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

export const newsValidation = [
  query('limit').optional().isInt({ min: 1, max: 400 }).toInt(),
  query('category').optional().isIn(['general', 'stocks', 'crypto', 'ai', 'business', 'technology', 'all']),
  query('language').optional().isIn(['th', 'en', 'both']), 
  query('detectSymbols').optional().isIn(['true', 'false']) 
];

export const stockValidation = [
  param('symbol').isLength({ min: 1, max: 10 }).trim().toUpperCase()
];

export const searchValidation = [
  query('q').trim().isLength({ min: 1 })
];