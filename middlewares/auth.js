const { cognito } = require('../config/aws-config');

// Authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify the token by making a call to Cognito
    const params = {
      AccessToken: token
    };

    const userData = await cognito.getUser(params).promise();
    req.user = userData;
    req.userId = userData.Username;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = {
  authenticate
};