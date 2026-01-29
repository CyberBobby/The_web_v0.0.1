import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { initLocationPicker, clearLocationSelection, setLocationSelection } from './location-picker.js';

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

async function logSessionAction(actionType, actionDetails = {}) {
    if (!currentUser || currentUser.role === 'user') return;

    try {
        await supabase
            .from('session_logs')
            .insert([{
                user_nickname: currentUser.nickname,
                user_role: currentUser.role,
                action_type: actionType,
                action_details: actionDetails
            }]);
    } catch (error) {
        console.error('Errore logging:', error);
    }
}

async function resizeImage(file, maxWidth = 800, maxHeight = 600) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.85);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function uploadImage(file) {
    try {
        devLog('Ridimensionamento immagine...', 'info');
        const resizedBlob = await resizeImage(file);

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = fileName;

        devLog(`Upload immagine: ${fileName}...`, 'info');

        const { data, error } = await supabase.storage
            .from('flyer-images')
            .upload(filePath, resizedBlob, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
            .from('flyer-images')
            .getPublicUrl(filePath);

        devLog('Immagine caricata con successo!', 'success');
        return publicUrlData.publicUrl;
    } catch (error) {
        devLog(`Errore upload immagine: ${error.message}`, 'error');
        throw error;
    }
}

async function deleteImage(imageUrl) {
    if (!imageUrl) return;

    try {
        const urlParts = imageUrl.split('/flyer-images/');
        if (urlParts.length < 2) return;

        const filePath = urlParts[1];

        devLog(`Eliminazione immagine: ${filePath}...`, 'info');

        const { error } = await supabase.storage
            .from('flyer-images')
            .remove([filePath]);

        if (error) throw error;

        devLog('Immagine eliminata con successo!', 'success');
    } catch (error) {
        devLog(`Errore eliminazione immagine: ${error.message}`, 'error');
    }
}

document.getElementById('devConsole').style.display = 'none';

document.getElementById('clearDevConsole')?.addEventListener('click', () => {
    document.getElementById('devConsoleContent').innerHTML = '';
    devLog('Console pulita', 'info');
});

let currentUser = null;
let currentEditingFlyer = null;
let allFlyers = [];
let filteredFlyers = {};

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

devLog('App inizializzata', 'success');
devLog('Connessione a Supabase stabilita', 'success');

devLog('Controllo sessione salvata...', 'info');
const savedUser = localStorage.getItem('currentUser');
devLog(`localStorage.getItem('currentUser'): ${savedUser ? 'TROVATO' : 'NON TROVATO'}`, savedUser ? 'success' : 'warning');

if (savedUser) {
    try {
        currentUser = JSON.parse(savedUser);
        devLog(`Utente ripristinato: ${currentUser.nickname} (${currentUser.role})`, 'success');
        devLog('Chiamo showDashboard()...', 'info');
        showDashboard(currentUser.role);
    } catch (error) {
        devLog(`Errore ripristino sessione: ${error.message}`, 'error');
        localStorage.removeItem('currentUser');
        currentUser = null;
    }
}

if (!currentUser) {
    devLog('Nessun utente salvato, carico flyer pubblici', 'info');
    loadFlyers();
}

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

        if (modalId === 'flyerModal') {
            clearLocationSelection();
        }
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';

        if (e.target.id === 'flyerModal') {
            clearLocationSelection();
        }
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

            await logSessionAction('login', {
                timestamp: new Date().toISOString()
            });

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
        loadPublishers();
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

async function logout() {
    devLog(`Logout eseguito per utente: ${currentUser?.nickname || 'sconosciuto'}`, 'info');

    await logSessionAction('logout', {
        timestamp: new Date().toISOString()
    });

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

        const filteredData = await filterFlyersByVisibility(data);

        allFlyers = filteredData;

        populateCrewFilters();

        renderFlyers(filteredData, 'flyerContainer', false);
        renderFlyers(filteredData, 'flyerContainerUser', false);
        renderFlyers(filteredData, 'flyerContainerAdmin', true);
        renderFlyers(filteredData, 'flyerContainerDeveloper', true);
        renderFlyers(filteredData, 'flyerContainerPublisher', currentUser?.role === 'publisher');

        reloadMapMarkers();
    } catch (error) {
        devLog(`Errore durante il caricamento dei flyer: ${error.message}`, 'error');
        console.error('Errore caricamento flyer:', error);
    }
}

