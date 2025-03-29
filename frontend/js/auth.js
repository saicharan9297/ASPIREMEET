document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const messageDiv = document.getElementById('message');

    // Check authentication for protected pages
    const protectedPages = ['user-home.html', 'dashboard.html', 'create-meeting.html', 'view-meetings.html', 'meeting-summary.html'];
    if (protectedPages.some(page => window.location.pathname.includes(page)) && !token) {
        window.location.href = 'login.html';
    }

    // Fetch user data if logged in
    if (token && document.getElementById('username')) {
        fetch('http://localhost:5001/api/v1/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch user data');
            return response.json();
        })
        .then(data => {
            if (data.success && data.data) {
                document.getElementById('username').textContent = data.data.username;
                if (document.getElementById('auth-buttons')) {
                    document.getElementById('auth-buttons').style.display = 'none';
                    document.getElementById('logged-in').style.display = 'block';
                }
            } else {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
        })
        .catch(error => {
            console.error('Error fetching user:', error);
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            if (messageDiv) {
                messageDiv.textContent = 'Session expired. Please log in again.';
                messageDiv.style.color = 'red';
            }
        });
    }

    // Login Form Submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            fetch('http://localhost:5001/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
            .then(response => {
                if (!response.ok) throw new Error('Login failed');
                return response.json();
            })
            .then(data => {
                if (data.success && data.token) {
                    localStorage.setItem('token', data.token);
                    messageDiv.textContent = 'Login successful! Redirecting...';
                    messageDiv.style.color = 'green';
                    // Fetch user data immediately after login
                    fetch('http://localhost:5001/api/v1/auth/me', {
                        headers: { 'Authorization': `Bearer ${data.token}` }
                    })
                    .then(response => response.json())
                    .then(userData => {
                        if (userData.success) {
                            setTimeout(() => {
                                window.location.href = 'user-home.html';
                            }, 1500);
                        } else {
                            throw new Error('Failed to fetch user data after login');
                        }
                    })
                    .catch(error => {
                        console.error('Error after login:', error);
                        messageDiv.textContent = 'Error fetching user data';
                        messageDiv.style.color = 'red';
                        localStorage.removeItem('token');
                    });
                } else {
                    messageDiv.textContent = data.error || 'Invalid email or password';
                    messageDiv.style.color = 'red';
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                messageDiv.textContent = 'An error occurred during login';
                messageDiv.style.color = 'red';
            });
        });
    }

    // Signup Form Submission
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const dateOfBirth = document.getElementById('dateOfBirth').value;
        const location = document.getElementById('location').value;
        const messageDiv = document.getElementById('message');

        fetch('http://localhost:5001/api/v1/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, dateOfBirth, location })
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Signup endpoint not found (404). Check backend server.');
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                messageDiv.textContent = 'Signup successful! Redirecting to login...';
                messageDiv.style.color = 'green';
                setTimeout(() => window.location.href = 'login.html', 1500);
            } else {
                messageDiv.textContent = data.error || 'Signup failed';
                messageDiv.style.color = 'red';
            }
        })
        .catch(error => {
            console.error('Signup error:', error);
            messageDiv.textContent = error.message || 'An error occurred during signup';
            messageDiv.style.color = 'red';
        });

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    document.getElementById('location').value = 
                        `Lat: ${position.coords.latitude}, Long: ${position.coords.longitude}`;
                },
                () => { document.getElementById('location').value = 'Location access denied'; }
            );
        }
    });
}
// Forgot Password 
document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const messageDiv = document.getElementById('messageDiv');

    // Forgot Password - Step 1
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();

            if (!email) {
                showMessage('Please enter your email', 'red');
                return;
            }

            try {
                const response = await fetch('http://localhost:5001/api/v1/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server Error: ${errorText}`);
                }

                const data = await response.json();

                if (data.success) {
                    document.getElementById('step1').style.display = 'none';
                    document.getElementById('step2').style.display = 'block';
                    showMessage('Email verified. Please set a new password.', 'green');
                } else {
                    showMessage(data.error || 'Email not found', 'red');
                }
            } catch (error) {
                console.error('Forgot password error:', error);
                showMessage('Error verifying email. Please try again later.', 'red');
            }
        });
    }

    // Reset Password - Step 2
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const dob = document.getElementById('dob').value.trim();
            const newPassword = document.getElementById('newPassword').value.trim();

            if (!dob || !newPassword) {
                showMessage('Please enter all fields', 'red');
                return;
            }

            if (newPassword.length < 6) {
                showMessage('Password must be at least 6 characters long', 'red');
                return;
            }

            try {
                const response = await fetch('http://localhost:5001/api/v1/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dob, newPassword })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server Error: ${errorText}`);
                }

                const data = await response.json();

                if (data.success) {
                    showMessage('Password reset successful! Redirecting to login...', 'green');
                    setTimeout(() => window.location.href = 'login.html', 1500);
                } else {
                    showMessage(data.error || 'Reset failed', 'red');
                }
            } catch (error) {
                console.error('Reset password error:', error);
                showMessage('Error resetting password. Please try again.', 'red');
            }
        });
    }

    // Helper function to display messages
    function showMessage(msg, color) {
        messageDiv.textContent = msg;
        messageDiv.style.color = color;
    }
});
});