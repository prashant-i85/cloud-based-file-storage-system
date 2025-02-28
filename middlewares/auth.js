
const { cognito } = require('../config/aws-config');
const jwtDecode = require("jwt-decode");

const authenticate = async (req, res, next) => {
  try {
    // Check for token in multiple places
    const token = req.cookies?.token || 
                 req.headers.authorization?.split(' ')[1] || 
                 req.query?.token;

    if (!token) {
      console.log("No token found, redirecting to login");
      return res.redirect('/?error=no_token');
    }

    try {
      // Decode the token to check basic validity
      const decodedToken = jwtDecode(token);
      console.log("Token decoded for user:", decodedToken.username || decodedToken.sub);

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decodedToken.exp && decodedToken.exp < now) {
        console.log("Token expired, redirecting to login");
        return res.redirect('/?error=token_expired');
      }

      // Set user data from token
      req.user = {
        Username: decodedToken.username || decodedToken.sub,
        UserAttributes: []
      };
      req.userId = decodedToken.username || decodedToken.sub;

      // Continue to the protected route
      return next();
    } catch (decodeError) {
      console.error('Token decode error:', decodeError);
      return res.redirect('/?error=invalid_token');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.redirect('/?error=' + encodeURIComponent(error.message));
  }
};

module.exports = { authenticate };
