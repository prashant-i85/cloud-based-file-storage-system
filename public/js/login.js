
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorAlert = document.getElementById('errorAlert');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorAlert.classList.add('d-none');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      console.log('Attempting login for user:', username);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response:', data);

      if (data.token) {
        // Save token in multiple places to ensure persistence
        localStorage.setItem('token', data.token);
        sessionStorage.setItem('token', data.token);
        
        // Set token as a cookie
        document.cookie = `token=${data.token}; path=/; max-age=3600; SameSite=Lax`;
        document.cookie = `token_debug=token_set_${Date.now()}; path=/; max-age=3600`;
        
        console.log('Token set in localStorage and cookie');
        
        // Simple redirect - most reliable method
        window.location.href = '/dashboard';
      } else {
        console.error('No token received in login response!');
        errorAlert.textContent = 'Authentication failed. Please check your credentials.';
        errorAlert.classList.remove('d-none');
      }
    } catch (error) {
      console.error('Login error:', error);
      errorAlert.textContent = 'An error occurred during login. Please try again.';
      errorAlert.classList.remove('d-none');
    }
  });
});
