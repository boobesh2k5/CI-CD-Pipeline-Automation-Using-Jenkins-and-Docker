require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const jobLimiter = require('./rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECT_NAME = 'JobCompass'; 


app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Verify credentials are loaded
console.log(`🔐 GitHub OAuth Config:`);
console.log(`   - Client ID: ${process.env.GITHUB_CLIENT_ID ? '✓ Loaded' : '✗ Missing'}`);
console.log(`   - Client Secret: ${process.env.GITHUB_CLIENT_SECRET ? '✓ Loaded' : '✗ Missing'}`);
console.log(`   - Callback URL: ${process.env.GITHUB_CALLBACK_URL || '✗ Missing'}`);

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
  userAgent: 'JobCompass-App'
}, (accessToken, refreshToken, profile, done) => {
  console.log(`✅ OAuth Strategy Callback - User: ${profile.username}`);
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.use(express.static(path.join(__dirname)));
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/?error=auth_failed' }),
  (req, res) => {
    console.log(`✅ ${PROJECT_NAME}: GitHub login successful for ${req.user.username || req.user.displayName}`);
    res.redirect('/');
  }
);

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthorized: Please login with GitHub' });
};

app.get('/api/jobs', ensureAuth, jobLimiter, async (req, res) => {
  const { query, location } = req.query;

  try {
    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: {
        query: query || 'developer',
        page: '1',
        num_pages: '1',
        location: location || 'india'
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`${PROJECT_NAME} API Error:`, error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch jobs. Please try again later.'
    });
  }
});

app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      user: req.user.displayName || req.user.username,
      loggedIn: true
    });
  } else {
    res.json({ user: null, loggedIn: false });
  }
});

app.get('/api', (req, res) => {
  res.json({ message: `Welcome to the ${PROJECT_NAME} API 🚀` });
});

app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));
app.use((err, req, res, next) => {
  console.error(`${PROJECT_NAME} Server Error:`, err);
  console.error(`Error Stack:`, err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 ${PROJECT_NAME} server running at http://localhost:${PORT}`);
});
