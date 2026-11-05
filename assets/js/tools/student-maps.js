// Maps Module using Leaflet (Lazy Loaded)
let mapInstance = null;

async function initMap(containerId, centerLat = 36.7538, centerLng = 3.0588, zoom = 11) {
    if (typeof L === 'undefined') {
        // Load Leaflet CSS
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);

        // Load Leaflet JS
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    const container = document.getElementById(containerId);
    if(!container) return;

    mapInstance = L.map(containerId).setView([centerLat, centerLng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    return mapInstance;
}

function addMarker(lat, lng, title, popupContent, iconType = 'default') {
    if(!mapInstance) return;

    let iconHtml = '<i class="fa-solid fa-location-dot" style="font-size: 24px; color: #3498db;"></i>'; // Default blue

    if (iconType === 'university') {
        iconHtml = '<i class="fa-solid fa-graduation-cap" style="font-size: 24px; color: #2ecc71;"></i>'; // Green
    } else if (iconType === 'residence') {
        iconHtml = '<i class="fa-solid fa-building" style="font-size: 24px; color: #e67e22;"></i>'; // Orange
    } else if (iconType === 'ecole') {
        iconHtml = '<i class="fa-solid fa-school" style="font-size: 24px; color: #9b59b6;"></i>'; // Purple
    }

    const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-map-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance);

    if(popupContent) {
        marker.bindPopup(`<b>${title}</b><br>${popupContent}`);
    } else {
        marker.bindPopup(title);
    }
    return marker;
}
