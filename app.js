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

document.getElementById('devConsole').style.display = 'none';

document.getElementById('clearDevConsole')?.addEventListener('click', () => {
    document.getElementById('devConsoleContent').innerHTML = '';
    devLog('Console pulita', 'info');
});

devLog('App inizializzata', 'success');
devLog('Connessione a Supabase stabilita', 'success');

loadFlyers();

const savedUser = localStorage.getItem('currentUser');
if (savedUser) {
    try {
        currentUser = JSON.parse(savedUser);
        devLog(`Utente ripristinato da localStorage: ${currentUser.nickname}`, 'success');
        showDashboard(currentUser.role);
    } catch (error) {
        devLog('Errore ripristino sessione', 'error');
        localStorage.removeItem('currentUser');
    }
}

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const closeBtns = document.querySelectorAll('.close');

const authSection = document.getElementById('authSection');
const userSection = document.getElementById('userSection');
const adminSection = document.getElementById('adminSection');
const developerSection = document.getElementById('developerSection');
const publisherSection = document.getElementById('publisherSection');

const flyerModal = document.getElementById('flyerModal');
const userManagementModal = document.getElementById('userManagementModal');

let currentUser = null;
let currentEditingFlyer = null;

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
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            devLog(`Login riuscito! Ruolo utente: ${currentUser.role}`, 'success');
            devLog(`Dati utente ricevuti: ID=${currentUser.id}`, 'info');
            devLog('Sessione salvata in localStorage', 'success');
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
document.getElementById('developerLogoutBtn').addEventListener('click', logout);
document.getElementById('publisherLogoutBtn').addEventListener('click', logout);

function showDashboard(role) {
    devLog(`Mostrando dashboard per ruolo: ${role}`, 'info');
    authSection.style.display = 'none';
    userSection.style.display = 'none';
    adminSection.style.display = 'none';
    developerSection.style.display = 'none';
    publisherSection.style.display = 'none';

    if (role === 'developer' && DEV_MODE) {
        document.getElementById('devConsole').style.display = 'block';
    } else {
        document.getElementById('devConsole').style.display = 'none';
    }

    if (role === 'admin') {
        devLog('Dashboard admin visualizzata', 'success');
        adminSection.style.display = 'block';
        loadFlyers();
        loadFlyerRequests('admin');
    } else if (role === 'developer') {
        devLog('Dashboard developer visualizzata', 'success');
        developerSection.style.display = 'block';
        loadFlyers();
        loadFlyerRequests('developer');
        loadPublishers();
    } else if (role === 'publisher') {
        devLog('Dashboard publisher visualizzata', 'success');
        publisherSection.style.display = 'block';
        loadFlyers();
        loadMyRequests();
        displayFideltyStatus();
    } else {
        devLog('Dashboard utente visualizzata', 'success');
        userSection.style.display = 'block';
        loadFlyers();
    }
}

function logout() {
    devLog(`Logout eseguito per utente: ${currentUser?.nickname || 'sconosciuto'}`, 'info');
    currentUser = null;
    localStorage.removeItem('currentUser');
    devLog('Sessione rimossa da localStorage', 'info');
    authSection.style.display = 'block';
    userSection.style.display = 'none';
    adminSection.style.display = 'none';
    developerSection.style.display = 'none';
    publisherSection.style.display = 'none';
    document.getElementById('devConsole').style.display = 'none';
    devLog('Ritorno alla schermata di autenticazione', 'success');
}

async function loadFlyers() {
    devLog('Caricamento flyer dal database...', 'info');

    try {
        const { data, error } = await supabase
            .from('flyer')
            .select('*')
            .order('data', { ascending: false });

        if (error) throw error;

        devLog(`${data.length} flyer caricati dal database`, 'success');

        renderFlyers(data, 'flyerContainer', false);
        renderFlyers(data, 'flyerContainerUser', false);
        renderFlyers(data, 'flyerContainerAdmin', true);
        renderFlyers(data, 'flyerContainerDeveloper', true);
        renderFlyers(data, 'flyerContainerPublisher', currentUser?.role === 'publisher');
    } catch (error) {
        devLog(`Errore durante il caricamento dei flyer: ${error.message}`, 'error');
        console.error('Errore caricamento flyer:', error);
    }
}