async function filterFlyersByVisibility(flyers) {
    if (!currentUser) {
        return flyers.filter(f => f.visibility_type === 'all');
    }

    if (currentUser.role === 'admin' || currentUser.role === 'developer') {
        return flyers;
    }

    try {
        const { data: devList } = await supabase
            .from('developer_list')
            .select('user_id')
            .eq('user_id', currentUser.id)
            .maybeSingle();

        const isInDevList = !!devList;

        let publisherLists = [];
        if (currentUser.role === 'publisher') {
            const { data: pubLists } = await supabase
                .from('publisher_lists')
                .select('publisher_id')
                .eq('allowed_user_id', currentUser.id);

            publisherLists = pubLists ? pubLists.map(p => p.publisher_id) : [];
        } else {
            const { data: pubLists } = await supabase
                .from('publisher_lists')
                .select('publisher_id')
                .eq('allowed_user_id', currentUser.id);

            publisherLists = pubLists ? pubLists.map(p => p.publisher_id) : [];
        }

        return flyers.filter(f => {
            if (f.visibility_type === 'all') return true;

            if (f.visibility_type === 'developer_list') {
                return isInDevList;
            }

            if (f.visibility_type === 'publisher_list') {
                return publisherLists.includes(f.created_by_id);
            }

            return false;
        });
    } catch (error) {
        devLog(`Errore filtraggio visibilità: ${error.message}`, 'error');
        return flyers.filter(f => f.visibility_type === 'all');
    }
}

function populateCrewFilters() {
    const crews = [...new Set(allFlyers.map(f => f.crew))].sort();

    const roles = ['Auth', 'User', 'Admin', 'Developer', 'Publisher'];

    roles.forEach(role => {
        const select = document.getElementById(`filterCrew${role}`);
        if (select) {
            select.innerHTML = '<option value="">Tutte le crew</option>';
            crews.forEach(crew => {
                const option = document.createElement('option');
                option.value = crew;
                option.textContent = crew;
                select.appendChild(option);
            });
        }
    });

    devLog(`Popolati filtri crew con ${crews.length} crew uniche`, 'success');
}

