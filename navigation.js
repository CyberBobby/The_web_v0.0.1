export function initNavigation(currentUser) {
    const mainApp = document.getElementById('mainApp');
    const authSection = document.getElementById('authSection');

    if (!currentUser) {
        mainApp.style.display = 'none';
        authSection.style.display = 'block';
        return;
    }

    mainApp.style.display = 'block';
    authSection.style.display = 'none';

    document.getElementById('currentUserDisplay').textContent = `${currentUser.nickname} (${currentUser.role})`;

    document.getElementById('homeNickname').textContent = currentUser.nickname;
    document.getElementById('homeRole').textContent = currentUser.role === 'admin' ? 'Admin' :
        currentUser.role === 'developer' ? 'Developer' :
        currentUser.role === 'publisher' ? 'Publisher' : 'Utente';

    if (currentUser.role === 'publisher' && currentUser.fidelty) {
        document.getElementById('homeFidelty').style.display = 'block';
        document.getElementById('homeFideltyValue').textContent = currentUser.fidelty;
    }

    const publisherBtn = document.querySelector('.nav-btn.publisher-only');
    const adminBtn = document.querySelector('.nav-btn.admin-only');
    const developerBtn = document.querySelector('.nav-btn.developer-only');

    if (currentUser.role === 'publisher') {
        publisherBtn.style.display = 'block';
    } else if (currentUser.role === 'admin') {
        adminBtn.style.display = 'block';
    } else if (currentUser.role === 'developer') {
        developerBtn.style.display = 'block';
    }

    const addFlyerBtn = document.getElementById('addFlyerBtnGlobal');
    if (currentUser.role === 'publisher' || currentUser.role === 'admin' || currentUser.role === 'developer') {
        addFlyerBtn.style.display = 'block';
    }

    updateHomeCapabilities(currentUser);

    setupNavigationButtons();

    navigateToPage('home');
}

function updateHomeCapabilities(user) {
    const capabilities = document.getElementById('homeCapabilities');
    let html = '<ul style="list-style: none; padding: 0;">';

    if (user.role === 'admin') {
        html += `
            <li>✓ Visualizzare e gestire tutti i flyer</li>
            <li>✓ Approvare o rifiutare richieste di publisher</li>
            <li>✓ Gestire permessi dei publisher</li>
            <li>✓ Visualizzare log delle sessioni</li>
        `;
    } else if (user.role === 'developer') {
        html += `
            <li>✓ Visualizzare e gestire tutti i flyer</li>
            <li>✓ Approvare o rifiutare richieste di publisher</li>
            <li>✓ Gestire permessi dei publisher</li>
            <li>✓ Configurare lista standard di visibilità</li>
            <li>✓ Visualizzare log delle sessioni</li>
        `;
    } else if (user.role === 'publisher') {
        html += `
            <li>✓ Visualizzare flyer pubblici</li>
            <li>✓ Creare richieste per nuovi flyer</li>
            <li>✓ Gestire la tua lista di visibilità privata</li>
        `;
        if (user.fidelty === 'friendly') {
            html += `<li>✓ Creare flyer direttamente senza approvazione</li>`;
        }
    } else {
        html += `<li>✓ Visualizzare flyer pubblici sulla mappa</li>`;
    }

    html += '</ul>';
    capabilities.innerHTML = html;
}

function setupNavigationButtons() {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            navigateToPage(page);

            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    const showFlyerListBtn = document.getElementById('showFlyerListBtn');
    const showMapBtn = document.getElementById('showMapBtn');
    const flyerListView = document.getElementById('flyerListView');
    const mapView = document.getElementById('mapView');

    showFlyerListBtn?.addEventListener('click', () => {
        flyerListView.style.display = 'block';
        mapView.style.display = 'none';
        showFlyerListBtn.classList.add('active');
        showMapBtn.classList.remove('active');
    });

    showMapBtn?.addEventListener('click', () => {
        flyerListView.style.display = 'none';
        mapView.style.display = 'block';
        showFlyerListBtn.classList.remove('active');
        showMapBtn.classList.add('active');

        const event = new CustomEvent('mapViewActivated');
        document.dispatchEvent(event);
    });
}

function navigateToPage(pageName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    const targetPage = document.getElementById(`${pageName}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    const homePage = document.getElementById('homePage');
    if (homePage && pageName === 'home') {
        homePage.classList.add('active');
    }

    if (pageName === 'flyers') {
        const event = new CustomEvent('flyersPageActivated');
        document.dispatchEvent(event);
    } else if (pageName === 'publisher-panel') {
        const event = new CustomEvent('publisherPanelActivated');
        document.dispatchEvent(event);
    } else if (pageName === 'admin-panel') {
        const event = new CustomEvent('adminPanelActivated');
        document.dispatchEvent(event);
    } else if (pageName === 'developer-panel') {
        const event = new CustomEvent('developerPanelActivated');
        document.dispatchEvent(event);
    }
}
