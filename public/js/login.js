
document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorAlert = document.getElementById('errorAlert');
  
  // Hide any previous errors
  errorAlert.classList.add('d-none');
  
  try {
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
    
    // Print cookie debug info
    console.log("Cookies available to JS:", document.cookie);
    
    if (response.ok) {
      console.log('Login successful, redirecting...');
      console.log('Login response:', data);
      
      // Also store token in localStorage as backup
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('Cookie debug:', { cookies: req.cookies });
      }
      
      // Add a small delay before redirecting
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
    } else {
      errorAlert.textContent = data.error || 'Login failed. Please check your credentials.';
      errorAlert.classList.remove('d-none');
    }
  } catch (error) {
    console.error('Login error:', error);
    errorAlert.textContent = 'An error occurred during login. Please try again.';
    errorAlert.classList.remove('d-none');
  }
});
