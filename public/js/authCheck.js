fetch('/api/auth/status')
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            window.location.href = '/login.html';
        }
    })
    .catch(() => { window.location.href = '/login.html'; });
