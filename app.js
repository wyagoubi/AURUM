/* ═══════════════════════════════════════════════
   AURUM — STABLE LOCAL VERSION (NO API FAILURE)
   FIXED: unified authentication with token, booking works on all devices
═══════════════════════════════════════════════ */

// ================== API CONFIG ==================
const API_BASE = 'https://aurum-m4v8.onrender.com/api';

/* ══════════ THEME ══════════ */
const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const savedTheme = localStorage.getItem('aurum-theme') || 'dark-mode';
body.className = savedTheme;
setThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
  const isDark = body.classList.contains('dark-mode');
  const next = isDark ? 'light-mode' : 'dark-mode';
  body.className = next;
  localStorage.setItem('aurum-theme', next);
  setThemeIcon(next);
});

function setThemeIcon(mode) {
  themeIcon.textContent = mode === 'dark-mode' ? '☀' : '☾';
}

/* ══════════ SESSION ══════════ */
const navUser       = document.getElementById('navUser');
const navUserLogged = document.getElementById('navUserLogged');
const navAvatar     = document.getElementById('navAvatar');
const navUsername   = document.getElementById('navUsername');

let currentUser = JSON.parse(localStorage.getItem('aurum-user') || 'null');

function updateNav() {
  currentUser = JSON.parse(localStorage.getItem('aurum-user') || 'null');
  if (currentUser && currentUser.email) {
    navUser.style.display = 'none';
    navUserLogged.classList.remove('hidden');
    navAvatar.textContent = currentUser.initials || currentUser.email[0].toUpperCase();
    navUsername.textContent = currentUser.name ? currentUser.name.split(' ')[0] : currentUser.email.split('@')[0];
  } else {
    navUser.style.display = '';
    navUserLogged.classList.add('hidden');
  }
}
updateNav();

document.getElementById("navSignout")?.addEventListener("click", () => {
  const userEmail = currentUser?.email;
  localStorage.removeItem('aurum-user');
  localStorage.removeItem('aurum-token');
  if (userEmail) localStorage.removeItem(`aurum-chat-${userEmail}`);
  else localStorage.removeItem('aurum-chat-temp');
  window._aiHistory = [];
  updateNav();
  showToast('You have been signed out.');
  window.location.reload();
});

/* ══════════ NAV ══════════ */
const navbar   = document.getElementById('navbar');
const pages    = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 40));

function showPage(id) {
  pages.forEach(p => p.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if (target) {
    target.classList.add('active');
    const offset = navbar?.offsetHeight + 8 || 0;
    window.scrollTo({ top: offset, behavior: 'smooth' });
  }
  navLinks.forEach(l => { if (l.dataset.page === id) l.classList.add('active'); });
  document.querySelector('.nav-links')?.classList.remove('mobile-open');

  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('page', id);
  window.history.pushState({}, '', newUrl);

  if (id === 'home') {
    const locationInput = document.getElementById('s-location');
    if (locationInput) locationInput.value = '';
  }
  if (id === 'results') {
    const location = document.getElementById('s-location')?.value.trim() || '';
    const rooms = parseInt(document.getElementById('s-rooms')?.value) || 1;
    const children = parseInt(document.getElementById('s-children')?.value) || 0;
    const price = document.getElementById('s-price')?.value || 'any';
    const hotels = filterHotels(location, rooms, children, price);
    renderResults(hotels, location, rooms, children, price);
  }
}

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    if (link.closest('#navUser')) return;
    if (link.dataset.page) { e.preventDefault(); showPage(link.dataset.page); return; }
    if (link.getAttribute('href') === 'owner.html') {
      e.preventDefault();
      const curUser = JSON.parse(localStorage.getItem('aurum-user') || 'null');
      if (!curUser || curUser.role !== 'owner') {
        showSideSigninTip(link, null, 'You need to sign in as an owner to list your property');
      } else {
        window.location.href = 'owner.html';
      }
    }
  });
});

/* ══════════ LOCAL HOTEL DATABASE (12 HOTELS) ══════════ */
let hotelDatabase = [];

const HOTEL_COVERS = {
  'Le Grand Aurum Paris':    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
  'Aurum Palace London':     'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
  'Aurum Medina Marrakesh':  'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&q=80',
  'Aurum Sakura Tokyo':      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  'Aurum Overwater Maldives':'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
  'Aurum Summit Aspen':      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
  'Aurum Duomo Florence':    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
  'Aurum Sentosa Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
  'Aurum Royale Dubai':      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80',
  'Aurum Bosphorus Istanbul':'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80',
  'Aurum Riviera Santorini': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
  'Aurum Zen Bali':          'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
};

const HOTEL_GALLERY = {
  'Le Grand Aurum Paris':    ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800','https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'],
  'Aurum Palace London':     ['https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800','https://images.unsplash.com/photo-1562790351-d273a961e0e9?w=800','https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'],
  'Aurum Medina Marrakesh':  ['https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800','https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800','https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'],
  'Aurum Sakura Tokyo':      ['https://images.unsplash.com/photo-1553855994-dbbf0af09b4c?w=800','https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800','https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800'],
  'Aurum Overwater Maldives':['https://images.unsplash.com/photo-1540202404-1b927e27fa8b?w=800','https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800','https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800'],
  'Aurum Summit Aspen':      ['https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=800','https://images.unsplash.com/photo-1562632777-5e0b6e687513?w=800','https://images.unsplash.com/photo-1542621334-a254cf47733d?w=800'],
  'Aurum Duomo Florence':    ['https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=800','https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800','https://images.unsplash.com/photo-1578898886250-b39f1ad40a5f?w=800'],
  'Aurum Sentosa Singapore': ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800','https://images.unsplash.com/photo-1540541338537-71637f2ced2b?w=800'],
  'Aurum Royale Dubai':      ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800','https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800','https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800'],
  'Aurum Bosphorus Istanbul':['https://images.unsplash.com/photo-1454518027385-dcb7e548f29d?w=800','https://images.unsplash.com/photo-1615873968403-89e06862989f?w=800','https://images.unsplash.com/photo-1534351450181-ea9f78427fe8?w=800'],
  'Aurum Riviera Santorini': ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800','https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800','https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=800'],
  'Aurum Zen Bali':          ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800','https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=800','https://images.unsplash.com/photo-1561557958-4c39df35f955?w=800'],
};

