        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                successAlert.textContent = 'Registration successful! Please check your email for verification code.';
                successAlert.classList.remove('d-none');

                // Switch to confirmation form
                document.getElementById('registrationForm').classList.add('d-none');
                document.getElementById('confirmationForm').classList.remove('d-none');

                // Store username for confirmation
                registeredUsername = username;
            } else {
                // Show error message
                errorAlert.textContent = data.error || 'Registration failed. Please try again.';
                errorAlert.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Registration error:', error);
            errorAlert.textContent = 'An error occurred during registration. Please try again.';
            errorAlert.classList.remove('d-none');
        }
        });

        document.getElementById('verifyForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const confirmationCode = document.getElementById('confirmationCode').value;
        const errorAlert = document.getElementById('errorAlert');
        const successAlert = document.getElementById('successAlert');

        try {
            const response = await fetch('/api/auth/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username: registeredUsername, 
                    confirmationCode 
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                successAlert.textContent = 'Account verified successfully! Redirecting to login...';
                successAlert.classList.remove('d-none');

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                // Show error message
                errorAlert.textContent = data.error || 'Verification failed. Please try again.';
                errorAlert.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Verification error:', error);
            errorAlert.textContent = 'An error occurred during verification. Please try again.';
            errorAlert.classList.remove('d-none');
        }
        });