function reloadMapMarkers() {
    Object.keys(maps).forEach(role => {
        const map = maps[role];
        if (map) {
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });
            loadFlyersOnMap(map, role);
        }
    });
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
                <th style="width: 120px;">Immagine</th>
                <th>Nome</th>
                <th>Data</th>
                <th>Crew</th>
                <th>Descrizione</th>
                <th>Posizione</th>
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

                const imageCell = flyer.image_url
                    ? `<td><img src="${flyer.image_url}" alt="${flyer.nome}" style="width: 100px; height: 75px; object-fit: cover; border-radius: 4px; display: block;"></td>`
                    : `<td><div style="width: 100px; height: 75px; background: #e9ecef; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #6c757d; font-size: 12px;">No img</div></td>`;

                const locationDisplay = flyer.show_location !== false && flyer.address
                    ? flyer.address.substring(0, 50) + (flyer.address.length > 50 ? '...' : '')
                    : (flyer.show_location === false ? 'Privata' : '—');

                return `
                    <tr data-flyer-id="${flyer.id}" class="flyer-row">
                        ${imageCell}
                        <td>${flyer.nome}</td>
                        <td>${new Date(flyer.data).toLocaleDateString('it-IT')}</td>
                        <td>${flyer.crew}</td>
                        <td>${flyer.descrizione}</td>
                        <td>${locationDisplay}</td>
                        <td>${flyer.user_nickname}</td>
                        ${actionsCell}
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;

    container.innerHTML = '';
    container.appendChild(table);

    table.querySelectorAll('.flyer-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                const flyerId = row.getAttribute('data-flyer-id');
                openFlyerDetailModal(flyerId);
            }
        });
    });

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
        clearLocationSelection();
        clearImagePreview();
    }

    const visibilitySelect = document.getElementById('flyerVisibilityType');
    const publisherListOption = visibilitySelect.querySelector('option[value="publisher_list"]');

    if (currentUser?.role === 'publisher') {
        if (publisherListOption) publisherListOption.style.display = 'block';
    } else {
        if (publisherListOption) publisherListOption.style.display = 'none';
        if (visibilitySelect.value === 'publisher_list') {
            visibilitySelect.value = 'all';
        }
    }

    initLocationPicker();
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

            if (data.latitude && data.longitude) {
                setLocationSelection(
                    parseFloat(data.latitude),
                    parseFloat(data.longitude),
                    data.address || ''
                );
            }

            if (data.image_url) {
                document.getElementById('flyerImageUrl').value = data.image_url;
                document.getElementById('imagePreview').src = data.image_url;
                document.getElementById('imagePreviewContainer').style.display = 'block';
            } else {
                clearImagePreview();
            }

            document.getElementById('flyerVisibilityType').value = data.visibility_type || 'all';
            document.getElementById('flyerShowLocation').checked = data.show_location !== false;
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
    const latitude = document.getElementById('flyerLatitude').value;
    const longitude = document.getElementById('flyerLongitude').value;
    const address = document.getElementById('flyerAddress').value;
    const imageFile = document.getElementById('flyerImage').files[0];
    const existingImageUrl = document.getElementById('flyerImageUrl').value;

    try {
        let imageUrl = existingImageUrl;

        if (imageFile) {
            imageUrl = await uploadImage(imageFile);

            if (existingImageUrl && existingImageUrl !== imageUrl) {
                await deleteImage(existingImageUrl);
            }
        }

        const visibilityType = document.getElementById('flyerVisibilityType').value;
        const showLocation = document.getElementById('flyerShowLocation').checked;

        const flyerData = {
            nome,
            data,
            crew,
            descrizione,
            user_nickname: currentUser.nickname,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            address: address || null,
            image_url: imageUrl || null,
            visibility_type: visibilityType,
            show_location: showLocation,
            created_by_id: currentUser.id
        };

        if (currentUser.role === 'publisher' && currentUser.fidelty !== 'friendly') {
            await createFlyerRequest(flyerData);
        } else if (flyerId) {
            await updateFlyer(flyerId, flyerData);
        } else {
            await createFlyer(flyerData);
        }

        flyerModal.style.display = 'none';
        document.getElementById('flyerForm').reset();
        clearLocationSelection();
        clearImagePreview();
    } catch (error) {
        devLog(`Errore: ${error.message}`, 'error');
        alert('Errore: ' + error.message);
    }
});

document.getElementById('flyerImage')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        alert('Formato non supportato. Usa JPEG, PNG o WebP.');
        e.target.value = '';
        return;
    }

    if (file.size > 5242880) {
        alert('Il file è troppo grande. Dimensione massima: 5MB.');
        e.target.value = '';
        return;
    }

    try {
        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.getElementById('imagePreview');
            const container = document.getElementById('imagePreviewContainer');
            preview.src = event.target.result;
            container.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } catch (error) {
        devLog(`Errore preview immagine: ${error.message}`, 'error');
    }
});

document.getElementById('removeImageBtn')?.addEventListener('click', () => {
    clearImagePreview();
});

function clearImagePreview() {
    document.getElementById('flyerImage').value = '';
    document.getElementById('flyerImageUrl').value = '';
    document.getElementById('imagePreview').src = '';
    document.getElementById('imagePreviewContainer').style.display = 'none';
}

async function createFlyer(flyerData) {
    devLog('Creazione nuovo flyer...', 'info');

    const { data, error } = await supabase
        .from('flyer')
        .insert([flyerData])
        .select();

    if (error) throw error;

    await logSessionAction('create_flyer', {
        flyer_name: flyerData.nome,
        flyer_date: flyerData.data,
        crew: flyerData.crew
    });

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

    await logSessionAction('edit_flyer', {
        flyer_id: flyerId,
        flyer_name: flyerData.nome,
        flyer_date: flyerData.data,
        crew: flyerData.crew
    });

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
        latitude: flyerData.latitude,
        longitude: flyerData.longitude,
        address: flyerData.address,
        image_url: flyerData.image_url || null,
        status: 'pending'
    };

    const { data, error } = await supabase
        .from('flyer_requests')
        .insert([requestData])
        .select();

    if (error) throw error;

    await logSessionAction('create_flyer_request', {
        flyer_name: flyerData.nome,
        flyer_date: flyerData.data,
        crew: flyerData.crew
    });

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
        const { data: flyer } = await supabase
            .from('flyer')
            .select('nome, data, crew, image_url')
            .eq('id', flyerId)
            .maybeSingle();

        if (flyer?.image_url) {
            await deleteImage(flyer.image_url);
        }

        const { error } = await supabase
            .from('flyer')
            .delete()
            .eq('id', flyerId);

        if (error) throw error;

        await logSessionAction('delete_flyer', {
            flyer_id: flyerId,
            flyer_name: flyer?.nome,
            flyer_date: flyer?.data,
            crew: flyer?.crew
        });

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
                <th>Posizione</th>
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
                    <td>${req.address ? req.address.substring(0, 50) + (req.address.length > 50 ? '...' : '') : '—'}</td>
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
            user_nickname: request.publisher_nickname,
            latitude: request.latitude,
            longitude: request.longitude,
            address: request.address,
            image_url: request.image_url || null
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

        await logSessionAction('approve_request', {
            request_id: requestId,
            flyer_name: request.nome,
            publisher: request.publisher_nickname
        });

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
        const { data: request } = await supabase
            .from('flyer_requests')
            .select('nome, publisher_nickname')
            .eq('id', requestId)
            .maybeSingle();

        const { error } = await supabase
            .from('flyer_requests')
            .update({
                status: 'rejected',
                reviewed_by: currentUser.nickname,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (error) throw error;

        await logSessionAction('reject_request', {
            request_id: requestId,
            flyer_name: request?.nome,
            publisher: request?.publisher_nickname
        });

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
                <th>Posizione</th>
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
                    <td>${req.address ? req.address.substring(0, 50) + (req.address.length > 50 ? '...' : '') : '—'}</td>
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

        renderPublishers(data, 'publishersContainer');
        renderPublishers(data, 'publishersContainerAdmin');
    } catch (error) {
        devLog(`Errore caricamento publishers: ${error.message}`, 'error');
    }
}

function renderPublishers(publishers, containerId) {
    const container = document.getElementById(containerId);
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
        const { data, error } = await supabase
            .rpc('update_user_fidelty', {
                p_target_nickname: nickname,
                p_new_fidelty: newFidelty
            });

        if (error) throw error;

        await logSessionAction('manage_user', {
            managed_user: nickname,
            new_fidelty: newFidelty,
            action: 'update_fidelty'
        });

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
        const tables = ['users', 'flyer', 'flyer_requests', 'session_logs'];
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

        const { data: logData, error: logError } = await supabase.from('session_logs').select('*').limit(1);
        devLog(`Test SELECT session_logs: ${logError ? 'FAIL - ' + logError.message : 'OK - ' + logData.length + ' record'}`, logError ? 'error' : 'success');
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

document.getElementById('viewSessionLogsBtn')?.addEventListener('click', async () => {
    devLog('=== SESSION LOGS ===', 'info');
    try {
        const { data, error } = await supabase
            .from('session_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            devLog('Nessun log trovato', 'info');
            return;
        }

        devLog(`Trovati ${data.length} log (ultimi 50):`, 'success');
        devLog('---', 'info');

        data.forEach((log, index) => {
            const timestamp = new Date(log.created_at).toLocaleString('it-IT');
            const details = JSON.stringify(log.action_details);
            devLog(`[${index + 1}] ${timestamp}`, 'info');
            devLog(`    User: ${log.user_nickname} (${log.user_role})`, 'info');
            devLog(`    Action: ${log.action_type}`, 'success');
            devLog(`    Details: ${details}`, 'info');
            devLog('---', 'info');
        });

        devLog('Fine logs', 'success');
    } catch (error) {
        devLog(`Errore lettura logs: ${error.message}`, 'error');
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

document.getElementById('cleanupOldLogsBtn')?.addEventListener('click', async () => {
    devLog('Pulizia log vecchi in corso...', 'info');
    try {
        const { data: beforeCount } = await supabase
            .from('session_logs')
            .select('*', { count: 'exact', head: true });

        const { data, error } = await supabase.rpc('cleanup_old_session_logs');

        if (error) throw error;

        const { data: afterCount } = await supabase
            .from('session_logs')
            .select('*', { count: 'exact', head: true });

        const deleted = (beforeCount?.length || 0) - (afterCount?.length || 0);
        devLog(`Pulizia completata: ${deleted} log eliminati (più vecchi di 14 giorni)`, 'success');
        alert(`${deleted} log vecchi eliminati!`);
    } catch (error) {
        devLog(`Errore pulizia log: ${error.message}`, 'error');
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

document.getElementById('loadSessionLogsBtn')?.addEventListener('click', async () => {
    await loadSessionLogs('sessionLogsContainer', 'logFilterRole', 'logFilterAction', 'logLimit');
});

document.getElementById('loadSessionLogsAdminBtn')?.addEventListener('click', async () => {
    await loadSessionLogs('sessionLogsContainerAdmin', 'logFilterRoleAdmin', 'logFilterActionAdmin', 'logLimitAdmin');
});

async function loadSessionLogs(containerId, roleFilterId, actionFilterId, limitId) {
    devLog('Caricamento session logs...', 'info');

    const roleFilter = document.getElementById(roleFilterId)?.value || '';
    const actionFilter = document.getElementById(actionFilterId)?.value || '';
    const limit = parseInt(document.getElementById(limitId)?.value) || 50;

    try {
        let query = supabase
            .from('session_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(Math.min(limit, 500));

        if (roleFilter) {
            query = query.eq('user_role', roleFilter);
        }

        if (actionFilter) {
            query = query.eq('action_type', actionFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        renderSessionLogs(data || [], containerId);
        devLog(`Log caricati: ${data?.length || 0} record`, 'success');
    } catch (error) {
        devLog(`Errore caricamento log: ${error.message}`, 'error');
        alert('Errore durante il caricamento dei log: ' + error.message);
    }
}

function renderSessionLogs(logs, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="no-flyer-message">Nessun log trovato con i filtri selezionati</div>';
        return;
    }

    const actionLabels = {
        'login': 'Login',
        'logout': 'Logout',
        'create_flyer': 'Creazione Flyer',
        'edit_flyer': 'Modifica Flyer',
        'delete_flyer': 'Eliminazione Flyer',
        'approve_request': 'Approva Richiesta',
        'reject_request': 'Rifiuta Richiesta',
        'manage_user': 'Gestione Utente'
    };

    const table = document.createElement('table');
    table.className = 'flyer-table';

    table.innerHTML = `
        <thead>
            <tr>
                <th>Data/Ora</th>
                <th>Utente</th>
                <th>Ruolo</th>
                <th>Azione</th>
                <th>Dettagli</th>
            </tr>
        </thead>
        <tbody>
            ${logs.map(log => {
                const timestamp = new Date(log.created_at).toLocaleString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                const actionLabel = actionLabels[log.action_type] || log.action_type;
                const details = formatLogDetails(log.action_type, log.action_details);

                return `
                    <tr>
                        <td data-label="Data/Ora">${timestamp}</td>
                        <td data-label="Utente">${log.user_nickname}</td>
                        <td data-label="Ruolo"><span class="request-status status-${log.user_role}">${log.user_role}</span></td>
                        <td data-label="Azione">${actionLabel}</td>
                        <td data-label="Dettagli">${details}</td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;

    container.innerHTML = '';
    container.appendChild(table);
}

function formatLogDetails(actionType, details) {
    if (!details || Object.keys(details).length === 0) return '-';

    switch (actionType) {
        case 'login':
        case 'logout':
            return details.timestamp ? new Date(details.timestamp).toLocaleTimeString('it-IT') : '-';

        case 'create_flyer':
        case 'edit_flyer':
            return details.flyer_name ? `Flyer: ${details.flyer_name}` : '-';

        case 'delete_flyer':
            return details.flyer_id ? `ID: ${details.flyer_id.substring(0, 8)}...` : '-';

        case 'approve_request':
        case 'reject_request':
            return details.request_id ? `Richiesta: ${details.request_id.substring(0, 8)}...` : '-';

        case 'manage_user':
            if (details.managed_user && details.new_fidelty) {
                return `${details.managed_user} → ${details.new_fidelty}`;
            }
            return JSON.stringify(details);

        default:
            return JSON.stringify(details);
    }
}

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

            const searchBar = document.getElementById('mapSearchBar');
            searchBar.style.display = 'block';
            mapView.appendChild(searchBar);
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

    const transportLayer = L.tileLayer('https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors, Map: MeMoMaps',
        maxZoom: 18,
        opacity: 0.7
    });

    const baseMaps = {
        "Standard": osmStandard,
        "Cycle Map": osmCycle,
        "Humanitarian": osmHumanitarian
    };

    const overlayMaps = {
        "Trasporti Pubblici": transportLayer
    };

    osmStandard.addTo(map);
    L.control.layers(baseMaps, overlayMaps).addTo(map);

    maps[role] = map;

    loadFlyersOnMap(map, role);

    devLog('Mappa inizializzata con successo', 'success');
}

async function loadFlyersOnMap(map, role) {
    try {
        const { data: flyers, error } = await supabase
            .from('flyer')
            .select('*')
            .order('data', { ascending: false });

        if (error) throw error;

        if (!flyers || flyers.length === 0) {
            devLog('Nessun flyer con posizione da visualizzare sulla mappa', 'info');
            return;
        }

        const filteredFlyers = await filterFlyersByVisibility(flyers);

        const visibleFlyers = filteredFlyers.filter(f =>
            f.latitude &&
            f.longitude &&
            f.show_location !== false
        );

        if (visibleFlyers.length === 0) {
            devLog('Nessun flyer con posizione visibile da visualizzare sulla mappa', 'info');
            return;
        }

        const flyerIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        visibleFlyers.forEach(flyer => {
            const marker = L.marker([flyer.latitude, flyer.longitude], { icon: flyerIcon })
                .addTo(map);

            marker.on('click', () => {
                openFlyerDetailModal(flyer.id);
            });

            const addressInfo = flyer.address ? `<p style="margin: 4px 0;"><strong>Luogo:</strong> ${flyer.address}</p>` : '';

            const popupContent = `
                <div style="font-family: Arial, sans-serif; cursor: pointer;">
                    <h3 style="margin: 0 0 8px 0; color: #333;">${flyer.nome}</h3>
                    <p style="margin: 4px 0;"><strong>Data:</strong> ${new Date(flyer.data).toLocaleDateString('it-IT')}</p>
                    <p style="margin: 4px 0;"><strong>Crew:</strong> ${flyer.crew}</p>
                    ${addressInfo}
                    <p style="margin: 4px 0; font-size: 12px; color: #888;">Clicca per vedere i dettagli</p>
                </div>
            `;

            marker.bindPopup(popupContent);
        });

        devLog(`${visibleFlyers.length} flyer caricati sulla mappa`, 'success');
    } catch (error) {
        devLog(`Errore caricamento flyer sulla mappa: ${error.message}`, 'error');
    }
}

setupViewSwitcher('user');
setupViewSwitcher('admin');
setupViewSwitcher('developer');
setupViewSwitcher('publisher');

makeDraggable(document.getElementById('devConsole'));

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

function openFlyerDetailModal(flyerId) {
    const flyer = allFlyers.find(f => f.id === flyerId);
    if (!flyer) return;

    const modal = document.getElementById('flyerDetailModal');
    const imageEl = document.getElementById('flyerDetailImage');
    const nomeEl = document.getElementById('flyerDetailNome');
    const dataEl = document.getElementById('flyerDetailData');
    const crewEl = document.getElementById('flyerDetailCrew');
    const descrizioneEl = document.getElementById('flyerDetailDescrizione');
    const addressEl = document.getElementById('flyerDetailAddress');
    const userEl = document.getElementById('flyerDetailUser');

    if (flyer.image_url) {
        imageEl.style.backgroundImage = `url(${flyer.image_url})`;
        imageEl.textContent = '';
    } else {
        imageEl.style.backgroundImage = '';
        imageEl.textContent = 'Nessuna immagine';
    }

    nomeEl.textContent = flyer.nome;
    dataEl.textContent = new Date(flyer.data).toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    crewEl.textContent = flyer.crew;
    descrizioneEl.textContent = flyer.descrizione;

    if (flyer.show_location !== false) {
        addressEl.textContent = flyer.address || '—';
    } else {
        addressEl.textContent = 'Posizione privata';
    }

    userEl.textContent = flyer.user_nickname;

    modal.style.display = 'block';
    devLog(`Aperto dettaglio flyer: ${flyer.nome}`, 'info');
}

function setupFilters(role, containerId) {
    const applyBtn = document.getElementById(`applyFilters${role}`);
    const resetBtn = document.getElementById(`resetFilters${role}`);
    const dateTypeSelect = document.getElementById(`filterTypeDate${role}`);
    const dateInput = document.getElementById(`filterDate${role}`);
    const crewSelect = document.getElementById(`filterCrew${role}`);

    if (!applyBtn || !resetBtn) {
        devLog(`Filtri per ${role} non trovati`, 'warning');
        return;
    }

    applyBtn.addEventListener('click', () => {
        const dateType = dateTypeSelect?.value || 'exact';
        const dateFilter = dateInput?.value || '';
        const crewFilter = crewSelect?.value || '';

        devLog(`Applicazione filtri per ${role}: dateType=${dateType}, date=${dateFilter}, crew=${crewFilter}`, 'info');

        let filtered = [...allFlyers];

        if (dateFilter) {
            filtered = filtered.filter(f => {
                if (dateType === 'exact') {
                    return f.data === dateFilter;
                } else if (dateType === 'from') {
                    return f.data >= dateFilter;
                } else if (dateType === 'until') {
                    return f.data <= dateFilter;
                }
                return true;
            });
        }

        if (crewFilter) {
            filtered = filtered.filter(f => f.crew === crewFilter);
        }

        filteredFlyers[role] = filtered;

        const isAdmin = role === 'Admin' || role === 'Developer';
        const isPublisher = role === 'Publisher' && currentUser?.role === 'publisher';
        renderFlyers(filtered, containerId, isAdmin || isPublisher);

        devLog(`Filtri applicati per ${role}: ${filtered.length} flyer trovati su ${allFlyers.length}`, 'success');
    });

    resetBtn.addEventListener('click', () => {
        if (dateTypeSelect) dateTypeSelect.value = 'exact';
        if (dateInput) dateInput.value = '';
        if (crewSelect) crewSelect.value = '';
        filteredFlyers[role] = [];

        const isAdmin = role === 'Admin' || role === 'Developer';
        const isPublisher = role === 'Publisher' && currentUser?.role === 'publisher';
        renderFlyers(allFlyers, containerId, isAdmin || isPublisher);

        devLog(`Filtri resettati per ${role}`, 'info');
    });

    devLog(`Filtri configurati per ${role}`, 'success');
}

setupFilters('Auth', 'flyerContainer');
setupFilters('User', 'flyerContainerUser');
setupFilters('Admin', 'flyerContainerAdmin');
setupFilters('Developer', 'flyerContainerDeveloper');
setupFilters('Publisher', 'flyerContainerPublisher');

async function loadDeveloperList() {
    if (currentUser?.role !== 'developer' && currentUser?.role !== 'admin') return;

    try {
        const { data, error } = await supabase
            .from('developer_list')
            .select('*')
            .order('user_nickname', { ascending: true });

        if (error) throw error;

        const container = document.getElementById('developerListContainer');
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color: #666;">Nessun utente nella lista.</p>';
            return;
        }

        container.innerHTML = data.map(item => `
            <div class="user-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
                <span>${item.user_nickname}</span>
                <button onclick="removeFromDeveloperList('${item.id}')" class="delete-btn" style="padding: 5px 10px;">Rimuovi</button>
            </div>
        `).join('');

        devLog(`Caricati ${data.length} utenti nella lista standard`, 'success');
    } catch (error) {
        devLog(`Errore caricamento lista developer: ${error.message}`, 'error');
    }
}

async function removeFromDeveloperList(itemId) {
    if (!confirm('Rimuovere questo utente dalla lista?')) return;

    try {
        const { error } = await supabase
            .from('developer_list')
            .delete()
            .eq('id', itemId);

        if (error) throw error;

        devLog('Utente rimosso dalla lista standard', 'success');
        loadDeveloperList();
    } catch (error) {
        devLog(`Errore rimozione: ${error.message}`, 'error');
        alert('Errore durante la rimozione: ' + error.message);
    }
}

async function searchUsersForDeveloperList(query) {
    if (!query || query.length < 2) return [];

    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, nickname')
            .ilike('nickname', `%${query}%`)
            .limit(10);

        if (error) throw error;

        const { data: existing } = await supabase
            .from('developer_list')
            .select('user_id');

        const existingIds = existing ? existing.map(e => e.user_id) : [];

        return (data || []).filter(u => !existingIds.includes(u.id));
    } catch (error) {
        devLog(`Errore ricerca utenti: ${error.message}`, 'error');
        return [];
    }
}

async function addToDeveloperList(userId, nickname) {
    try {
        const { error } = await supabase
            .from('developer_list')
            .insert({
                user_id: userId,
                user_nickname: nickname,
                added_by: currentUser.id
            });

        if (error) throw error;

        devLog(`${nickname} aggiunto alla lista standard`, 'success');
        loadDeveloperList();
        document.getElementById('developerListSearch').value = '';
        document.getElementById('developerListSearchResults').style.display = 'none';
    } catch (error) {
        devLog(`Errore aggiunta utente: ${error.message}`, 'error');
        alert('Errore durante l\'aggiunta: ' + error.message);
    }
}

const developerListSearch = document.getElementById('developerListSearch');
if (developerListSearch) {
    developerListSearch.addEventListener('input', async (e) => {
        const query = e.target.value;
        const resultsContainer = document.getElementById('developerListSearchResults');

        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }

        const users = await searchUsersForDeveloperList(query);

        if (users.length === 0) {
            resultsContainer.innerHTML = '<p style="padding: 10px; color: #666;">Nessun utente trovato</p>';
            resultsContainer.style.display = 'block';
            return;
        }

        resultsContainer.innerHTML = users.map(u => `
            <div onclick="addToDeveloperList('${u.id}', '${u.nickname}')" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; hover: background-color: #f5f5f5;">
                ${u.nickname}
            </div>
        `).join('');
        resultsContainer.style.display = 'block';
    });
}

async function loadPublisherList() {
    if (currentUser?.role !== 'publisher') return;

    try {
        const { data, error } = await supabase
            .from('publisher_lists')
            .select('*')
            .eq('publisher_id', currentUser.id)
            .order('allowed_user_nickname', { ascending: true });

        if (error) throw error;

        const container = document.getElementById('publisherListContainer');
        if (!container) return;

        let html = '<p style="margin-bottom: 10px; padding: 10px; background-color: #e8f5e9; border-radius: 4px; color: #2e7d32;">✓ Admin e Developer hanno sempre accesso</p>';

        if (!data || data.length === 0) {
            html += '<p style="color: #666;">Nessun altro utente nella tua lista.</p>';
        } else {
            html += data.map(item => `
                <div class="user-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
                    <span>${item.allowed_user_nickname}</span>
                    <button onclick="removeFromPublisherList('${item.id}')" class="delete-btn" style="padding: 5px 10px;">Rimuovi</button>
                </div>
            `).join('');
        }

        container.innerHTML = html;

        devLog(`Caricati ${data.length} utenti nella tua lista`, 'success');
    } catch (error) {
        devLog(`Errore caricamento lista publisher: ${error.message}`, 'error');
    }
}

async function removeFromPublisherList(itemId) {
    if (!confirm('Rimuovere questo utente dalla tua lista?')) return;

    try {
        const { error } = await supabase
            .from('publisher_lists')
            .delete()
            .eq('id', itemId);

        if (error) throw error;

        devLog('Utente rimosso dalla tua lista', 'success');
        loadPublisherList();
    } catch (error) {
        devLog(`Errore rimozione: ${error.message}`, 'error');
        alert('Errore durante la rimozione: ' + error.message);
    }
}

async function searchUsersForPublisherList(query) {
    if (!query || query.length < 2) return [];

    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, nickname, role')
            .ilike('nickname', `%${query}%`)
            .limit(10);

        if (error) throw error;

        const { data: existing } = await supabase
            .from('publisher_lists')
            .select('allowed_user_id')
            .eq('publisher_id', currentUser.id);

        const existingIds = existing ? existing.map(e => e.allowed_user_id) : [];

        return (data || []).filter(u =>
            !existingIds.includes(u.id) &&
            u.role !== 'admin' &&
            u.role !== 'developer'
        );
    } catch (error) {
        devLog(`Errore ricerca utenti: ${error.message}`, 'error');
        return [];
    }
}

async function addToPublisherList(userId, nickname) {
    try {
        const { error } = await supabase
            .from('publisher_lists')
            .insert({
                publisher_id: currentUser.id,
                allowed_user_id: userId,
                allowed_user_nickname: nickname
            });

        if (error) throw error;

        devLog(`${nickname} aggiunto alla tua lista`, 'success');
        loadPublisherList();
        document.getElementById('publisherListSearch').value = '';
        document.getElementById('publisherListSearchResults').style.display = 'none';
    } catch (error) {
        devLog(`Errore aggiunta utente: ${error.message}`, 'error');
        alert('Errore durante l\'aggiunta: ' + error.message);
    }
}

const publisherListSearch = document.getElementById('publisherListSearch');
if (publisherListSearch) {
    publisherListSearch.addEventListener('input', async (e) => {
        const query = e.target.value;
        const resultsContainer = document.getElementById('publisherListSearchResults');

        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }

        const users = await searchUsersForPublisherList(query);

        if (users.length === 0) {
            resultsContainer.innerHTML = '<p style="padding: 10px; color: #666;">Nessun utente trovato</p>';
            resultsContainer.style.display = 'block';
            return;
        }

        resultsContainer.innerHTML = users.map(u => `
            <div onclick="addToPublisherList('${u.id}', '${u.nickname}')" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; hover: background-color: #f5f5f5;">
                ${u.nickname}
            </div>
        `).join('');
        resultsContainer.style.display = 'block';
    });
}

if (currentUser?.role === 'developer' || currentUser?.role === 'admin') {
    loadDeveloperList();
}

if (currentUser?.role === 'publisher') {
    loadPublisherList();
}