const ROOM_IMGS = {
  'Deluxe Room':        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600',
  'Junior Suite':       'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600',
  'Grand Suite':        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600',
  'Presidential Suite': 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600',
};

const AMENITY_IMGS = [
  'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600',
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
  'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600',
];

function makeRealPhotos(hotelName, initial, color) {
  const cover = HOTEL_COVERS[hotelName];
  const gallery = HOTEL_GALLERY[hotelName] || [];
  const c1 = color || '#1a1208';
  const galleryLabels = ['Lobby', 'Terrace', 'Courtyard'];
  return {
    hotel: [
      { url: cover || '', gradient: `linear-gradient(135deg,${c1},#2a1f0a)`, label: 'Exterior', initial },
      ...gallery.map((url, i) => ({ url, gradient: `linear-gradient(135deg,${c1},#0e0c06)`, label: galleryLabels[i] || 'View', initial })),
    ],
    rooms: Object.entries(ROOM_IMGS).map(([label, url]) => ({ url, gradient: `linear-gradient(135deg,${c1},#0e0c06)`, label, initial })),
    amenities: ['Pool', 'Spa', 'Restaurant', 'Bar & Lounge'].map((label, i) => ({ url: AMENITY_IMGS[i], gradient: `linear-gradient(135deg,${c1},#0e0c06)`, label, initial })),
  };
}

function buildLocalDatabase() {
  hotelDatabase = [
    { id: 1, name: 'Le Grand Aurum Paris', city: 'Paris', country: 'France', stars: 5, price: 1850, rating: 4.9, reviews: 1284, desc: 'A palatial haven on the iconic Rue de la Paix...', amenities: ['Pool','Spa','Butler','Concierge','Fine Dining'], initial: 'LG', color: '#1a1208', maxChildren: 4, rooms: 5, imageUrl: HOTEL_COVERS['Le Grand Aurum Paris'], photos: makeRealPhotos('Le Grand Aurum Paris','LG','#1a1208') },
    { id: 2, name: 'Aurum Palace London', city: 'London', country: 'United Kingdom', stars: 5, price: 2200, rating: 4.8, reviews: 876, desc: 'Overlooking Hyde Park from the heart of Mayfair...', amenities: ['Pool','Spa','Butler','Michelin Restaurant','Private Cinema'], initial: 'AP', color: '#0a1218', maxChildren: 2, rooms: 5, imageUrl: HOTEL_COVERS['Aurum Palace London'], photos: makeRealPhotos('Aurum Palace London','AP','#0a1218') },
    { id: 3, name: 'Aurum Medina Marrakesh', city: 'Marrakesh', country: 'Morocco', stars: 5, price: 1200, rating: 4.9, reviews: 654, desc: 'A 16th-century riad transformed into an intimate sanctuary...', amenities: ['Hammam','Rooftop Pool','Spa','Cooking Class','Desert Excursion'], initial: 'AM', color: '#1a0e0a', maxChildren: 2, rooms: 3, imageUrl: HOTEL_COVERS['Aurum Medina Marrakesh'], photos: makeRealPhotos('Aurum Medina Marrakesh','AM','#1a0e0a') },
    { id: 4, name: 'Aurum Sakura Tokyo', city: 'Tokyo', country: 'Japan', stars: 5, price: 2800, rating: 4.8, reviews: 432, desc: 'Where Japanese omotenashi meets contemporary luxury...', amenities: ['Onsen','Michelin Dining','Tea Ceremony','Sky Pool','Helipad'], initial: 'AS', color: '#0e1018', maxChildren: 2, rooms: 4, imageUrl: HOTEL_COVERS['Aurum Sakura Tokyo'], photos: makeRealPhotos('Aurum Sakura Tokyo','AS','#0e1018') },
    { id: 5, name: 'Aurum Overwater Maldives', city: 'Malé', country: 'Maldives', stars: 5, price: 3500, rating: 5.0, reviews: 321, desc: 'Overwater villas above a UNESCO-protected lagoon...', amenities: ['Private Pool','Underwater Spa','Dive Center','Private Beach','Seaplane Transfer'], initial: 'AOM', color: '#0a1218', maxChildren: 3, rooms: 3, imageUrl: HOTEL_COVERS['Aurum Overwater Maldives'], photos: makeRealPhotos('Aurum Overwater Maldives','AOM','#0a1218') },
    { id: 6, name: 'Aurum Summit Aspen', city: 'Aspen', country: 'USA', stars: 5, price: 1600, rating: 4.7, reviews: 567, desc: 'A mountain sanctuary where the Rockies\' grandeur mirrors your ambitions.', amenities: ['Ski-in Ski-out','Mountain Spa','Private Chef','Heliski','Wine Cellar'], initial: 'ASA', color: '#14100a', maxChildren: 3, rooms: 4, imageUrl: HOTEL_COVERS['Aurum Summit Aspen'], photos: makeRealPhotos('Aurum Summit Aspen','ASA','#14100a') },
    { id: 7, name: 'Aurum Duomo Florence', city: 'Florence', country: 'Italy', stars: 5, price: 1400, rating: 4.9, reviews: 789, desc: 'Renaissance palazzo steps from the Duomo...', amenities: ['Art Tours','Wine Cellar','Rooftop Terrace','Cooking Class','Butler'], initial: 'ADF', color: '#1a1208', maxChildren: 2, rooms: 3, imageUrl: HOTEL_COVERS['Aurum Duomo Florence'], photos: makeRealPhotos('Aurum Duomo Florence','ADF','#1a1208') },
    { id: 8, name: 'Aurum Sentosa Singapore', city: 'Singapore', country: 'Singapore', stars: 5, price: 1950, rating: 4.8, reviews: 654, desc: 'Sentosa Island where tropical gardens cascade into an infinite-edge pool.', amenities: ['Infinity Pool','Spa','Yacht Charter','Private Beach','Helipad'], initial: 'ASS', color: '#06181c', maxChildren: 3, rooms: 4, imageUrl: HOTEL_COVERS['Aurum Sentosa Singapore'], photos: makeRealPhotos('Aurum Sentosa Singapore','ASS','#06181c') },
    { id: 9, name: 'Aurum Royale Dubai', city: 'Dubai', country: 'UAE', stars: 5, price: 2500, rating: 4.9, reviews: 1234, desc: 'Beachfront resort with gold leaf interiors, private marina and helipad.', amenities: ['Private Beach','Infinity Pool','Butler','Helipad','Marina','Gold Spa'], initial: 'ARD', color: '#1a1008', maxChildren: 4, rooms: 5, imageUrl: HOTEL_COVERS['Aurum Royale Dubai'], photos: makeRealPhotos('Aurum Royale Dubai','ARD','#1a1008') },
    { id: 10, name: 'Aurum Bosphorus Istanbul', city: 'Istanbul', country: 'Turkey', stars: 5, price: 1700, rating: 4.8, reviews: 890, desc: 'Ottoman palace reborn on the Bosphorus shore.', amenities: ['Hammam','Rooftop Pool','Butler','Yacht Charter','Ottoman Spa'], initial: 'ABI', color: '#1a1208', maxChildren: 2, rooms: 3, imageUrl: HOTEL_COVERS['Aurum Bosphorus Istanbul'], photos: makeRealPhotos('Aurum Bosphorus Istanbul','ABI','#1a1208') },
    { id: 11, name: 'Aurum Riviera Santorini', city: 'Santorini', country: 'Greece', stars: 5, price: 2400, rating: 4.95, reviews: 543, desc: 'Cliffside villas with private plunge pools and sunset dining.', amenities: ['Infinity Pool','Cave Spa','Butler','Sunset Dining','Private Terrace'], initial: 'ARS', color: '#0e0818', maxChildren: 2, rooms: 2, imageUrl: HOTEL_COVERS['Aurum Riviera Santorini'], photos: makeRealPhotos('Aurum Riviera Santorini','ARS','#0e0818') },
    { id: 12, name: 'Aurum Zen Bali', city: 'Bali', country: 'Indonesia', stars: 5, price: 1100, rating: 4.88, reviews: 789, desc: 'Jungle sanctuary with Ayurvedic spa and rice terrace views.', amenities: ['Jungle Pool','Ayurvedic Spa','Butler','Temple Tours','Yoga Pavilion'], initial: 'AZB', color: '#0e1208', maxChildren: 3, rooms: 3, imageUrl: HOTEL_COVERS['Aurum Zen Bali'], photos: makeRealPhotos('Aurum Zen Bali','AZB','#0e1208') },
  ];
  window._hotelsData = hotelDatabase;
}

