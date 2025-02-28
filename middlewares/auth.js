
const { cognito } = require('../config/aws-config');
const jwtDecode = require("jwt-decode");

const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    console.log("Received Token:", token);

    if (!token) {
      console.log("No token provided, redirecting to login");
      return res.redirect('/');
    }

    try {
      // Decode the token for debugging
      const decodedToken = jwtDecode(token);
      console.log("Decoded Token:", decodedToken);

      // Ensure token is an Access Token
      if (decodedToken.token_use !== "access") {
        console.log("Invalid token type, redirecting to login");
        res.clearCookie('token');
        return res.redirect('/');
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