function renderFlyers(flyers, containerId, showActions) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!flyers || flyers.length === 0) {
        devLog(`Nessun flyer da visualizzare in ${containerId}`, 'info');
        container.innerHTML = '<div class="no-flyer-message">Nessun evento disponibile al momento</div>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'flyer-table';

    const actionsHeader = showActions ? '<th>Azioni</th>' : '';

    table.innerHTML = `
        <thead>
            <tr>
                <th>Nome</th>
                <th>Data</th>
                <th>Crew</th>
                <th>Descrizione</th>
                <th>Creato da</th>
                ${actionsHeader}
            </tr>
        </thead>
        <tbody>
            ${flyers.map(flyer => {
                const canEdit = showActions && (
                    currentUser?.role === 'admin' ||
                    currentUser?.role === 'developer' ||
                    (currentUser?.role === 'publisher' && flyer.user_nickname === currentUser.nickname)
                );

                const actionsCell = canEdit ? `
                    <td>
                        <div class="flyer-actions">
                            <button class="edit-btn" onclick="editFlyer('${flyer.id}')">Modifica</button>
                            <button class="delete-btn" onclick="deleteFlyer('${flyer.id}')">Elimina</button>
                        </div>
                    </td>
                ` : '';

                return `
                    <tr>
                        <td>${flyer.nome}</td>
                        <td>${new Date(flyer.data).toLocaleDateString('it-IT')}</td>
                        <td>${flyer.crew}</td>
                        <td>${flyer.descrizione}</td>
                        <td>${flyer.user_nickname}</td>
                        ${actionsCell}
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;

    container.innerHTML = '';
    container.appendChild(table);
    devLog(`${flyers.length} flyer renderizzati in ${containerId}`, 'success');
}

document.getElementById('addFlyerBtnAdmin')?.addEventListener('click', () => openFlyerModal());
document.getElementById('addFlyerBtnDev')?.addEventListener('click', () => openFlyerModal());
document.getElementById('addFlyerBtnPublisher')?.addEventListener('click', () => openFlyerModal());

function openFlyerModal(flyerId = null) {
    currentEditingFlyer = flyerId;
    const modal = document.getElementById('flyerModal');
    const title = document.getElementById('flyerModalTitle');

    if (flyerId) {
        title.textContent = 'Modifica Flyer';
        loadFlyerData(flyerId);
    } else {
        title.textContent = 'Aggiungi Flyer';
        document.getElementById('flyerForm').reset();
        document.getElementById('flyerId').value = '';
    }

    modal.style.display = 'block';
    devLog(`Modal flyer ${flyerId ? 'modifica' : 'creazione'} aperto`, 'info');
}

async function loadFlyerData(flyerId) {
    try {
        const { data, error } = await supabase
            .from('flyer')
            .select('*')
            .eq('id', flyerId)
            .maybeSingle();

        if (error) throw error;
        if (data) {
            document.getElementById('flyerId').value = data.id;
            document.getElementById('flyerNome').value = data.nome;
            document.getElementById('flyerData').value = data.data;
            document.getElementById('flyerCrew').value = data.crew;
            document.getElementById('flyerDescrizione').value = data.descrizione;
        }
    } catch (error) {
        devLog(`Errore caricamento flyer: ${error.message}`, 'error');
    }
}

document.getElementById('flyerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const flyerId = document.getElementById('flyerId').value;
    const nome = document.getElementById('flyerNome').value;
    const data = document.getElementById('flyerData').value;
    const crew = document.getElementById('flyerCrew').value;
    const descrizione = document.getElementById('flyerDescrizione').value;

    const flyerData = {
        nome,
        data,
        crew,
        descrizione,
        user_nickname: currentUser.nickname
    };

    try {
        if (currentUser.role === 'publisher' && currentUser.fidelty !== 'friendly') {
            await createFlyerRequest(flyerData);
        } else if (flyerId) {
            await updateFlyer(flyerId, flyerData);
        } else {
            await createFlyer(flyerData);
        }

        flyerModal.style.display = 'none';
        document.getElementById('flyerForm').reset();
    } catch (error) {
        devLog(`Errore: ${error.message}`, 'error');
        alert('Errore: ' + error.message);
    }
});

async function createFlyer(flyerData) {
    devLog('Creazione nuovo flyer...', 'info');

    const { data, error } = await supabase
        .from('flyer')
        .insert([flyerData])
        .select();

    if (error) throw error;

    devLog('Flyer creato con successo!', 'success');
    alert('Flyer creato con successo!');
    loadFlyers();
}

