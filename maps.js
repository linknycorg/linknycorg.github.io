// API CONFIGURATION: s4kf-3yrf for LinkNYC Installations
// We set a high limit to capture all 2,000+ points
const API_URL = "https://data.cityofnewyork.us/resource/s4kf-3yrf.json?$limit=5000";

let fullDataset = [];
let map;
let markersCluster;

// BOROUGH CONFIGURATION FOR FLY-TO VIEWS
const BOROUGH_VIEWS = {
    "All": { center: [40.730, -73.960], zoom: 12 },
    "Manhattan": { center: [40.7831, -73.9712], zoom: 14 },
    "Brooklyn": { center: [40.6782, -73.9442], zoom: 13 },
    "Queens": { center: [40.7282, -73.7949], zoom: 13 },
    "Bronx": { center: [40.8448, -73.8648], zoom: 13 },
    "Staten Island": { center: [40.5795, -74.1502], zoom: 12 }
};

const markerMap = {};
let bookmarks = JSON.parse(localStorage.getItem('nyc_bookmarks') || '[]');

// Mengunci lebar kontainer peta agar selalu persis selebar layar handphone user
(function() {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
        #map {
            width: 100vw !important;  /* Dipaksa persis 100% dari lebar layar ponsel */
            max-width: 100vw !important;
            box-sizing: border-box !important;
        }
    `;
    document.head.appendChild(style);
})();

// Initialize Native Map
function initMap() {
    map = L.map('map', {
        scrollWheelZoom: true,
        tap: true,
        zoomControl: false
    }).setView(BOROUGH_VIEWS["All"].center, BOROUGH_VIEWS["All"].zoom);

    // Natural Map Colors using OSM
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initialize Cluster Group for Performance (Handles 2160+ points smoothly)
    markersCluster = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50
    });
    map.addLayer(markersCluster);

    fetchLiveData();
    renderBookmarksUI();
}

// Helper to normalize addresses for robust comparison (handles Blvd vs Boulevard, St vs Street, etc.)
function normalizeAddress(addr) {
    if (!addr) return "";
    return addr.toLowerCase()
        .replace(/\bboulevard\b/g, "blvd")
        .replace(/\bstreet\b/g, "st")
        .replace(/\bavenue\b/g, "ave")
        .replace(/\broad\b/g, "rd")
        .replace(/[^a-z0-9 ]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

// Fetch Live NYC Data
async function fetchLiveData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('API Sync Failed');
        const data = await response.json();
        
        // Clean and Map Data
        fullDataset = data.filter(item => item.latitude && item.longitude).map(item => {
            const is5G = item.planned_kiosk_type && item.planned_kiosk_type.includes('Link5G');
            return {
                id: item.link_site_id || Math.random(),
                type: is5G ? 'Link5G Smart Pole' : 'LinkNYC Kiosk',
                address: item.street_address || 'Official Link Point',
                borough: item.boro || 'Unknown',
                lat: parseFloat(item.latitude),
                lng: parseFloat(item.longitude),
                status: item.link_installation_status || 'Active',
                kioskType: item.planned_kiosk_type
            };
        });

        // Ensure both 1670 Victory Boulevard and 670 Victory Boulevard are present for Staten Island
        const has1670 = fullDataset.some(x => x.address && x.address.toUpperCase().includes('1670 VICTORY'));
        if (!has1670) {
            fullDataset.push({
                id: 'si-01-154026',
                type: 'LinkNYC Kiosk',
                address: '1670 VICTORY BOULEVARD',
                borough: 'Staten Island',
                lat: 40.613177,
                lng: -74.119224,
                status: 'Live',
                kioskType: ''
            });
        }
        const has670 = fullDataset.some(x => x.address && x.address.toUpperCase().includes('670 VICTORY') && !x.address.toUpperCase().includes('1670 VICTORY'));
        if (!has670) {
            fullDataset.push({
                id: 'si-01-154027',
                type: 'LinkNYC Kiosk',
                address: '670 VICTORY BOULEVARD',
                borough: 'Staten Island',
                lat: 40.627622,
                lng: -74.094562,
                status: 'Live',
                kioskType: ''
            });
        }

        updateMapMarkers(fullDataset);
        
        // Handle server-injected initial state parameters for SEO pages or falling back to URL search queries
        let hasFocused = false;
        const urlParams = new URLSearchParams(window.location.search);
        const querySpot = urlParams.get('spot');
        const queryId = urlParams.get('id');
        const spotSource = window.INITIAL_SPOT || querySpot;

        if (spotSource) {
            const spotAddress = normalizeAddress(spotSource);
            const foundSpot = fullDataset.find(item => item.address && normalizeAddress(item.address).includes(spotAddress));
            if (foundSpot) {
                focusKiosk(foundSpot.id, foundSpot.lat, foundSpot.lng, true);
                hasFocused = true;
            }
        } else if (queryId) {
            const foundSpot = fullDataset.find(item => String(item.id) === String(queryId));
            if (foundSpot) {
                focusKiosk(foundSpot.id, foundSpot.lat, foundSpot.lng, true);
                hasFocused = true;
            }
        } else {
            // Client-side fallback dynamic URL fallback parser
            const pathname = window.location.pathname.toLowerCase();
            const pathMatch = pathname.match(/(?:\/(?:staten-island|brooklyn|bronx|queens|manhattan))?\/([a-z0-9\-]+)-(si|bk|bx|qns|mn)\.html$/);
            if (pathMatch) {
                const pathSpotSlug = pathMatch[1];
                const foundSpot = fullDataset.find(item => {
                    const normalizedItem = normalizeAddress(item.address).replace(/\s+/g, "-");
                    const normalizedPath = pathSpotSlug
                        .replace(/\bboulevard\b/g, "blvd")
                        .replace(/\broad\b/g, "rd")
                        .replace(/\bstreet\b/g, "st")
                        .replace(/\bavenue\b/g, "ave");
                    return normalizedItem === normalizedPath || normalizedItem.includes(normalizedPath) || normalizedPath.includes(normalizedItem);
                });
                if (foundSpot) {
                    focusKiosk(foundSpot.id, foundSpot.lat, foundSpot.lng, true);
                    hasFocused = true;
                }
            }
        }
        
        const queryBorough = urlParams.get('borough');
        if (!hasFocused && (window.INITIAL_BOROUGH || queryBorough)) {
            const b = (window.INITIAL_BOROUGH || queryBorough).toLowerCase();
            const targetBorough = Object.keys(BOROUGH_VIEWS).find(k => k.toLowerCase() === b);
            if (targetBorough) {
                filterByBorough(targetBorough);
            }
        }

        // Transition UI
        document.getElementById('map-loader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('map-loader').style.display = 'none';
        }, 500);

    } catch (error) {
        console.error("Critical Mapping Error:", error);
        document.getElementById('map-loader').innerHTML = `
            <div class="flex items-center text-red-650 font-black italic">
                <i data-lucide="alert-triangle" class="w-5 h-5 mr-3"></i>
                NYC API CONNECTION ERROR
            </div>
        `;
        lucide.createIcons();
    }
}

// Render Markers Logic
function updateMapMarkers(data) {
    const localAdsDatabase = {
        "36 BOND STREET": {
            targetUrl: "https://www.devocion.com/pages/cafes#cafe-menu",
            promoText: "☕Devoción<br/>(10 Steps Away)a specialty coffee shop and cafe at 148 Grand St."
        },
        "131 AVENUE C": {
            targetUrl: "https://google.com",
            promoText: "🍕 BELLA PIZZA<br/>(10 Steps Away) Show this app screen for 10% Off your next slice!"
        },
        "268 GREENE STREET": {
            targetUrl: "http://44e8thst.heavenlymarketnyc.com",
            promoText: "☕ HEAVENLY MARKET & CATERING<br/>a delightful deli offering a variety of fresh and delicious food options!"
        },
        "171 FLATBUSH AVENUE": {
            targetUrl: "https://example.com",
            promoText: "🥪 BROOKLYN DELI<br/>Free Fountain Drink with any Premium Hero Sandwich purchase!"
        },
        "55 WATER STREET": {
            targetUrl: "https://orderallamericandeli.com/menu",
            promoText: "🥪 ALL AMERICAN DELI<br/>42 Water St Second Floor, NYC 10004"
        }
    };

    markersCluster.clearLayers();
    
    data.forEach(item => {
        const is5G = item.type === 'Link5G Smart Pole';
        const customIcon = L.divIcon({
            className: 'custom-5g-marker',
            html: `<div class="marker-pin ${is5G ? 'smart-pole' : 'nyc-kiosk'}">
                ${is5G ? 
                    `<div class="flex flex-col items-center leading-[1]">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M9 17.05a7 7 0 0 1 6 0"/><path d="M12 20h.01"/></svg>
                        <span style="font-size: 8px; margin-top: -2px;">5G</span>
                    </div>` : 
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M9 17.05a7 7 0 0 1 6 0"/><path d="M12 20h.01"/></svg>'
                }
            </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
        });

        const marker = L.marker([item.lat, item.lng], { icon: customIcon });
        markerMap[item.id] = marker;
        
        const isBookmarked = bookmarks.some(b => String(b.id) === String(item.id));
        const bookmarkBtnClass = isBookmarked ? 'bg-purple-900 border border-purple-500/30 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-850';
        const bookmarkBtnText = isBookmarked ? 'Bookmarked' : 'Bookmark';
        const bookmarkIcon = isBookmarked ? 'bookmark-check' : 'bookmark';

        const address = item.address ? item.address.toUpperCase().trim() : "";
        const adHtml = localAdsDatabase[address] ? `
        <div class="my-2 pt-2 border-t border-dashed border-slate-200">
            <a href="${localAdsDatabase[address].targetUrl}" target="_blank" class="block group">
                <div class="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-blue-600 mb-1">
                    <span class="animate-pulse">📢 NEIGHBOR ADS</span>
                    <span class="group-hover:underline text-[7px] text-slate-400">CLICK BELOW &rarr;</span>
                </div>
                <div class="w-full bg-blue-100 border border-blue-300 p-2 text-left hover:bg-blue-200 transition-all rounded-none shadow-sm">
                    <span class="text-[10px] text-center font-black text-slate-900 leading-tight block">${localAdsDatabase[address].promoText}</span>
                </div>
            </a>
        </div>
        ` : "";

        const popupContent = `
            <div class="px-3 py-3 min-w-[190px] max-w-[200px] space-y-2.5 font-sans text-slate-900 bg-white">
                <div class="flex items-center justify-between">
                    <span class="${is5G ? 'bg-[#0c2340] text-white' : 'bg-[#00a8ff] text-white'} text-[7.5px] font-black px-1.5 py-0.5 rounded-none italic uppercase tracking-wider shadow-sm">${item.type}</span>
                    <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">${item.borough}</span>
                </div>

                <div class="space-y-0.5">
                    <h4 class="text-xs font-black text-[#0c2340] uppercase tracking-tight leading-tight">${item.address}</h4>
                    <div class="flex items-center text-[9px] font-black uppercase text-emerald-600">
                        <span class="w-1 h-1 bg-emerald-500 rounded-none mr-1.5 animate-pulse"></span>
                        ${item.status === 'Live' ? 'Online' : item.status}
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-2.5">
                    <div class="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-none border border-slate-100/30">
                        <div class="bg-blue-105 p-0.5 rounded-none" style="background-color: #dbeafe;"><i data-lucide="wifi" class="w-3 h-3 text-blue-600"></i></div>
                        <div class="flex flex-col">
                            <span class="text-[8.5px] font-black text-slate-800 uppercase leading-none">FREE</span>
                            <span class="text-[6.5px] font-bold text-slate-400 uppercase tracking-tighter">Wi-Fi</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-none border border-slate-100/30">
                        <div class="bg-yellow-105 p-0.5 rounded-none" style="background-color: #fef9c3;"><i data-lucide="battery-charging" class="w-3 h-3 text-yellow-650" style="color: #b45309;"></i></div>
                        <div class="flex flex-col">
                            <span class="text-[8.5px] font-black text-slate-800 uppercase leading-none">USB</span>
                            <span class="text-[6.5px] font-bold text-slate-400 uppercase tracking-tighter">Charge</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-none border border-slate-100/30">
                        <div class="bg-emerald-105 p-0.5 rounded-none" style="background-color: #dcfce7;"><i data-lucide="phone" class="w-3 h-3 text-emerald-600"></i></div>
                        <div class="flex flex-col">
                            <span class="text-[8.5px] font-black text-slate-800 uppercase leading-none">FREE</span>
                            <span class="text-[6.5px] font-bold text-slate-400 uppercase tracking-tighter">Calls</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-1.5 bg-red-50 p-1 rounded-none border border-red-100/30">
                        <div class="bg-red-100 p-0.5 rounded-none"><i data-lucide="alert-circle" class="w-3 h-3 text-red-650"></i></div>
                        <div class="flex flex-col">
                            <span class="text-[8.5px] font-black text-red-700 uppercase leading-none">911</span>
                            <span class="text-[6.5px] font-bold text-red-400 uppercase tracking-tighter">Direct</span>
                        </div>
                    </div>
                </div>

                ${is5G ? `
                <div class="flex items-center justify-center space-x-1.5 bg-gradient-to-r from-blue-600 to-[#0c2340] p-1.5 rounded-none shadow-sm border border-white/10">
                    <i data-lucide="signal" class="w-3.5 h-3.5 text-white/90"></i>
                    <div class="flex flex-col">
                        <span class="text-[8.5px] font-black text-white uppercase tracking-wider leading-none">Ultra 5G Active</span>
                        <span class="text-[6.5px] font-bold text-blue-200 uppercase tracking-wide mt-0.5">Cellular Offload</span>
                    </div>
                </div>
                ` : `
                <div class="flex items-center justify-center space-x-1.5 bg-slate-900 p-1.5 rounded-none shadow-sm">
                    <i data-lucide="tablet" class="w-3.5 h-3.5 text-white/90"></i>
                    <div class="flex flex-col">
                        <span class="text-[8.5px] font-black text-white uppercase tracking-wider leading-none">Access Tablet</span>
                        <span class="text-[6.5px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Maps & Services</span>
                    </div>
                </div>
                `}

                ${adHtml}

                <!-- BOOKMARK ACTION BUTTON -->
                <div class="mt-2.5 border-t border-slate-100 pt-2.5 flex space-x-1">
                    <button id="bookmark-btn-${item.id}" onclick="event.stopPropagation(); toggleBookmark('${item.id}', '${item.address.replace(/'/g, "\\'")}', ${item.lat}, ${item.lng}, '${item.type}', '${item.borough}')" class="${bookmarkBtnClass} flex-1 flex items-center justify-center space-x-1 py-1 px-1.5 text-[9px] font-black uppercase tracking-wider rounded-none transition-all">
                        <i data-lucide="${bookmarkIcon}" class="w-3 h-3"></i>
                        <span>${bookmarkBtnText}</span>
                    </button>
                    <button onclick="event.stopPropagation(); openReportModal('${item.id}', '${item.address.replace(/'/g, "\\'")}')" class="bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 flex items-center justify-center py-1 px-1.5 rounded-none transition-all" title="Report Issue">
                        <i data-lucide="info" class="w-3 h-3"></i>
                        <span class="ml-0.5 text-[9px]" style="font-weight: 900; text-transform: uppercase;">Report</span>
                    </button>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent, { 
            closeButton: false, 
            className: 'nyc-detailed-popup',
            offset: [0, -10],
            maxWidth: 200
        });
        
        markersCluster.addLayer(marker);
    });
    
    // Re-render icons when popups are opened to handle dynamic rendering
    map.on('popupopen', () => {
        lucide.createIcons();
    });

    lucide.createIcons();
}

// Bookmark Toggle & Navigation Dropdown logic
function toggleBookmark(id, address, lat, lng, type, borough) {
    let current = JSON.parse(localStorage.getItem('nyc_bookmarks') || '[]');
    const index = current.findIndex(b => String(b.id) === String(id));
    if (index > -1) {
        current.splice(index, 1);
    } else {
        current.push({ id: String(id), address, lat, lng, type, borough });
    }
    localStorage.setItem('nyc_bookmarks', JSON.stringify(current));
    bookmarks = current;
    
    renderBookmarksUI();
    
    const btn = document.getElementById(`bookmark-btn-${id}`);
    if (btn) {
        const isNowBookmarked = current.some(b => String(b.id) === String(id));
        if (isNowBookmarked) {
            btn.className = "bg-purple-900 border border-purple-500/30 text-white w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-black uppercase tracking-wider rounded-none transition-all";
            btn.innerHTML = `<i data-lucide="bookmark-check" class="w-4 h-4"></i> <span>Bookmarked</span>`;
        } else {
            btn.className = "bg-slate-100 hover:bg-slate-200 text-slate-850 w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-black uppercase tracking-wider rounded-none transition-all";
            btn.innerHTML = `<i data-lucide="bookmark" class="w-4 h-4"></i> <span>Bookmark</span>`;
        }
        lucide.createIcons();
    }
}

function removeBookmark(id) {
    let current = JSON.parse(localStorage.getItem('nyc_bookmarks') || '[]');
    const index = current.findIndex(b => String(b.id) === String(id));
    if (index > -1) {
        current.splice(index, 1);
        localStorage.setItem('nyc_bookmarks', JSON.stringify(current));
        bookmarks = current;
        renderBookmarksUI();
         
        const btn = document.getElementById(`bookmark-btn-${id}`);
        if (btn) {
            btn.className = "bg-slate-100 hover:bg-slate-200 text-slate-850 w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-black uppercase tracking-wider rounded-none transition-all";
            btn.innerHTML = `<i data-lucide="bookmark" class="w-4 h-4"></i> <span>Bookmark</span>`;
            lucide.createIcons();
        }
    }
}

function toggleBookmarksDropdown() {
    const dropdown = document.getElementById('bookmarks-dropdown');
    dropdown.classList.toggle('hidden');
}

function toggleBookmarksDropdownMobile() {
    const dropdown = document.getElementById('bookmarks-dropdown-mobile');
    dropdown.classList.toggle('hidden');
}

// Report Issue Modal Logic
function openReportModal(id, address) {
    const rId = document.getElementById('report-kiosk-id');
    const rAddr = document.getElementById('report-kiosk-address');
    const rType = document.getElementById('report-issue-type');
    const rDetails = document.getElementById('report-details');
    const rBanner = document.getElementById('report-success-banner');
    const rModal = document.getElementById('report-modal');
    
    if (rId) rId.value = id;
    if (rAddr) rAddr.value = address;
    if (rType) rType.value = "";
    if (rDetails) rDetails.value = "";
    if (rBanner) rBanner.classList.add('hidden');
    if (rModal) rModal.classList.remove('hidden');
}

function closeReportModal() {
    const rModal = document.getElementById('report-modal');
    if (rModal) rModal.classList.add('hidden');
}

function submitReport(event) {
    event.preventDefault();
    
    const rId = document.getElementById('report-kiosk-id');
    const rAddr = document.getElementById('report-kiosk-address');
    const rType = document.getElementById('report-issue-type');
    const rDetails = document.getElementById('report-details');
    
    const kioskId = rId ? rId.value : "";
    const address = rAddr ? rAddr.value : "";
    const issueType = rType ? rType.value : "";
    const details = rDetails ? rDetails.value : "";
    const timestamp = new Date().toISOString();
    
    const reportPayload = {
        kioskId,
        address,
        issueType,
        details,
        timestamp
    };
    
    console.log("=== LINKNYC INCIDENT REPORT LOGGED ===");
    console.log(JSON.stringify(reportPayload, null, 2));
    console.log("======================================");
    
    // Save inside client-side localStorage logs as well for resilience
    const incidentLogs = JSON.parse(localStorage.getItem('nyc_incident_reports') || '[]');
    incidentLogs.push(reportPayload);
    localStorage.setItem('nyc_incident_reports', JSON.stringify(incidentLogs));
    
    // Display internal success inside modal
    const banner = document.getElementById('report-success-banner');
    if (banner) banner.classList.remove('hidden');
    
    // Close after brief delay
    setTimeout(() => {
        closeReportModal();
    }, 2000);
}

// Close dropdowns on clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('bookmarks-dropdown');
    const navContainer = document.getElementById('bookmarks-nav-container');
    if (dropdown && navContainer && !navContainer.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
    
    const dropdownMobile = document.getElementById('bookmarks-dropdown-mobile');
    const mobileBtn = document.querySelector('.md\\:hidden.flex.items-center');
    if (dropdownMobile && mobileBtn && !mobileBtn.contains(e.target)) {
        dropdownMobile.classList.add('hidden');
    }
});

function focusKiosk(id, lat, lng, isInitial = false) {
    if (map) {
        map.invalidateSize();
        if (isInitial) {
            map.setView([lat, lng], 17);
        } else {
            map.flyTo([lat, lng], 17);
        }
    }
    
    // Try to open popup after short wait
    const delay = isInitial ? 350 : 600;
    setTimeout(() => {
        const marker = markerMap[id];
        if (marker) {
            markersCluster.zoomToShowLayer(marker, () => {
                marker.openPopup();
            });
        }
    }, delay);
    
    const dropdown = document.getElementById('bookmarks-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    const dropdownMobile = document.getElementById('bookmarks-dropdown-mobile');
    if (dropdownMobile) dropdownMobile.classList.add('hidden');
}

function renderBookmarksUI() {
    const current = bookmarks;
    const count = current.length;
    
    const countBadge = document.getElementById('bookmark-count');
    const badgeCountBadge = document.getElementById('bookmark-count-badge');
    const mobileCount = document.getElementById('mobile-bookmark-count');
    
    if (countBadge) countBadge.innerText = count;
    if (badgeCountBadge) badgeCountBadge.innerText = count;
    if (mobileCount) mobileCount.innerText = count;
    
    const container = document.getElementById('bookmarks-list-container');
    const containerMobile = document.getElementById('bookmarks-list-container-mobile');
    
    const buildHTML = (item) => `
        <div class="p-3 hover:bg-slate-800 transition-colors flex justify-between items-start space-x-2">
            <button onclick="focusKiosk('${item.id}', ${item.lat}, ${item.lng})" class="flex-grow text-left focus:outline-none min-w-0">
                <span class="block font-black uppercase tracking-wide text-white text-[11px] truncate">${item.address}</span>
                <span class="block text-[9px] text-blue-400 font-medium leading-none mt-1 uppercase truncate">${item.type}</span>
                <span class="block text-[8px] text-slate-500 uppercase mt-0.5">${item.borough}</span>
            </button>
            <button onclick="event.stopPropagation(); removeBookmark('${item.id}')" class="text-slate-500 hover:text-red-400 p-1 flex-shrink-0">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        </div>
    `;
    
    let htmlContent = "";
    if (count === 0) {
        htmlContent = `<div class="p-4 text-center text-[10px] text-slate-500 uppercase font-black tracking-widest italic">No saved points</div>`;
    } else {
        htmlContent = current.map(item => buildHTML(item)).join('');
    }
    
    if (container) container.innerHTML = htmlContent;
    if (containerMobile) containerMobile.innerHTML = htmlContent;
    
    lucide.createIcons();
}

// Borough Filtering System
function filterByBorough(borough) {
    // Update UI State
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.filter-btn[data-borough="${borough}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Process Data
    const filteredData = borough === "All" 
        ? fullDataset 
        : fullDataset.filter(i => i.borough.toLowerCase() === borough.toLowerCase());
    
    updateMapMarkers(filteredData);

    // Update Map View
    const view = BOROUGH_VIEWS[borough] || BOROUGH_VIEWS["All"];
    map.flyTo(view.center, view.zoom, {
        animate: true,
        duration: 1.5,
        easeLinearity: 0.25
    });
}

// Deep Search Implementation
document.getElementById('map-search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = fullDataset.filter(i => 
        i.address.toLowerCase().includes(term) || 
        i.borough.toLowerCase().includes(term)
    );
    updateMapMarkers(filtered);
});

// Initialize System
window.addEventListener('load', () => {
    initMap();
    lucide.createIcons();
    
    // Invalidate map size shortly after load to ensure complete tile rendering
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 200);
    
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('ServiceWorker registered:', reg))
            .catch(err => console.error('ServiceWorker registration failed:', err));
    }

    // PWA Smart Install Logic
    const installBtn = document.getElementById('pwaInstallBtn');
    const installBtnMobile = document.getElementById('pwaInstallBtnMobile');
    let deferredPrompt;

    // Function to detect Android, iPhone, iPad, iPod, and mobile/tablet devices
    function isMobileOrTablet() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    }

    // Check device type first
    if (isMobileOrTablet()) {
        // Check if it is already installed or launched as a standalone app shortcut
        const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        
        if (isPWAInstalled) {
            // User is already inside the shortcut app, hide the buttons
            if (installBtn) installBtn.style.display = 'none';
            if (installBtnMobile) installBtnMobile.style.display = 'none';
        } else {
            // User is on a mobile/tablet device but hasn't installed the shortcut yet, ensure it is displayed
            if (installBtn) {
                installBtn.style.display = 'flex';
                installBtn.classList.remove('hidden');
            }
            if (installBtnMobile) {
                installBtnMobile.style.display = 'flex';
                installBtnMobile.classList.remove('hidden');
            }
            
            // Capture the native Android/Chrome install prompt
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
            });
        }
    } else {
        // User is on a laptop, desktop PC, or Mac. Completely remove the PWA buttons from the DOM layout
        if (installBtn) {
            installBtn.remove();
        }
        if (installBtnMobile) {
            installBtnMobile.remove();
        }
    }

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                if (installBtn) installBtn.style.display = 'none';
                if (installBtnMobile) installBtnMobile.style.display = 'none';
            }
            deferredPrompt = null;
        } else {
            // User-reassuring fallback alert for iOS Safari/other mobile environments
            alert("Save LinkNYC Shortcut App (Uses 0 MB Storage)\n\nTo add this interactive map directly to your phone's home screen for fast one-click access:\n\n1. Tap your browser's 'Share' or 'Menu' icon (bottom or top of your screen).\n2. Scroll down the option menu list.\n3. Tap 'Add to Home Screen'.\n4. Confirm by tapping 'Add'.\n\nNo app store download required—100% safe and lightweight!");
        }
    };

    // Handle click action with smart manual fallback alert for iOS Safari users
    if (installBtn) {
        installBtn.addEventListener('click', handleInstallClick);
    }
    if (installBtnMobile) {
        installBtnMobile.addEventListener('click', handleInstallClick);
    }

    window.addEventListener('appinstalled', () => {
        const btn = document.getElementById('pwaInstallBtn');
        const btnMobile = document.getElementById('pwaInstallBtnMobile');
        if (btn) btn.style.display = 'none';
        if (btnMobile) btnMobile.style.display = 'none';
        deferredPrompt = null;
    });
});