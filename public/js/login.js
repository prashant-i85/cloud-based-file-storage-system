
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
        
        // Set an Authorization header for the redirect
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${data.token}`);
        headers.append('X-Local-Token', data.token);
        
        // Using fetch with redirect follow to get to dashboard
        fetch('/dashboard', {
          method: 'GET',
          headers: headers,
          credentials: 'include'
        }).then(response => {
          if (response.ok || response.redirected) {
            // Force a complete page load to dashboard
            window.location.href = '/dashboard?token=' + encodeURIComponent(data.token);
          } else {
            console.error('Dashboard redirect failed');
            errorAlert.textContent = 'Authentication successful but redirect failed. Try again.';
            errorAlert.classList.remove('d-none');
          }
        }).catch(err => {
          console.error('Dashboard fetch error:', err);
          // Fallback direct navigation
          window.location.href = '/dashboard?token=' + encodeURIComponent(data.token);
        });
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
