const rateLimit = require('express-rate-limit');

const jobLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: {
    error: '⚠️ JobCompass limit reached: Only 10 searches allowed per hour. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = jobLimiter;
