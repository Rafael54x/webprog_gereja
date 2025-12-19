document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            const errorMessage = document.getElementById('error-message');
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (data.success) {
                    window.location.href = '/index.html';
                } else {
                    errorMessage.textContent = data.message;
                }
            } catch (error) { errorMessage.textContent = 'Tidak dapat terhubung ke server.'; }
        });
    }
});
