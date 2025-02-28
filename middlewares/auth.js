const { cognito } = require('../config/aws-config');
const jwtDecode = require("jwt-decode");

const authenticate = async (req, res, next) => {
  try {
    console.log("==== Authentication Start ====");
    console.log("Request path:", req.path);
    console.log("Request method:", req.method);
    
    // Get token from Authorization header or cookies
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    console.log("Auth Headers:", req.headers.authorization);
    console.log("All cookies:", req.cookies);
    console.log("Token from cookies:", req.cookies?.token);
    console.log("Token length:", token ? token.length : 0);

    if (!token) {
      console.log("No token provided, redirecting to login");
      return res.redirect('/');
    }

    try {
      // Decode the token for debugging
      const decodedToken = jwtDecode(token);
      console.log("Decoded Token:", JSON.stringify(decodedToken, null, 2));
      console.log("Token claims - token_use:", decodedToken.token_use);
      console.log("Token claims - exp:", new Date(decodedToken.exp * 1000).toISOString());
      console.log("Current time:", new Date().toISOString());

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        console.log("Token is expired, redirecting to login");
        res.clearCookie('token');
        return res.redirect('/?error=token_expired');
      }

      // Ensure token is an Access Token
      if (decodedToken.token_use !== "access") {
        console.log("Invalid token type, redirecting to login");
        res.clearCookie('token');
        return res.redirect('/');
      }

      // Verify the token with Cognito
      try {
        const params = { AccessToken: token };
        const userData = await cognito.getUser(params).promise();
        console.log("User Data from Cognito:", userData);

        req.user = userData;
        req.userId = userData.Username;
        next();
      } catch (cognitoError) {
        console.error('Cognito validation error:', cognitoError);
        res.clearCookie('token');
        return res.redirect('/?error=invalid_token');
      }
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
