
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorAlert = document.getElementById('errorAlert');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      try {
        // Clear previous errors
        errorAlert.textContent = '';
        errorAlert.classList.add('d-none');
        
        // Send login request
        console.log('Attempting login for user:', username);
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username,
            password
          })
        });
        
        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response:', data);
        
        if (response.ok && data.token) {
          // Store token in localStorage and sessionStorage
          localStorage.setItem('token', data.token);
          sessionStorage.setItem('token', data.token);
          console.log('Token set in localStorage and cookie');
          
          // Set a debug cookie to verify token is being saved
          document.cookie = `token_debug=token_set_${Date.now()}`;
          const cookies = document.cookie;
          console.log('Cookies available to JS:', cookies);
          
          console.log('Login successful, redirecting...');
          
          // Create a hidden form and submit it to trigger server-side redirect
          const form = document.createElement('form');
          form.method = 'GET';
          form.action = '/dashboard';
          
          // Add token as hidden field
          const hiddenField = document.createElement('input');
          hiddenField.type = 'hidden';
          hiddenField.name = 'token';
          hiddenField.value = data.token;
          form.appendChild(hiddenField);
          
          document.body.appendChild(form);
          console.log('Submitting form to redirect to dashboard...');
          
          // Submit the form after a short delay
          setTimeout(() => {
            form.submit();
          }, 100);
        } else {
          console.error('No token received in login response!');
          errorAlert.textContent = 'Authentication successful but no token received. Please try again.';
          errorAlert.classList.remove('d-none');
        }
      } catch (error) {
        console.error('Login error:', error);
        errorAlert.textContent = error.message || 'Error during login. Please try again.';
        errorAlert.classList.remove('d-none');
      }
    });
  }
});
