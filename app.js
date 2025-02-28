const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const { initializeAWS } = require('./config/aws-config');

// Import routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Add debug middleware to log cookies on every request
app.use((req, res, next) => {
  console.log('=== REQUEST INFO ===');
  console.log('Path:', req.path);
  console.log('Cookies:', req.cookies);
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize AWS resources
initializeAWS().catch(console.error);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Render views
app.get('/', (req, res) => {
  const error = req.query.error || null;
  res.render('login', { error });
});

app.get('/register', (req, res) => {
  res.render('register');
});

const { authenticate } = require('./middlewares/auth');

// Debug route to check cookies
app.get('/debug-cookies', (req, res) => {
  console.log("Debug cookies route accessed");
  console.log("All cookies:", req.cookies);
  res.json({
    cookies: req.cookies,
    hasToken: !!req.cookies.token,
    tokenLength: req.cookies.token ? req.cookies.token.length : 0
  });
});

app.get('/dashboard', authenticate, (req, res) => {
  console.log("Dashboard route accessed with authenticated user");
  res.render('dashboard', { user: req.user });
});

app.get('/file/:fileId', authenticate, (req, res) => {
  res.render('fileView', { fileId: req.params.fileId, user: req.user });
});

// Handle 404
app.use((req, res) => {
  res.status(404).render('404');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { error: err });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;