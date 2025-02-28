
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
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Login successful, redirecting...');
      window.location.href = '/dashboard';
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
