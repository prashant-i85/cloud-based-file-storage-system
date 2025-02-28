
document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorAlert = document.getElementById('errorAlert');
  
  // Hide any previous errors
  errorAlert.classList.add('d-none');
  
  try {
    // Display login attempt info
    console.log(`Attempting login for user: ${username}`);
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      }),
      credentials: 'include' // Include cookies in the request
    });
    
    const data = await response.json();
    console.log('Login response status:', response.status);
    console.log('Login response:', data);
    
    if (response.ok) {
      console.log('Login successful, attempting redirect...');
      
      // Store token in multiple places to ensure it's available
      if (data.token) {
        localStorage.setItem('token', data.token);
        
        // Set cookie directly as a fallback (browser-only, not httpOnly)
        document.cookie = `token=${data.token}; path=/; max-age=3600`;
        sessionStorage.setItem('token', data.token);
        
        console.log('Token stored in localStorage, sessionStorage, and cookie');
        
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
    } else {
      console.error('Login failed:', data.error);
      errorAlert.textContent = data.error || 'Login failed. Please check your credentials.';
      errorAlert.classList.remove('d-none');
    }
  } catch (error) {
    console.error('Login error:', error);
    errorAlert.textContent = 'An error occurred during login. Please try again.';
    errorAlert.classList.remove('d-none');
  }
});
