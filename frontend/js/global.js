document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.querySelector('#darkModeToggle');
    const body = document.body;

    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', () => {
            body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
        });

        if (localStorage.getItem('darkMode') === 'true') {
            body.classList.add('dark-mode');
            toggleSwitch.checked = true;
        }
    }
});

function logout() {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5001/api/v1/auth/logout', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(() => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}