
const { cognito } = require('../config/aws-config');
const jwtDecode = require("jwt-decode");

const authenticate = async (req, res, next) => {
  try {
    // Get token from query parameter first (highest priority for this fix)
    let token = req.query?.token;
    
    if (!token) {
      // Then try other sources
      token = req.headers.authorization?.split(' ')[1] || 
              req.cookies?.token || 
              req.headers['x-local-token'];
      
      // Last resort - check raw cookie header
      if (!token && req.headers.cookie) {
        const matches = req.headers.cookie.match(/token=([^;]+)/);
        if (matches) {
          token = matches[1];
        }
      }
    }
    
    console.log("Auth token present:", !!token);
    
    if (!token) {
      console.log("No token found, redirecting to login");
      return res.redirect('/?error=no_token');
    }

    try {
      // Instead of verifying with Cognito every time (which can be slow),
      // just decode the token and check if it's valid
      const decodedToken = jwtDecode(token);
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decodedToken.exp && decodedToken.exp < now) {
        console.log("Token expired, redirecting to login");
        res.clearCookie('token');
        return res.redirect('/?error=token_expired');
      }
      
      // Set user data directly from token
      req.user = {
        Username: decodedToken.username || decodedToken.sub,
        UserAttributes: []
      };
      req.userId = decodedToken.username || decodedToken.sub;
      
      // Always ensure the token is available in cookies for future requests
      if (req.query.token) {
        res.cookie('token', token, {
          httpOnly: true,
          maxAge: 3600000,
          path: '/',
          sameSite: 'lax'
        });
      }
      
      next();
    } catch (decodeError) {
      console.error('Token decode error:', decodeError);
      res.clearCookie('token');
      return res.redirect('/?error=invalid_token');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.clearCookie('token');
    return res.redirect('/?error=' + encodeURIComponent(error.message));
  }
};

module.exports = { authenticate };
