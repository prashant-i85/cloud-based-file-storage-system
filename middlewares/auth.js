
const { cognito } = require('../config/aws-config');
const jwtDecode = require("jwt-decode");

const authenticate = async (req, res, next) => {
  try {
    // Try to get token from multiple sources
    let token = req.headers.authorization?.split(' ')[1] || 
                req.cookies?.token || 
                req.query?.token;
    
    // Check local storage token from custom header if present
    if (req.headers['x-local-token']) {
      token = req.headers['x-local-token'];
    }
    
    // Debug info
    console.log("Auth Headers:", req.headers);
    console.log("Cookies:", req.cookies);
    console.log("Query params:", req.query);
    console.log("Received Token:", token);
    
    if (!token) {
      console.log("No token provided, redirecting to login");
      return res.redirect('/?error=no_token');
    }

    try {
      // Decode the token for debugging
      const decodedToken = jwtDecode(token);
      console.log("Decoded Token:", decodedToken);

      // Check token type if present
      if (decodedToken.token_use && decodedToken.token_use !== "access") {
        console.log("Invalid token type, redirecting to login");
        res.clearCookie('token');
        return res.redirect('/?error=invalid_token_type');
      }

      // Verify the token with Cognito
      const params = { AccessToken: token };
      const userData = await cognito.getUser(params).promise();
      console.log("User Data from Cognito:", userData);

      req.user = userData;
      req.userId = userData.Username;
      next();
    } catch (decodeError) {
      console.error('Token decode error:', decodeError);
      res.clearCookie('token');
      return res.redirect('/');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.clearCookie('token');
    return res.redirect('/');
  }
};

module.exports = { authenticate };
