import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://yvmaxyblbalqcgqdrpfm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bWF4eWJsYmFscWNncWRycGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzAyNjAsImV4cCI6MjA4NTIwNjI2MH0.UPkMAsVCZME9o8S_FP4GYxXzXwAbW_U6QwR2yDiztnY';
const supabase = createClient(supabaseUrl, supabaseKey);

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const closeBtns = document.querySelectorAll('.close');

const authSection = document.getElementById('authSection');
const userSection = document.getElementById('userSection');
const adminSection = document.getElementById('adminSection');

let currentUser = null;

loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

registerBtn.addEventListener('click', () => {
    registerModal.style.display = 'block';
});

closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-modal');
        document.getElementById(modalId).style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nickname = document.getElementById('registerNickname').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const { data, error } = await supabase
            .rpc('register_user', {
                p_nickname: nickname,
                p_password: password
            });

        if (error) throw error;

        alert('Registrazione completata! Ora puoi effettuare il login.');
        registerModal.style.display = 'none';
        document.getElementById('registerForm').reset();
    } catch (error) {
        alert('Errore durante la registrazione: ' + error.message);
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nickname = document.getElementById('loginNickname').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const { data, error } = await supabase
            .rpc('login_user', {
                p_nickname: nickname,
                p_password: password
            });

        if (error) throw error;

        if (data && data.length > 0) {
            currentUser = data[0];
            loginModal.style.display = 'none';
            document.getElementById('loginForm').reset();
            showDashboard(currentUser.role);
        } else {
            alert('Credenziali non valide');
        }
    } catch (error) {
        alert('Errore durante il login: ' + error.message);
    }
});

document.getElementById('userLogoutBtn').addEventListener('click', logout);
document.getElementById('adminLogoutBtn').addEventListener('click', logout);

function showDashboard(role) {
    authSection.style.display = 'none';

    if (role === 'admin') {
        adminSection.style.display = 'block';
        userSection.style.display = 'none';
    } else {
        userSection.style.display = 'block';
        adminSection.style.display = 'none';
    }
}

function logout() {
    currentUser = null;
    authSection.style.display = 'block';
    userSection.style.display = 'none';
    adminSection.style.display = 'none';
}