async function updateFlyer(flyerId, flyerData) {
    devLog(`Aggiornamento flyer ${flyerId}...`, 'info');

    const { data, error } = await supabase
        .from('flyer')
        .update(flyerData)
        .eq('id', flyerId);

    if (error) throw error;

    devLog('Flyer aggiornato con successo!', 'success');
    alert('Flyer aggiornato con successo!');
    loadFlyers();
}

async function createFlyerRequest(flyerData) {
    devLog('Creazione richiesta flyer...', 'info');

    const requestData = {
        publisher_nickname: currentUser.nickname,
        nome: flyerData.nome,
        data: flyerData.data,
        crew: flyerData.crew,
        descrizione: flyerData.descrizione,
        status: 'pending'
    };

    const { data, error } = await supabase
        .from('flyer_requests')
        .insert([requestData])
        .select();

    if (error) throw error;

    devLog('Richiesta flyer inviata con successo!', 'success');
    alert('Richiesta flyer inviata! Verrà revisionata da un admin o developer.');
    loadMyRequests();
}

window.editFlyer = async function(flyerId) {
    openFlyerModal(flyerId);
}

window.deleteFlyer = async function(flyerId) {
    if (!confirm('Sei sicuro di voler eliminare questo flyer?')) return;

    devLog(`Eliminazione flyer ${flyerId}...`, 'info');

    try {
        const { error } = await supabase
            .from('flyer')
            .delete()
            .eq('id', flyerId);

        if (error) throw error;

        devLog('Flyer eliminato con successo!', 'success');
        alert('Flyer eliminato!');
        loadFlyers();
    } catch (error) {
        devLog(`Errore eliminazione flyer: ${error.message}`, 'error');
        alert('Errore durante l\'eliminazione: ' + error.message);
    }
}