function loadHotels() {
  buildLocalDatabase();
  renderResults(filterHotels('', 1, 0, 'any'), '', 1, 0, 'any');
}

/* ══════════ CUSTOM SEARCH DROPDOWNS ══════════ */
function initCustomSelect(id, hiddenSelectId) {
  const container = document.getElementById(id);
  const hiddenSel = document.getElementById(hiddenSelectId);
  if (!container || !hiddenSel) return;
  const trigger = container.querySelector('.custom-select-trigger');
  const valueSpan = container.querySelector('.custom-select-value');
  const options = container.querySelectorAll('.custom-select-option');
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.custom-select.open').forEach(el => { if (el !== container) el.classList.remove('open'); });
    container.classList.toggle('open');
  });
  options.forEach(opt => {
    opt.addEventListener('click', () => {
      hiddenSel.value = opt.dataset.value;
      valueSpan.textContent = opt.textContent;
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      container.classList.remove('open');
    });
  });
  document.addEventListener('click', (e) => { if (!container.contains(e.target)) container.classList.remove('open'); });
  hiddenSel.addEventListener('change', () => {
    const val = hiddenSel.value;
    options.forEach(opt => {
      if (opt.dataset.value === val) { opt.classList.add('selected'); valueSpan.textContent = opt.textContent; }
      else opt.classList.remove('selected');
    });
  });
}
initCustomSelect('roomsSelect', 's-rooms');
initCustomSelect('childrenSelect', 's-children');
initCustomSelect('budgetSelect', 's-price');

/* ══════════ SEARCH ══════════ */
document.getElementById('searchBtn').addEventListener('click', () => {
  const location = document.getElementById('s-location').value.trim();
  const rooms = parseInt(document.getElementById('s-rooms').value);
  const children = parseInt(document.getElementById('s-children').value);
  const price = document.getElementById('s-price').value;
  if (!location) { showToast('Please enter a destination.', 'error'); return; }
  renderResults(filterHotels(location, rooms, children, price), location, rooms, children, price);
  showPage('results');
});

function filterHotels(loc, rooms, children, price) {
  return hotelDatabase.filter(h => {
    const lm = !loc || h.city.toLowerCase().includes(loc.toLowerCase()) || h.country.toLowerCase().includes(loc.toLowerCase());
    const rm = h.rooms >= rooms;
    const cm = h.maxChildren >= children;
    let pm = true;
    if (price !== 'any') {
      const max = parseInt(price);
      pm = price === '1001' ? h.price > 1000 : h.price <= max;
    }
    return lm && rm && cm && pm;
  });
}

