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

loadFlyers();

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
    const role = document.getElementById('registerRole').value;

    devLog(`Tentativo di registrazione per: ${nickname} con ruolo: ${role}`, 'info');
    devLog(`Campo nickname: ${nickname ? 'compilato' : 'vuoto'}`, nickname ? 'success' : 'error');
    devLog(`Campo password: ${password ? 'compilato' : 'vuoto'}`, password ? 'success' : 'error');
    devLog(`Ruolo selezionato: ${role}`, 'info');

    try {
        devLog('Invio richiesta di registrazione a Supabase...', 'info');
        const { data, error } = await supabase
            .rpc('register_user', {
                p_nickname: nickname,
                p_password: password,
                p_role: role
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
document.getElementById('developerLogoutBtn').addEventListener('click', logout);
document.getElementById('publisherLogoutBtn').addEventListener('click', logout);

function showDashboard(role) {
    devLog(`Mostrando dashboard per ruolo: ${role}`, 'info');
    authSection.style.display = 'none';
    userSection.style.display = 'none';
    adminSection.style.display = 'none';
    developerSection.style.display = 'none';
    publisherSection.style.display = 'none';

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
    authSection.style.display = 'block';
    userSection.style.display = 'none';
    adminSection.style.display = 'none';
    developerSection.style.display = 'none';
    publisherSection.style.display = 'none';
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
