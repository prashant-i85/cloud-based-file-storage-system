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
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'secret-key'));
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
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

const { authenticate } = require('./middlewares/auth');

app.get('/dashboard', (req, res, next) => {
  // If token is in query params, set it in the cookie before authentication
  if (req.query.token) {
    console.log('Received token via query params, setting cookie');
    res.cookie('token', req.query.token, {
      httpOnly: false,
      maxAge: 3600000, // 1 hour
      path: '/',
      sameSite: 'lax' // Changed from strict to lax to allow redirects
    });
  }
  next();
}, authenticate, (req, res) => {
  res.render('dashboard', { user: req.user });
});

app.get('/file/:fileId', authenticate, (req, res) => {
  res.render('fileView', { fileId: req.params.fileId, user: req.user });
});

// Debug route to check authentication
app.get('/debug-auth', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || 
                req.cookies?.token || 
                req.query?.token;
  
  res.json({
    hasToken: !!token, 
    tokenSource: token ? 'Found token' : 'No token',
    cookies: req.cookies,
    headers: {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie
    }
  });
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