function renderResults(hotels, loc, rooms, children, price) {
  const grid = document.getElementById('resultsGrid');
  const title = document.getElementById('resultsTitle');
  const meta = document.getElementById('resultsMeta');
  const pl = price === 'any' ? 'Any budget' : price === '1001' ? 'Over $1,000/night' : `Up to $${price}/night`;
  title.innerHTML = `Hotels in <em>${loc || 'All Destinations'}</em>`;
  meta.textContent = `Showing ${hotels.length} propert${hotels.length===1?'y':'ies'} · ${rooms} room${rooms>1?'s':''} · ${children} child${children!==1?'ren':''} · ${pl}`;
  grid.innerHTML = '';
  if (!hotels.length) {
    grid.innerHTML = '<div class="no-results">No properties found.<br/><small style="font-size:16px;color:var(--text-m)">Try adjusting your filters.</small></div>';
    return;
  }
  hotels.forEach((h, i) => {
    const card = createHotelCard(h, i);
    card.dataset.hotelId = h.id;
    grid.appendChild(card);
  });
  const sortFilter = document.getElementById('sortFilter');
  if (sortFilter) {
    sortFilter.onchange = function() {
      const s = [...hotels];
      if (this.value === 'price-asc') s.sort((a,b)=>a.price-b.price);
      if (this.value === 'price-desc') s.sort((a,b)=>b.price-a.price);
      if (this.value === 'rating') s.sort((a,b)=>b.rating-a.rating);
      grid.innerHTML = '';
      s.forEach((h,i) => { const card = createHotelCard(h,i); card.dataset.hotelId = h.id; grid.appendChild(card); });
      if (currentUser) updateAllBookingBadges();
    };
  }
  if (currentUser) updateAllBookingBadges();
}

function createHotelCard(hotel, delay=0) {
  const card = document.createElement('div');
  card.className = 'hotel-card';
  card.style.cssText = `animation:fadeUp 0.5s ease ${delay*0.07}s both`;
  const stars = '★'.repeat(hotel.stars)+'☆'.repeat(5-hotel.stars);
  const imageUrl = hotel.imageUrl || HOTEL_COVERS[hotel.name] || '';
  card.innerHTML = `
    <div class="hotel-card-img" style="${imageUrl ? `background:url('${imageUrl}') center/cover` : `background:linear-gradient(135deg,${hotel.color},#1a1a10)`}">
      <div class="hotel-card-img-inner" style="${imageUrl ? 'opacity:0' : ''}">${hotel.initial}</div>
      <div class="hotel-badge">${hotel.stars} ★</div>
      <button class="hotel-view-photos">📷 View Photos</button>
    </div>
    <div class="hotel-card-body">
      <div class="hotel-card-name">${hotel.name}</div>
      <div class="hotel-card-location"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ${hotel.city}, ${hotel.country}</div>
      <div class="hotel-card-desc">${hotel.desc}</div>
      <div class="hotel-card-amenities">${hotel.amenities.slice(0,4).map(a=>`<span class="amenity-tag">${a}</span>`).join('')}</div>
      <div class="hotel-card-footer">
        <div><span class="price-from">from</span><span class="price-num">$${hotel.price}</span><span class="price-per">/night</span></div>
        <div style="text-align:right"><span class="stars">${stars}</span><span class="rating-count">${hotel.rating} (${hotel.reviews.toLocaleString()})</span></div>
      </div>
      <button class="hotel-book-btn">Reserve Now</button>
    </div>`;
  const viewPhotosBtn = card.querySelector('.hotel-view-photos');
  if (viewPhotosBtn) viewPhotosBtn.addEventListener('click', e => { e.stopPropagation(); openGallery(hotel); });
  const imgInner = card.querySelector('.hotel-card-img-inner');
  if (imgInner) imgInner.addEventListener('click', () => openGallery(hotel));
  const bookBtn = card.querySelector('.hotel-book-btn');
  if (bookBtn) {
    bookBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentUser) openBookingModal(hotel);
      else showSideSigninTip(bookBtn, hotel);
    });
  }
  return card;
}

document.querySelectorAll('.featured-card').forEach(card => {
  card.addEventListener('click', () => {
    const dest = card.dataset.dest;
    if (dest) {
      document.getElementById('s-location').value = dest;
      renderResults(filterHotels(dest,1,0,'any'), dest, 1, 0, 'any');
      showPage('results');
    }
  });
});

/* ══════════ GALLERY MODAL (unchanged) ══════════ */
let galHotel = null, galTab = 'hotel', galIndex = 0;
const galleryModal = document.getElementById('galleryModal');
const galleryBackdrop = document.getElementById('galleryBackdrop');
const galleryClose = document.getElementById('galleryClose');
const galImgInner = document.getElementById('galImgInner');
const galImgLabel = document.getElementById('galImgLabel');
const galleryThumbs = document.getElementById('galleryThumbs');
const galPrev = document.getElementById('galPrev');
const galNext = document.getElementById('galNext');

function openGallery(hotel) {
  if (!hotel) return;
  galHotel = hotel; galTab = 'hotel'; galIndex = 0;
  document.getElementById('galleryHotelName').textContent = hotel.name;
  document.getElementById('galleryHotelLoc').textContent = `${hotel.city}, ${hotel.country}`;
  document.getElementById('galPrice').textContent = `$${hotel.price}`;
  document.querySelectorAll('.gtab').forEach(t => t.classList.remove('active'));
  const activeTab = document.querySelector('.gtab[data-tab="hotel"]');
  if (activeTab) activeTab.classList.add('active');
  renderGallery();
  if (galleryModal) galleryModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  const galBookBtn = document.getElementById('galBookBtn');
  if (galBookBtn) {
    galBookBtn.onclick = () => {
      if (currentUser) { closeGallery(); setTimeout(() => openBookingModal(hotel), 200); }
      else showSideSigninTip(galBookBtn, hotel);
    };
  }
}
function renderGallery() {
  if (!galHotel || !galHotel.photos) return;
  const photos = galHotel.photos[galTab];
  if (!photos || !photos.length) return;
  renderMainPhoto(photos[galIndex]);
  renderThumbs(photos);
}
function renderMainPhoto(photo) {
  if (!photo) return;
  const imgUrl = photo.url || (galHotel?.imageUrl || '');
  if (imgUrl) {
    galImgInner.style.background = `url('${imgUrl}') center/cover no-repeat`;
    galImgInner.textContent = '';
  } else {
    galImgInner.style.background = photo.gradient || `linear-gradient(135deg,${galHotel.color},#0a0805)`;
    galImgInner.textContent = photo.initial || galHotel.initial;
    galImgInner.style.cssText += '; font-size:72px; font-family:"Cormorant Garamond",serif; letter-spacing:6px; color:rgba(201,169,110,0.18);';
  }
  galImgLabel.textContent = photo.label;
  galImgInner.style.opacity = '0';
  requestAnimationFrame(() => { galImgInner.style.transition = 'opacity 0.3s'; galImgInner.style.opacity = '1'; });
}
function renderThumbs(photos) {
  galleryThumbs.innerHTML = '';
  photos.forEach((p, i) => {
    const t = document.createElement('div');
    t.className = 'gallery-thumb' + (i === galIndex ? ' active' : '');
    const imgUrl = p.url || (i === 0 && galHotel?.imageUrl ? galHotel.imageUrl : '');
    if (imgUrl) t.style.background = `url('${imgUrl}') center/cover`;
    else { t.style.background = p.gradient || p.color || '#1a1208'; t.textContent = p.label.slice(0,2); t.style.cssText += '; font-size:10px; color:rgba(201,169,110,0.4); text-transform:uppercase;'; }
    t.title = p.label;
    t.addEventListener('click', () => { galIndex = i; renderGallery(); });
    galleryThumbs.appendChild(t);
  });
}
if (galPrev) galPrev.addEventListener('click', () => { const photos = galHotel?.photos[galTab]; if (photos) { galIndex = (galIndex-1+photos.length)%photos.length; renderGallery(); } });
if (galNext) galNext.addEventListener('click', () => { const photos = galHotel?.photos[galTab]; if (photos) { galIndex = (galIndex+1)%photos.length; renderGallery(); } });
document.addEventListener('keydown', e => { if (!galleryModal?.classList.contains('open')) return; if (e.key==='ArrowRight') galNext?.click(); if (e.key==='ArrowLeft') galPrev?.click(); if (e.key==='Escape') closeGallery(); });
document.querySelectorAll('.gtab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.gtab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    galTab = btn.dataset.tab;
    galIndex = 0;
    renderGallery();
  });
});
if (galleryClose) galleryClose.addEventListener('click', closeGallery);
if (galleryBackdrop) galleryBackdrop.addEventListener('click', closeGallery);
function closeGallery() { if (galleryModal) galleryModal.classList.remove('open'); document.body.style.overflow = ''; const tip = document.getElementById('signinTip'); if(tip) tip.remove(); }

