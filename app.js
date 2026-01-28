import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const DEV_MODE = true;

const supabaseUrl = 'https://yvmaxyblbalqcgqdrpfm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bWF4eWJsYmFscWNncWRycGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzAyNjAsImV4cCI6MjA4NTIwNjI2MH0.UPkMAsVCZME9o8S_FP4GYxXzXwAbW_U6QwR2yDiztnY';
const supabase = createClient(supabaseUrl, supabaseKey);

function devLog(message, type = 'info') {
    if (!DEV_MODE) return;

    const consoleContent = document.getElementById('devConsoleContent');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `dev-log dev-log-${type}`;
    logEntry.innerHTML = `<span class="dev-timestamp">[${timestamp}]</span> ${message}`;
    consoleContent.appendChild(logEntry);
    consoleContent.scrollTop = consoleContent.scrollHeight;

    console.log(`[DEV] ${message}`);
}

if (DEV_MODE) {
    document.getElementById('devConsole').style.display = 'block';
}

document.getElementById('clearDevConsole')?.addEventListener('click', () => {
    document.getElementById('devConsoleContent').innerHTML = '';
    devLog('Console pulita', 'info');
});

devLog('App inizializzata', 'success');
devLog('Connessione a Supabase stabilita', 'success');

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
    devLog('Modal login aperto', 'info');
    loginModal.style.display = 'block';
});

registerBtn.addEventListener('click', () => {
    devLog('Modal registrazione aperto', 'info');
    registerModal.style.display = 'block';
});

closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-modal');
        devLog(`Modal ${modalId} chiuso`, 'info');
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

    devLog(`Tentativo di registrazione per: ${nickname}`, 'info');
    devLog(`Campo nickname: ${nickname ? 'compilato' : 'vuoto'}`, nickname ? 'success' : 'error');
    devLog(`Campo password: ${password ? 'compilato' : 'vuoto'}`, password ? 'success' : 'error');

    try {
        devLog('Invio richiesta di registrazione a Supabase...', 'info');
        const { data, error } = await supabase
            .rpc('register_user', {
                p_nickname: nickname,
                p_password: password
            });

        if (error) throw error;

        devLog(`Registrazione completata con successo per: ${nickname}`, 'success');
        alert('Registrazione completata! Ora puoi effettuare il login.');
        registerModal.style.display = 'none';
        document.getElementById('registerForm').reset();
    } catch (error) {
        devLog(`Errore durante la registrazione: ${error.message}`, 'error');
        alert('Errore durante la registrazione: ' + error.message);
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nickname = document.getElementById('loginNickname').value;
    const password = document.getElementById('loginPassword').value;

    devLog(`Tentativo di login per: ${nickname}`, 'info');
    devLog(`Campo nickname: ${nickname ? 'compilato' : 'vuoto'}`, nickname ? 'success' : 'error');
    devLog(`Campo password: ${password ? 'compilato' : 'vuoto'}`, password ? 'success' : 'error');

    try {
        devLog('Invio richiesta di login a Supabase...', 'info');
        const { data, error } = await supabase
            .rpc('login_user', {
                p_nickname: nickname,
                p_password: password
            });

        if (error) throw error;

        if (data && data.length > 0) {
            currentUser = data[0];
            devLog(`Login riuscito! Ruolo utente: ${currentUser.role}`, 'success');
            devLog(`Dati utente ricevuti: ID=${currentUser.id}`, 'info');
            loginModal.style.display = 'none';
            document.getElementById('loginForm').reset();
            showDashboard(currentUser.role);
        } else {
            devLog('Login fallito: credenziali non valide', 'error');
            alert('Credenziali non valide');
        }
    } catch (error) {
        devLog(`Errore durante il login: ${error.message}`, 'error');
        alert('Errore durante il login: ' + error.message);
    }
});

document.getElementById('userLogoutBtn').addEventListener('click', logout);
document.getElementById('adminLogoutBtn').addEventListener('click', logout);

function showDashboard(role) {
    devLog(`Mostrando dashboard per ruolo: ${role}`, 'info');
    authSection.style.display = 'none';

    if (role === 'admin') {
        devLog('Dashboard admin visualizzata', 'success');
        adminSection.style.display = 'block';
        userSection.style.display = 'none';
    } else {
        devLog('Dashboard utente visualizzata', 'success');
        userSection.style.display = 'block';
        adminSection.style.display = 'none';
    }
}

function logout() {
    devLog(`Logout eseguito per utente: ${currentUser?.nickname || 'sconosciuto'}`, 'info');
    currentUser = null;
    authSection.style.display = 'block';
    userSection.style.display = 'none';
    adminSection.style.display = 'none';
    devLog('Ritorno alla schermata di autenticazione', 'success');
}
