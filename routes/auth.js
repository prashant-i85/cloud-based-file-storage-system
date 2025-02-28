const express = require('express');
const router = express.Router();
const { cognito } = require('../config/aws-config');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const params = {
      ClientId: process.env.CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        }
      ]
    };

    const data = await cognito.signUp(params).promise();
    res.status(200).json({ message: 'User registered successfully', data });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Confirm user registration
router.post('/confirm', async (req, res) => {
  try {
    const { username, confirmationCode } = req.body;

    const params = {
      ClientId: process.env.CLIENT_ID,
      Username: username,
      ConfirmationCode: confirmationCode
    };

    await cognito.confirmSignUp(params).promise();
    res.status(200).json({ message: 'User confirmed successfully' });
  } catch (error) {
    console.error('Confirmation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    };

    const data = await cognito.initiateAuth(params).promise();

    if (!data.AuthenticationResult) {
      throw new Error('Authentication failed: No authentication result returned');
    }

    console.log("Login successful, setting token cookie");
    console.log("Token length:", data.AuthenticationResult.AccessToken.length);
    
    // Set the cookie with even more permissive settings
    res.cookie('token', data.AuthenticationResult.AccessToken, {
      httpOnly: true,
      maxAge: 3600000, // 1 hour
      path: '/',
      sameSite: 'none', // Changed to 'none' to ensure cross-site cookies work
      secure: process.env.NODE_ENV === 'production' // Only require secure in production
    });

    // Also set a backup cookie without httpOnly for debugging
    res.cookie('token_debug', 'token_set_' + Date.now(), {
      httpOnly: false,
      maxAge: 3600000,
      path: '/'
    });
    
    console.log("Cookie set:", req.cookies);

    res.status(200).json({
      message: 'Login successful',
      token: data.AuthenticationResult.AccessToken,
      expiresIn: data.AuthenticationResult.ExpiresIn
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (token) {
      const params = {
        AccessToken: token
      };

      await cognito.globalSignOut(params).promise();
    }

    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;