/* ══════════ BOOKING MODAL & BOOKINGS SYNC ══════════ */
const bookingModal = document.getElementById('bookingModal');
const bookingBackdrop = document.getElementById('bookingBackdrop');
let _currentBookingHotel = null;
let userBookings = [];

// تحديث المستخدم الحالي
function refreshCurrentUser() {
  currentUser = JSON.parse(localStorage.getItem('aurum-user') || 'null');
  return currentUser;
}

// جلب الحجوزات
async function fetchUserBookings() {
  refreshCurrentUser();
  if (!currentUser) return [];

  const token = localStorage.getItem('aurum-token');
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE}/bookings/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 401) {
      localStorage.removeItem('aurum-token');
      localStorage.removeItem('aurum-user');
      currentUser = null;
      updateNav();
      showToast('Session expired. Please sign in again.', 'error');
      return [];
    }

    const data = await res.json();
    userBookings = data.success && Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error('Error fetching bookings:', err);
    userBookings = [];
  }
}

// حالة الحجز
function getHotelBookingStatus(hotelId) {
  if (!userBookings || !userBookings.length) return null;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const booking = userBookings.find(b => b.hotel_id === hotelId && b.status !== 'cancelled');
  if (!booking) return null;

  const checkIn = new Date(booking.check_in + 'T00:00:00Z');
  const checkOut = new Date(booking.check_out + 'T00:00:00Z');

  if (checkOut < today) return { text: 'Completed', class: 'completed' };
  if (checkIn <= today && checkOut >= today) {
    const nightsLeft = Math.round((checkOut - today) / (1000 * 3600 * 24));
    return { text: `Current stay · ${nightsLeft} night${nightsLeft !== 1 ? 's' : ''} left`, class: 'current' };
  }
  if (checkIn > today) {
    const daysLeft = Math.round((checkIn - today) / (1000 * 3600 * 24));
    return { text: `Booked · starts in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`, class: 'upcoming' };
  }
  return { text: 'Completed', class: 'completed' };
}

// تحديث الـ Badges
async function updateAllBookingBadges() {
  if (!currentUser) return;
  await fetchUserBookings();

  document.querySelectorAll('.hotel-card').forEach(card => {
    const hotelId = parseInt(card.dataset.hotelId);
    if (!hotelId) return;

    const status = getHotelBookingStatus(hotelId);
    const existingBadge = card.querySelector('.hotel-booked-badge');
    const bookBtn = card.querySelector('.hotel-book-btn');

    if (status) {
      if (!existingBadge) {
        const badge = document.createElement('div');
        badge.className = `hotel-booked-badge ${status.class}`;
        badge.textContent = status.text;
        card.querySelector('.hotel-card-img')?.appendChild(badge);
      } else {
        existingBadge.textContent = status.text;
        existingBadge.className = `hotel-booked-badge ${status.class}`;
      }
      if (bookBtn) bookBtn.textContent = 'View My Stay';
    } else {
      if (existingBadge) existingBadge.remove();
      if (bookBtn) bookBtn.textContent = 'Reserve Now';
    }
  });
}

