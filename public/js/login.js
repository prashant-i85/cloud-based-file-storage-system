
document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorAlert = document.getElementById('errorAlert');
  
  // Hide any previous errors
  errorAlert.classList.add('d-none');
  
  try {
    console.log(`Attempting login for user: ${username}`);
    
    // Clear any existing tokens
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    
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
    
    if (response.ok && data.token) {
      console.log('Login successful - got token');
      
      // Store token in localStorage for client-side access
      localStorage.setItem('token', data.token);
      
      // Simple redirect - most reliable way
      window.location.href = '/dashboard';
    } else {
      console.error('Login failed:', data.error || 'Unknown error');
      errorAlert.textContent = data.error || 'Login failed. Please check your credentials.';
      errorAlert.classList.remove('d-none');
    }
  } catch (error) {
    console.error('Login error:', error);
    errorAlert.textContent = 'An error occurred during login. Please try again.';
    errorAlert.classList.remove('d-none');
  }
});
