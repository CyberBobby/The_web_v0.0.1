import { registerUser, loginUser, logoutUser, getCurrentUser, getUserRole, supabase } from './auth.js';

const navbar = document.getElementById('navbar');
const authContainer = document.getElementById('authContainer');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const mainContent = document.getElementById('mainContent');
const adminPanel = document.getElementById('adminPanel');

document.getElementById('loginBtn').addEventListener('click', () => {
    authContainer.classList.remove('hidden');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
});

document.getElementById('registerBtn').addEventListener('click', () => {
    authContainer.classList.remove('hidden');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

document.getElementById('closeLogin').addEventListener('click', () => {
    authContainer.classList.add('hidden');
    loginForm.classList.add('hidden');
});

document.getElementById('closeRegister').addEventListener('click', () => {
    authContainer.classList.add('hidden');
    registerForm.classList.add('hidden');
});

document.getElementById('loginSubmit').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const { data, error } = await loginUser(email, password);

    if (error) {
        alert('Errore login: ' + error.message);
    } else {
        authContainer.classList.add('hidden');
        loginForm.classList.add('hidden');
        await showMainContent(data.user);
    }
});

document.getElementById('registerSubmit').addEventListener('click', async () => {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    const { data, error } = await registerUser(email, password);

    if (error) {
        alert('Errore registrazione: ' + error.message);
    } else {
        alert('Registrazione completata! Effettua il login.');
        authContainer.classList.add('hidden');
        registerForm.classList.add('hidden');
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logoutUser();
    mainContent.classList.add('hidden');
    navbar.classList.remove('hidden');
});

async function showMainContent(user) {
    navbar.classList.add('hidden');
    mainContent.classList.remove('hidden');

    const role = await getUserRole(user.id);

    document.getElementById('userInfo').innerHTML = `
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Ruolo:</strong> ${role}</p>
    `;

    if (role === 'admin') {
        adminPanel.classList.remove('hidden');
    } else {
        adminPanel.classList.add('hidden');
    }
}

supabase.auth.onAuthStateChange((event, session) => {
    (async () => {
        if (session) {
            await showMainContent(session.user);
        } else {
            mainContent.classList.add('hidden');
            navbar.classList.remove('hidden');
        }
    })();
});

async function init() {
    const user = await getCurrentUser();
    if (user) {
        await showMainContent(user);
    }
}

init();