// فتح نافذة الحجز
function openBookingModal(hotel) {
  refreshCurrentUser();

  if (!currentUser) {
    showSideSigninTip(document.body, hotel, 'Please sign in to make a booking');
    return;
  }

  _currentBookingHotel = hotel;

  document.getElementById('modalHotelName').textContent = hotel.name;
  document.getElementById('modalHotelLoc').textContent = `${hotel.city}, ${hotel.country}`;
  document.getElementById('summaryRate').textContent = `$${hotel.price}/night`;

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);

  document.getElementById('bookingCheckin').value = tomorrow.toISOString().split('T')[0];
  document.getElementById('bookingCheckout').value = nextWeek.toISOString().split('T')[0];

  updateSummary(hotel.price);

  document.getElementById('paymentSection')?.classList.add('hidden');

  bookingModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

// دالة الدفع الرئيسية (الأهم)
const payConfirm = document.getElementById('payConfirmBtn');
if (payConfirm) {
  payConfirm.addEventListener('click', async () => {
    refreshCurrentUser();

    if (!currentUser) {
      showToast('Please sign in first', 'error');
      return;
    }

    const name = document.getElementById('payName')?.value.trim() || '';
    const number = document.getElementById('payNumber')?.value.replace(/\s/g, '') || '';
    const exp = document.getElementById('payExp')?.value.trim() || '';
    const cvc = document.getElementById('payCvc')?.value.trim() || '';

    if (!name || !number || !exp || !cvc) {
      showToast('Please complete payment details', 'error');
      return;
    }

    const cin = document.getElementById('bookingCheckin')?.value;
    const cout = document.getElementById('bookingCheckout')?.value;
    const rooms = parseInt(document.getElementById('bookingRooms')?.value) || 1;

    if (!cin || !cout || !_currentBookingHotel) {
      showToast('Missing booking details', 'error');
      return;
    }

    const token = localStorage.getItem('aurum-token');
    if (!token) {
      showToast('Please sign in first', 'error');
      return;
    }

    payConfirm.disabled = true;
    payConfirm.textContent = 'Processing...';

    try {
      const nights = Math.round((new Date(cout) - new Date(cin)) / 86400000);
      const last4 = number.slice(-4);
      const totalPrice = _currentBookingHotel.price * nights * rooms;
      const roomType = document.getElementById('bookingRoomType')?.value || 'Deluxe Room';

      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelId: _currentBookingHotel.id,
          roomType,
          rooms,
          guests: rooms * 2,
          checkIn: cin,
          checkOut: cout,
          pricePerNight: _currentBookingHotel.price,
          paymentMethod: 'card',
          paymentLast4: last4,
          guestName: currentUser?.name || name,
          guestEmail: currentUser?.email || '',
        })
      });

      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Booking failed');

      closeBooking();
      showToast(`✔ Booking Confirmed! Total: $${totalPrice.toLocaleString()}`, 'success');

      await fetchUserBookings();
      await updateAllBookingBadges();

    } catch (err) {
      showToast(err.message || 'Booking failed', 'error');
    } finally {
      payConfirm.disabled = false;
      payConfirm.textContent = 'Pay & Confirm';
    }
  });
}

// الدوال المساعدة
function updateSummary(rate) {
  const cin = document.getElementById('bookingCheckin')?.value;
  const cout = document.getElementById('bookingCheckout')?.value;
  const rooms = parseInt(document.getElementById('bookingRooms')?.value) || 1;
  if (cin && cout && new Date(cout) > new Date(cin)) {
    const nights = Math.round((new Date(cout) - new Date(cin)) / 86400000);
    document.getElementById('summaryNights').textContent = nights;
    document.getElementById('summaryTotal').textContent = '$' + (nights * rate * rooms).toLocaleString();
  }
}

document.getElementById('bookingClose')?.addEventListener('click', closeBooking);
bookingBackdrop?.addEventListener('click', closeBooking);

function closeBooking() {
  if (bookingModal) bookingModal.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('confirmBooking')?.addEventListener('click', () => {
  if (!document.getElementById('bookingCheckin')?.value || !document.getElementById('bookingCheckout')?.value) {
    showToast('Please select dates', 'error');
    return;
  }
  const ps = document.getElementById('paymentSection');
  if (ps?.classList.contains('hidden')) {
    ps.classList.remove('hidden');
    setTimeout(() => document.getElementById('payName')?.focus(), 120);
  } else {
    document.getElementById('payConfirmBtn')?.click();
  }
});

// ================== PAYMENT & CONFIRM BOOKING ==================
const payConfirm = document.getElementById('payConfirmBtn');
if (payConfirm) {
  payConfirm.addEventListener('click', async () => {
    const name = document.getElementById('payName')?.value.trim() || '';
    const number = document.getElementById('payNumber')?.value.replace(/\s/g, '') || '';
    const exp = document.getElementById('payExp')?.value.trim() || '';
    const cvc = document.getElementById('payCvc')?.value.trim() || '';

    if (!name || !number || !exp || !cvc) {
      showToast('Please complete payment details', 'error');
      return;
    }

    const cin = document.getElementById('bookingCheckin')?.value;
    const cout = document.getElementById('bookingCheckout')?.value;
    const rooms = parseInt(document.getElementById('bookingRooms')?.value) || 1;

    if (!cin || !cout || !_currentBookingHotel) {
      showToast('Missing booking details', 'error');
      return;
    }

    const token = localStorage.getItem('aurum-token');
    if (!token) {
      showToast('Please sign in first', 'error');
      return;
    }

    payConfirm.disabled = true;
    payConfirm.textContent = 'Processing...';

    try {
      const nights = Math.round((new Date(cout) - new Date(cin)) / 86400000);
      const last4 = number.slice(-4);
      const totalPrice = _currentBookingHotel.price * nights * rooms;
      const roomType = document.getElementById('bookingRoomType')?.value || 'Deluxe Room';

      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelId: _currentBookingHotel.id,
          roomType,
          rooms,
          guests: rooms * 2,
          checkIn: cin,
          checkOut: cout,
          pricePerNight: _currentBookingHotel.price,
          paymentMethod: 'card',
          paymentLast4: last4,
          guestName: currentUser?.name || name,
          guestEmail: currentUser?.email || '',
        })
      });

      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Booking failed');

      closeBooking();
      showToast(`✔ Booking Confirmed! Total: $${totalPrice.toLocaleString()}`, 'success');

      await fetchUserBookings();
      await updateAllBookingBadges();
      checkUpcomingBookings();

      setTimeout(() => {
        const t = document.createElement('div');
        t.textContent = '→ VIEW MY RESERVATIONS';
        t.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:9999;background:var(--gold);color:#000;padding:12px 20px;font-size:13px;cursor:pointer;border-radius:6px;font-weight:600;';
        t.onclick = () => window.location.href = 'reservations.html';
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 6000);
      }, 800);

    } catch (err) {
      console.error(err);
      showToast(err.message || 'An error occurred during booking', 'error');
    } finally {
      payConfirm.disabled = false;
      payConfirm.textContent = 'Pay & Confirm';
    }
  });
}

