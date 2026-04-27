// =====================================================
//  Auth Logic - Login, Register, Routing
// =====================================================

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value.trim();
    const password = form.password.value;
    const btn = form.querySelector('button[type="submit"]');

    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
        const data = await api.login(username, password);
        api.setAuth(data);
        showToast('Welcome back!', `Hello, ${data.fullName || data.username}`, 'success');
        setTimeout(() => routeUser(data.role), 400);
    } catch (err) {
        showToast('Login Failed', err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const password = form.password.value;
    const confirm = form.confirmPassword.value;

    if (password !== confirm) {
        showToast('Error', 'Passwords do not match', 'error');
        return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
        const data = await api.register({
            username: form.username.value.trim(),
            password: password,
            email: form.email.value.trim(),
            fullName: form.fullName.value.trim()
        });
        showToast('Account Created!', data.message, 'success');
        showAuthTab('login');
        form.reset();
    } catch (err) {
        showToast('Registration Failed', err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}

function routeUser(role) {
    if (role === 'ADMIN') {
        loadAdminDashboard();
    } else {
        loadStudentDashboard();
    }
}

function handleLogout() {
    if (studentData?.timer) studentData.timer.stop();
    window.onbeforeunload = null;
    api.logout();
    showPage('auth-page');
    showToast('Logged out', 'See you next time!', 'info');
}

function showAuthTab(tab) {
    document.getElementById('login-form-container').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('register-form-container').style.display = tab === 'register' ? 'block' : 'none';
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
}

// ── App Init ──
document.addEventListener('DOMContentLoaded', () => {
    // Check existing session
    if (api.isLoggedIn()) {
        const user = api.getUser();
        if (user) {
            routeUser(user.role);
            return;
        }
    }
    showPage('auth-page');

    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => showAuthTab(tab.dataset.tab));
    });
});
