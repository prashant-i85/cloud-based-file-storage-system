const { cognito } = require('../config/aws-config');
const jwtDecode = require("jwt-decode");

const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    console.log("Received Token:", token);

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Decode the token for debugging
    const decodedToken = jwtDecode(token);
    console.log("Decoded Token:", decodedToken);

    // Ensure token is an Access Token
    if (decodedToken.token_use !== "access") {
      return res.status(401).json({ error: "Invalid token type. Access token required." });
    }

    // Verify the token with Cognito
    const params = { AccessToken: token };
    const userData = await cognito.getUser(params).promise();
    console.log("User Data from Cognito:", userData);

    req.user = userData;
    req.userId = userData.Username;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