// ================== HELPER FUNCTIONS ==================
function updateSummary(rate) {
  const cin = document.getElementById('bookingCheckin')?.value;
  const cout = document.getElementById('bookingCheckout')?.value;
  const rooms = parseInt(document.getElementById('bookingRooms')?.value) || 1;
  if (cin && cout && new Date(cout) > new Date(cin)) {
    const nights = Math.round((new Date(cout) - new Date(cin)) / 86400000);
    const nightsSpan = document.getElementById('summaryNights');
    const totalSpan = document.getElementById('summaryTotal');
    if (nightsSpan) nightsSpan.textContent = nights;
    if (totalSpan) totalSpan.textContent = '$' + (nights * rate * rooms).toLocaleString();
  }
}

document.getElementById('bookingClose')?.addEventListener('click', closeBooking);
bookingBackdrop?.addEventListener('click', closeBooking);

function closeBooking() {
  if (bookingModal) bookingModal.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('confirmBooking')?.addEventListener('click', () => {
  if (!document.getElementById('bookingCheckin')?.value || !document.getElementById('bookingCheckout')?.value) {
    showToast('Please select dates', 'error');
    return;
  }
  const ps = document.getElementById('paymentSection');
  if (ps?.classList.contains('hidden')) {
    ps.classList.remove('hidden');
    setTimeout(() => document.getElementById('payName')?.focus(), 120);
    return;
  }
  document.getElementById('payConfirmBtn')?.click();
});
/* ══════════ AI CONCIERGE (مختصر) ══════════ */
const aiModal = document.getElementById('aiModal');
const aiMessages = document.getElementById('aiMessages');
const aiInput = document.getElementById('aiInput');
function getChatStorageKey() { const u = JSON.parse(localStorage.getItem('aurum-user')||'null'); return u?.email ? `aurum-chat-${u.email}` : 'aurum-chat-temp'; }
function loadChatHistory() {
  const key = getChatStorageKey();
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      window._aiHistory = JSON.parse(saved);
      aiMessages.innerHTML = '';
      window._aiHistory.forEach(turn => {
        const div = document.createElement('div');
        div.className = `ai-msg ai-msg--${turn.role==='user'?'user':'bot'}`;
        div.innerHTML = `<div class="ai-msg-avatar">${turn.role==='user'?'✦':'A'}</div><div class="ai-msg-bubble">${turn.content}</div>`;
        aiMessages.appendChild(div);
      });
      aiMessages.scrollTop = aiMessages.scrollHeight;
    } else {
      aiMessages.innerHTML = '<div class="ai-msg ai-msg--bot"><div class="ai-msg-avatar">A</div><div class="ai-msg-bubble">Welcome to AURUM. I\'m your concierge. Where are you dreaming of going?</div></div>';
      window._aiHistory = [{role:'assistant', content:'Welcome to AURUM. I\'m your concierge. Where are you dreaming of going?'}];
    }
  } catch(e) { window._aiHistory = []; }
}
function saveChatHistory() { try { localStorage.setItem(getChatStorageKey(), JSON.stringify(window._aiHistory)); } catch(e){} }
function appendMsg(text, role) {
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg--${role}`;
  div.innerHTML = `<div class="ai-msg-avatar">${role==='user'?'✦':'A'}</div><div class="ai-msg-bubble">${text}</div>`;
  aiMessages.appendChild(div);
  aiMessages.scrollTop = aiMessages.scrollHeight;
  return div;
}
function executeAiAction(action) {
  if (!action) return;
  switch(action.action) {
    case 'SEARCH':
      const city = action.params?.city;
      if(city) { document.getElementById('s-location').value = city; document.getElementById('searchBtn').click(); }
      else showToast('Please specify a city.','error');
      break;
    case 'BOOK':
      const hotelName = action.params?.hotelName;
      if(hotelName) {
        const hotel = hotelDatabase.find(h => h.name.toLowerCase().includes(hotelName.toLowerCase()));
        if(hotel) openBookingModal(hotel);
        else showToast(`Hotel "${hotelName}" not found`,'error');
      } else showToast('Please specify a hotel name.','error');
      break;
    case 'GO_RESERVATIONS': window.location.href='reservations.html'; break;
    case 'GO_HOME': showPage('home'); break;
    default: console.warn('Unknown action', action);
  }
}
async function sendAI() {
  const text = aiInput.value.trim();
  if (!text) return;
  appendMsg(text, 'user');
  aiInput.value = '';
  const typing = appendMsg('', 'bot');
  typing.classList.add('ai-typing');
  if(!window._aiHistory) window._aiHistory = [];
  try {
    const response = await fetch(`${API_BASE}/ai/concierge`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify({ message: text, history: window._aiHistory }) });
    const data = await response.json();
    typing.classList.remove('ai-typing');
    if(data.success) {
      let reply = data.data.response || data.data.reply || data.data.message || '';
      typing.querySelector('.ai-msg-bubble').innerHTML = reply;
      window._aiHistory.push({role:'user', content:text});
      window._aiHistory.push({role:'assistant', content:reply});
      if(window._aiHistory.length>32) window._aiHistory = window._aiHistory.slice(-32);
      saveChatHistory();
      if(data.data.action) executeAiAction(data.data.action);
    } else typing.querySelector('.ai-msg-bubble').innerHTML = 'AI service unavailable.';
  } catch(err) {
    typing.classList.remove('ai-typing');
    typing.querySelector('.ai-msg-bubble').innerHTML = 'Connection error.';
  }
  aiMessages.scrollTop = aiMessages.scrollHeight;
}
document.getElementById('aiSend')?.addEventListener('click', sendAI);
aiInput?.addEventListener('keypress', e => { if(e.key==='Enter') sendAI(); });
document.getElementById('openAiChat')?.addEventListener('click', () => { if (aiModal) aiModal.classList.add('open'); setTimeout(()=>aiInput?.focus(),100); loadChatHistory(); });
document.getElementById('aiFab')?.addEventListener('click', () => { if (aiModal) aiModal.classList.add('open'); setTimeout(()=>aiInput?.focus(),100); loadChatHistory(); });
document.getElementById('aiClose')?.addEventListener('click', () => { if (aiModal) aiModal.classList.remove('open'); });
document.getElementById('aiClear')?.addEventListener('click', () => { if(confirm('Clear chat?')) { window._aiHistory = []; localStorage.removeItem(getChatStorageKey()); loadChatHistory(); } });
// Minimize & dragging
const aiWindow = document.getElementById('aiWindow');
if(aiWindow) {
  const dragHandle = document.getElementById('aiDragHandle');
  let drag = false, startX, startY, startLeft, startTop;
  dragHandle?.addEventListener('mousedown', (e) => {
    if(e.target.closest('button')) return;
    drag = true; startX = e.clientX; startY = e.clientY;
    startLeft = aiWindow.offsetLeft; startTop = aiWindow.offsetTop;
    aiWindow.style.position = 'fixed';
    aiWindow.style.left = startLeft + 'px';
    aiWindow.style.top = startTop + 'px';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if(!drag) return;
    aiWindow.style.left = Math.min(window.innerWidth - aiWindow.offsetWidth, Math.max(0, startLeft + e.clientX - startX)) + 'px';
    aiWindow.style.top = Math.min(window.innerHeight - aiWindow.offsetHeight, Math.max(0, startTop + e.clientY - startY)) + 'px';
  });
  document.addEventListener('mouseup', () => { drag = false; });
  const minBtn = document.getElementById('aiMinimize');
  minBtn?.addEventListener('click', () => aiWindow.classList.toggle('minimized'));
}
// Draggable FAB
let fab = document.getElementById('aiFab');
if(fab) {
  let fabDrag = false, fabStartX, fabStartY, fabLeft, fabTop;
  fab.addEventListener('mousedown', (e) => {
    fabDrag = true; fabStartX = e.clientX; fabStartY = e.clientY;
    const rect = fab.getBoundingClientRect();
    fabLeft = rect.left; fabTop = rect.top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if(!fabDrag) return;
    let newLeft = fabLeft + e.clientX - fabStartX;
    let newTop = fabTop + e.clientY - fabStartY;
    newLeft = Math.max(8, Math.min(window.innerWidth - fab.offsetWidth - 8, newLeft));
    newTop = Math.max(8, Math.min(window.innerHeight - fab.offsetHeight - 8, newTop));
    fab.style.left = newLeft + 'px';
    fab.style.top = newTop + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
  });
  document.addEventListener('mouseup', () => { fabDrag = false; });
}

/* ══════════ UTILITIES & INIT ══════════ */
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' '+type : '');
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.classList.remove('show'), 4000);
}

const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting) { e.target.style.animation='fadeUp 0.6s ease forwards'; obs.unobserve(e.target); } });
}, { threshold:0.1 });
document.querySelectorAll('.featured-card, .why-feat').forEach(el => { if (el) { el.style.opacity='0'; obs.observe(el); } });

window.addEventListener('DOMContentLoaded', () => {
  loadHotels();
  const navToggle = document.getElementById('navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      document.querySelector('.nav-links')?.classList.toggle('mobile-open');
    });
  }
  loadChatHistory();
  if (currentUser) {
    fetchUserBookings().then(() => {
      updateAllBookingBadges();
      checkUpcomingBookings();
    });
  }
  // Payment field validation
  const payName = document.getElementById('payName');
  if (payName) {
    payName.addEventListener('input', function() { this.value = this.value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, ''); });
  }
  const payNumber = document.getElementById('payNumber');
  if (payNumber) {
    payNumber.addEventListener('input', function() {
      let cleaned = this.value.replace(/\D/g, '').substring(0, 16);
      let formatted = '';
      for (let i = 0; i < cleaned.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += cleaned[i];
      }
      this.value = formatted;
    });
  }
  const payExp = document.getElementById('payExp');
  if (payExp) {
    payExp.addEventListener('input', function() {
      let cleaned = this.value.replace(/\D/g, '');
      if (cleaned.length >= 2) {
        let month = cleaned.substring(0, 2);
        let year = cleaned.substring(2, 4);
        if (parseInt(month) > 12) month = '12';
        this.value = month + (year ? '/' + year : '');
      } else {
        this.value = cleaned;
      }
      if (this.value.length > 5) this.value = this.value.slice(0, 5);
    });
  }
  const payCvc = document.getElementById('payCvc');
  if (payCvc) {
    payCvc.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').substring(0, 4);
    });
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  if (pageParam === 'home') {
    showPage('home');
  } else if (pageParam === 'results') {
    showPage('results');
  } else {
    showPage('home');
  }
});

const userRole = JSON.parse(localStorage.getItem('aurum-user') || 'null');
if (userRole && userRole.role === 'owner') {
  const loggedDiv = document.getElementById('navUserLogged');
  if (loggedDiv && !document.querySelector('.nav-btn-dash')) {
    const dashLink = document.createElement('a');
    dashLink.href = 'owner-dashboard.html';
    dashLink.className = 'nav-btn nav-btn-dash';
    dashLink.textContent = 'Dashboard';
    loggedDiv.insertBefore(dashLink, loggedDiv.firstChild);
  }
}
