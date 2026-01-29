let locationPickerMap = null;
let locationPickerMarker = null;
let selectedLocation = { lat: null, lng: null, address: '' };

export function initLocationPicker() {
    const searchBtn = document.getElementById('searchAddressBtn');
    const selectMapBtn = document.getElementById('selectOnMapBtn');
    const confirmBtn = document.getElementById('confirmLocationBtn');
    const addressInput = document.getElementById('flyerAddress');

    searchBtn?.addEventListener('click', handleAddressSearch);
    selectMapBtn?.addEventListener('click', toggleMapPicker);
    confirmBtn?.addEventListener('click', confirmLocation);
    addressInput?.addEventListener('input', debounce(handleAddressInput, 500));
}

async function handleAddressSearch() {
    const addressInput = document.getElementById('flyerAddress');
    const query = addressInput.value.trim();

    if (!query) {
        alert('Inserisci un indirizzo da cercare');
        return;
    }

    try {
        const results = await searchAddress(query);
        displayAddressSuggestions(results);
    } catch (error) {
        console.error('Errore ricerca indirizzo:', error);
        alert('Errore durante la ricerca dell\'indirizzo');
    }
}

async function handleAddressInput(e) {
    const query = e.target.value.trim();

    if (query.length < 3) {
        hideAddressSuggestions();
        return;
    }

    try {
        const results = await searchAddress(query);
        displayAddressSuggestions(results);
    } catch (error) {
        console.error('Errore ricerca indirizzo:', error);
    }
}

async function searchAddress(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'FlyerApp/1.0'
        }
    });

    if (!response.ok) {
        throw new Error('Errore nella ricerca');
    }

    return await response.json();
}

function displayAddressSuggestions(results) {
    const suggestionsDiv = document.getElementById('addressSuggestions');

    if (!results || results.length === 0) {
        suggestionsDiv.innerHTML = '<div style="padding: 1rem; color: #999;">Nessun risultato trovato</div>';
        suggestionsDiv.classList.add('show');
        return;
    }

    suggestionsDiv.innerHTML = results.map(result => `
        <div class="suggestion-item" data-lat="${result.lat}" data-lon="${result.lon}" data-address="${result.display_name}">
            ${result.display_name}
        </div>
    `).join('');

    suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => selectSuggestion(item));
    });

    suggestionsDiv.classList.add('show');
}

function hideAddressSuggestions() {
    const suggestionsDiv = document.getElementById('addressSuggestions');
    suggestionsDiv.classList.remove('show');
    suggestionsDiv.innerHTML = '';
}

function selectSuggestion(item) {
    const lat = parseFloat(item.dataset.lat);
    const lon = parseFloat(item.dataset.lon);
    const address = item.dataset.address;

    selectedLocation = { lat, lng: lon, address };

    document.getElementById('flyerAddress').value = address;
    document.getElementById('flyerLatitude').value = lat;
    document.getElementById('flyerLongitude').value = lon;

    displaySelectedLocation(address);
    hideAddressSuggestions();
}

function toggleMapPicker() {
    const container = document.getElementById('mapPickerContainer');
    const isVisible = container.style.display !== 'none';

    if (isVisible) {
        container.style.display = 'none';
    } else {
        container.style.display = 'block';
        if (!locationPickerMap) {
            initMapPicker();
        } else {
            locationPickerMap.invalidateSize();
        }
    }
}

function initMapPicker() {
    const mapElement = document.getElementById('mapPicker');

    const defaultLat = selectedLocation.lat || 41.9028;
    const defaultLng = selectedLocation.lng || 12.4964;

    locationPickerMap = L.map(mapElement).setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(locationPickerMap);

    if (selectedLocation.lat && selectedLocation.lng) {
        locationPickerMarker = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(locationPickerMap);
    }

    locationPickerMap.on('click', async (e) => {
        const { lat, lng } = e.latlng;

        if (locationPickerMarker) {
            locationPickerMarker.setLatLng([lat, lng]);
        } else {
            locationPickerMarker = L.marker([lat, lng]).addTo(locationPickerMap);
        }

        selectedLocation.lat = lat;
        selectedLocation.lng = lng;

        try {
            const address = await reverseGeocode(lat, lng);
            selectedLocation.address = address;
        } catch (error) {
            console.error('Errore reverse geocoding:', error);
            selectedLocation.address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    });
}

async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'FlyerApp/1.0'
        }
    });

    if (!response.ok) {
        throw new Error('Errore nel reverse geocoding');
    }

    const data = await response.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function confirmLocation() {
    if (!selectedLocation.lat || !selectedLocation.lng) {
        alert('Seleziona prima una posizione sulla mappa');
        return;
    }

    document.getElementById('flyerAddress').value = selectedLocation.address;
    document.getElementById('flyerLatitude').value = selectedLocation.lat;
    document.getElementById('flyerLongitude').value = selectedLocation.lng;

    displaySelectedLocation(selectedLocation.address);

    document.getElementById('mapPickerContainer').style.display = 'none';
}

function displaySelectedLocation(address) {
    const display = document.getElementById('selectedLocationDisplay');
    const text = document.getElementById('selectedLocationText');

    text.textContent = address;
    display.style.display = 'block';
}

export function clearLocationSelection() {
    selectedLocation = { lat: null, lng: null, address: '' };

    document.getElementById('flyerAddress').value = '';
    document.getElementById('flyerLatitude').value = '';
    document.getElementById('flyerLongitude').value = '';
    document.getElementById('selectedLocationDisplay').style.display = 'none';
    document.getElementById('mapPickerContainer').style.display = 'none';

    hideAddressSuggestions();

    if (locationPickerMarker) {
        locationPickerMap.removeLayer(locationPickerMarker);
        locationPickerMarker = null;
    }
}

export function setLocationSelection(lat, lng, address) {
    selectedLocation = { lat, lng, address };

    if (lat && lng) {
        document.getElementById('flyerAddress').value = address || '';
        document.getElementById('flyerLatitude').value = lat;
        document.getElementById('flyerLongitude').value = lng;

        if (address) {
            displaySelectedLocation(address);
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