async function loadFlyerRequests(role) {
    devLog('Caricamento richieste flyer...', 'info');

    try {
        const { data, error } = await supabase
            .from('flyer_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        devLog(`${data.length} richieste caricate`, 'success');

        if (role === 'admin') {
            renderRequests(data, 'requestsContainerAdmin');
        } else if (role === 'developer') {
            renderRequests(data, 'requestsContainerDeveloper');
        }
    } catch (error) {
        devLog(`Errore caricamento richieste: ${error.message}`, 'error');
    }
}

function renderRequests(requests, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!requests || requests.length === 0) {
        container.innerHTML = '<div class="no-flyer-message">Nessuna richiesta in attesa</div>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'flyer-table';

    table.innerHTML = `
        <thead>
            <tr>
                <th>Nome</th>
                <th>Data</th>
                <th>Crew</th>
                <th>Descrizione</th>
                <th>Publisher</th>
                <th>Azioni</th>
            </tr>
        </thead>
        <tbody>
            ${requests.map(req => `
                <tr>
                    <td>${req.nome}</td>
                    <td>${new Date(req.data).toLocaleDateString('it-IT')}</td>
                    <td>${req.crew}</td>
                    <td>${req.descrizione}</td>
                    <td>${req.publisher_nickname}</td>
                    <td>
                        <div class="flyer-actions">
                            <button class="approve-btn" onclick="approveRequest('${req.id}')">Approva</button>
                            <button class="reject-btn" onclick="rejectRequest('${req.id}')">Rifiuta</button>
                        </div>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;

    container.innerHTML = '';
    container.appendChild(table);
}

window.approveRequest = async function(requestId) {
    devLog(`Approvazione richiesta ${requestId}...`, 'info');

    try {
        const { data: request, error: fetchError } = await supabase
            .from('flyer_requests')
            .select('*')
            .eq('id', requestId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        const flyerData = {
            nome: request.nome,
            data: request.data,
            crew: request.crew,
            descrizione: request.descrizione,
            user_nickname: request.publisher_nickname
        };

        const { error: insertError } = await supabase
            .from('flyer')
            .insert([flyerData]);

        if (insertError) throw insertError;

        const { error: updateError } = await supabase
            .from('flyer_requests')
            .update({
                status: 'approved',
                reviewed_by: currentUser.nickname,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (updateError) throw updateError;

        devLog('Richiesta approvata con successo!', 'success');
        alert('Richiesta approvata!');
        loadFlyers();
        loadFlyerRequests(currentUser.role);
    } catch (error) {
        devLog(`Errore approvazione: ${error.message}`, 'error');
        alert('Errore durante l\'approvazione: ' + error.message);
    }
}

window.rejectRequest = async function(requestId) {
    if (!confirm('Sei sicuro di voler rifiutare questa richiesta?')) return;

    devLog(`Rifiuto richiesta ${requestId}...`, 'info');

    try {
        const { error } = await supabase
            .from('flyer_requests')
            .update({
                status: 'rejected',
                reviewed_by: currentUser.nickname,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (error) throw error;

        devLog('Richiesta rifiutata', 'success');
        alert('Richiesta rifiutata');
        loadFlyerRequests(currentUser.role);
    } catch (error) {
        devLog(`Errore rifiuto: ${error.message}`, 'error');
        alert('Errore: ' + error.message);
    }
}

async function loadMyRequests() {
    devLog('Caricamento tue richieste...', 'info');

    try {
        const { data, error } = await supabase
            .from('flyer_requests')
            .select('*')
            .eq('publisher_nickname', currentUser.nickname)
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderMyRequests(data);
    } catch (error) {
        devLog(`Errore caricamento richieste: ${error.message}`, 'error');
    }
}

function renderMyRequests(requests) {
    const container = document.getElementById('myRequestsContainer');
    if (!container) return;

    if (!requests || requests.length === 0) {
        container.innerHTML = '<div class="no-flyer-message">Nessuna richiesta inviata</div>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'flyer-table';

    table.innerHTML = `
        <thead>
            <tr>
                <th>Nome</th>
                <th>Data</th>
                <th>Crew</th>
                <th>Stato</th>
                <th>Revisionata da</th>
            </tr>
        </thead>
        <tbody>
            ${requests.map(req => `
                <tr>
                    <td>${req.nome}</td>
                    <td>${new Date(req.data).toLocaleDateString('it-IT')}</td>
                    <td>${req.crew}</td>
                    <td><span class="request-status status-${req.status}">${req.status}</span></td>
                    <td>${req.reviewed_by || '-'}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    container.innerHTML = '';
    container.appendChild(table);
}

function displayFideltyStatus() {
    const statusElement = document.getElementById('publisherFideltyStatus');
    if (!statusElement) return;

    const fideltyMessages = {
        'friendly': 'Stato: Friendly - Puoi pubblicare flyer direttamente',
        'pending': 'Stato: Pending - Le tue richieste devono essere approvate',
        'restricted': 'Stato: Restricted - Non puoi pubblicare flyer'
    };

    statusElement.textContent = fideltyMessages[currentUser.fidelty] || 'Stato sconosciuto';
}

async function loadPublishers() {
    devLog('Caricamento publishers...', 'info');

    try {
        const { data, error } = await supabase
            .from('users')
            .select('nickname, fidelty, created_at')
            .eq('role', 'publisher')
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderPublishers(data);
    } catch (error) {
        devLog(`Errore caricamento publishers: ${error.message}`, 'error');
    }
}

function renderPublishers(publishers) {
    const container = document.getElementById('publishersContainer');
    if (!container) return;

    if (!publishers || publishers.length === 0) {
        container.innerHTML = '<div class="no-flyer-message">Nessun publisher registrato</div>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'flyer-table';

    table.innerHTML = `
        <thead>
            <tr>
                <th>Nickname</th>
                <th>Fidelty</th>
                <th>Registrato il</th>
                <th>Azioni</th>
            </tr>
        </thead>
        <tbody>
            ${publishers.map(pub => `
                <tr>
                    <td>${pub.nickname}</td>
                    <td><span class="request-status status-${pub.fidelty}">${pub.fidelty}</span></td>
                    <td>${new Date(pub.created_at).toLocaleDateString('it-IT')}</td>
                    <td>
                        <button class="manage-btn" onclick="openUserManagement('${pub.nickname}', '${pub.fidelty}')">Gestisci</button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;

    container.innerHTML = '';
    container.appendChild(table);
}

window.openUserManagement = function(nickname, currentFidelty) {
    document.getElementById('managedUserNickname').textContent = nickname;
    document.getElementById('managedUserFidelty').textContent = currentFidelty;
    document.getElementById('managedUserNicknameInput').value = nickname;
    document.getElementById('newFidelty').value = currentFidelty;
    userManagementModal.style.display = 'block';
    devLog(`Aperta gestione per ${nickname}`, 'info');
}

document.getElementById('userManagementForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nickname = document.getElementById('managedUserNicknameInput').value;
    const newFidelty = document.getElementById('newFidelty').value;

    devLog(`Aggiornamento fidelty per ${nickname} a ${newFidelty}...`, 'info');

    try {
        const { error } = await supabase
            .from('users')
            .update({ fidelty: newFidelty })
            .eq('nickname', nickname);

        if (error) throw error;

        devLog('Fidelty aggiornata con successo!', 'success');
        alert('Permessi aggiornati!');
        userManagementModal.style.display = 'none';
        loadPublishers();
    } catch (error) {
        devLog(`Errore aggiornamento: ${error.message}`, 'error');
        alert('Errore: ' + error.message);
    }
});

document.getElementById('showDbTablesBtn')?.addEventListener('click', async () => {
    devLog('=== STRUTTURA DATABASE ===', 'info');
    try {
        const tables = ['users', 'flyer', 'flyer_requests'];
        for (const table of tables) {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) throw error;
            devLog(`Tabella: ${table} - Record: ${count || 0}`, 'success');
        }
    } catch (error) {
        devLog(`Errore lettura DB: ${error.message}`, 'error');
    }
});

document.getElementById('testRlsBtn')?.addEventListener('click', async () => {
    devLog('=== TEST RLS POLICIES ===', 'info');
    try {
        const { data: flyerData, error: flyerError } = await supabase.from('flyer').select('*').limit(1);
        devLog(`Test SELECT flyer: ${flyerError ? 'FAIL - ' + flyerError.message : 'OK - ' + flyerData.length + ' record'}`, flyerError ? 'error' : 'success');

        const { data: userData, error: userError } = await supabase.from('users').select('nickname').limit(1);
        devLog(`Test SELECT users: ${userError ? 'FAIL - ' + userError.message : 'OK - ' + userData.length + ' record'}`, userError ? 'error' : 'success');

        const { data: reqData, error: reqError } = await supabase.from('flyer_requests').select('*').limit(1);
        devLog(`Test SELECT flyer_requests: ${reqError ? 'FAIL - ' + reqError.message : 'OK - ' + reqData.length + ' record'}`, reqError ? 'error' : 'success');
    } catch (error) {
        devLog(`Errore test RLS: ${error.message}`, 'error');
    }
});

document.getElementById('viewSessionBtn')?.addEventListener('click', () => {
    devLog('=== SESSIONE CORRENTE ===', 'info');
    if (currentUser) {
        devLog(`ID: ${currentUser.id}`, 'info');
        devLog(`Nickname: ${currentUser.nickname}`, 'info');
        devLog(`Ruolo: ${currentUser.role}`, 'info');
        devLog(`Fidelty: ${currentUser.fidelty || 'N/A'}`, 'info');
        devLog(`Creato: ${new Date(currentUser.created_at).toLocaleString('it-IT')}`, 'info');
    } else {
        devLog('Nessun utente loggato', 'error');
    }
});

document.getElementById('clearDbBtn')?.addEventListener('click', async () => {
    if (!confirm('ATTENZIONE: Vuoi eliminare TUTTI i flyer e le richieste? Questa azione è irreversibile!')) return;

    devLog('Pulizia database in corso...', 'info');
    try {
        const { error: flyerError } = await supabase.from('flyer').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (flyerError) throw flyerError;
        devLog('Tutti i flyer eliminati', 'success');

        const { error: reqError } = await supabase.from('flyer_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (reqError) throw reqError;
        devLog('Tutte le richieste eliminate', 'success');

        alert('Database pulito!');
        loadFlyers();
        if (currentUser?.role === 'developer') {
            loadFlyerRequests('developer');
        }
    } catch (error) {
        devLog(`Errore pulizia DB: ${error.message}`, 'error');
        alert('Errore durante la pulizia: ' + error.message);
    }
});

document.getElementById('exportDbBtn')?.addEventListener('click', async () => {
    devLog('Esportazione dati in corso...', 'info');
    try {
        const { data: users, error: usersError } = await supabase.from('users').select('nickname, role, fidelty, created_at');
        const { data: flyers, error: flyersError } = await supabase.from('flyer').select('*');
        const { data: requests, error: requestsError } = await supabase.from('flyer_requests').select('*');

        if (usersError || flyersError || requestsError) {
            throw new Error('Errore durante l\'esportazione');
        }

        const exportData = {
            exported_at: new Date().toISOString(),
            users: users,
            flyers: flyers,
            requests: requests
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `db_export_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);

        devLog(`Dati esportati: ${users.length} utenti, ${flyers.length} flyer, ${requests.length} richieste`, 'success');
        alert('Dati esportati con successo!');
    } catch (error) {
        devLog(`Errore esportazione: ${error.message}`, 'error');
        alert('Errore durante l\'esportazione: ' + error.message);
    }
});

let maps = {};
let currentView = {};

function setupViewSwitcher(role) {
    const btnId = `${role}ViewSwitchBtn`;
    const flyerViewId = `${role}FlyerView`;
    const mapViewId = `${role}MapView`;
    const mapId = `${role}Map`;

    currentView[role] = 'flyer';

    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.addEventListener('click', () => {
        const flyerView = document.getElementById(flyerViewId);
        const mapView = document.getElementById(mapViewId);

        if (currentView[role] === 'flyer') {
            flyerView.style.display = 'none';
            mapView.style.display = 'block';
            btn.textContent = 'Flyer';
            currentView[role] = 'map';

            if (!maps[role]) {
                initMap(role, mapId);
            } else {
                maps[role].invalidateSize();
            }

            document.getElementById('mapSearchBar').style.display = 'block';
        } else {
            flyerView.style.display = 'block';
            mapView.style.display = 'none';
            btn.textContent = 'Mappa';
            currentView[role] = 'flyer';
            document.getElementById('mapSearchBar').style.display = 'none';
        }
    });
}

function initMap(role, mapId) {
    devLog(`Inizializzazione mappa per ${role}...`, 'info');

    const northItalyBounds = [
        [43.5, 6.5],
        [47.0, 13.5]
    ];

    const map = L.map(mapId, {
        center: [45.7440, 8.7396],
        zoom: 9,
        maxBounds: northItalyBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 8,
        maxZoom: 18
    });

    const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    });

    const osmCycle = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors, CyclOSM',
        maxZoom: 19
    });

    const osmHumanitarian = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors, Humanitarian',
        maxZoom: 19
    });

    const baseMaps = {
        "Standard": osmStandard,
        "Cycle Map": osmCycle,
        "Humanitarian": osmHumanitarian
    };

    osmStandard.addTo(map);
    L.control.layers(baseMaps).addTo(map);

    maps[role] = map;

    devLog('Mappa inizializzata con successo', 'success');
}

setupViewSwitcher('user');
setupViewSwitcher('admin');
setupViewSwitcher('developer');
setupViewSwitcher('publisher');

makeDraggable(document.getElementById('devConsole'));
makeDraggable(document.getElementById('mapSearchBar'));

function makeDraggable(element) {
    if (!element) return;

    const header = element.querySelector('.draggable-header');
    if (!header) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + 'px';
        element.style.left = (element.offsetLeft - pos1) + 'px';
        element.style.bottom = 'auto';
        element.style.right = 'auto';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

document.getElementById('toggleDevConsole')?.addEventListener('click', () => {
    const devConsole = document.getElementById('devConsole');
    const toggleBtn = document.getElementById('toggleDevConsole');

    if (devConsole.classList.contains('collapsed')) {
        devConsole.classList.remove('collapsed');
        toggleBtn.textContent = '−';
    } else {
        devConsole.classList.add('collapsed');
        toggleBtn.textContent = '+';
    }
});

document.getElementById('toggleSearchBar')?.addEventListener('click', () => {
    const searchBar = document.getElementById('mapSearchBar');
    const toggleBtn = document.getElementById('toggleSearchBar');

    if (searchBar.classList.contains('collapsed')) {
        searchBar.classList.remove('collapsed');
        toggleBtn.textContent = '−';
    } else {
        searchBar.classList.add('collapsed');
        toggleBtn.textContent = '+';
    }
});

document.getElementById('mapSearchBtn')?.addEventListener('click', async () => {
    const query = document.getElementById('mapSearchInput').value;
    if (!query) return;

    devLog(`Ricerca località: ${query}`, 'info');

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=it&limit=5`);
        const data = await response.json();

        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = '';

        if (data.length === 0) {
            resultsDiv.innerHTML = '<div style="padding: 8px; color: #888;">Nessun risultato trovato</div>';
            return;
        }

        data.forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.textContent = result.display_name;
            item.onclick = () => {
                const currentRole = currentUser?.role || 'user';
                if (maps[currentRole]) {
                    maps[currentRole].setView([result.lat, result.lon], 13);
                    L.marker([result.lat, result.lon]).addTo(maps[currentRole])
                        .bindPopup(result.display_name)
                        .openPopup();
                }
            };
            resultsDiv.appendChild(item);
        });

        devLog(`${data.length} risultati trovati`, 'success');
    } catch (error) {
        devLog(`Errore ricerca: ${error.message}`, 'error');
    }
});

document.getElementById('mapSearchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('mapSearchBtn').click();
    }
});
