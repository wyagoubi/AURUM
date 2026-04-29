/* ═══════════════════════════════════════════════
   AURUM — app.js (integrated with backend API)
   MODIFIED: Private chat per user, shared bookings across accounts, added 4 new hotels with rooms & images
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

/* ══════════ CURSOR ══════════ */
// Custom cursor disabled - using default system cursor

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
  if (userEmail) {
    localStorage.removeItem(`aurum-chat-${userEmail}`);
  } else {
    localStorage.removeItem('aurum-chat-temp');
  }
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
    const offset = (navbar && navbar.offsetHeight) ? navbar.offsetHeight + 8 : 0;
    window.scrollTo({ top: offset, behavior: 'smooth' });
  }
  navLinks.forEach(l => { if (l.dataset.page === id) l.classList.add('active'); });
  document.querySelector('.nav-links')?.classList.remove('mobile-open');
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

/* ══════════ HOTEL DATABASE (extended with 4 new hotels + rooms + images) ══════════ */
let hotelDatabase = [];

// Real hotel covers (new ones added)
const HOTEL_COVERS = {
  'Le Grand Aurum Paris':    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
  'Aurum Palace London':     'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
  'Aurum Medina Marrakesh':  'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&q=80',
  'Aurum Sakura Tokyo':      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  'Aurum Overwater Maldives':'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
  'Aurum Summit Aspen':      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
  'Aurum Duomo Florence':    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
  'Aurum Sentosa Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
  // New hotels covers
  'Aurum Royale Dubai':      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80',
  'Aurum Bosphorus Istanbul':'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80',
  'Aurum Riviera Santorini': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
  'Aurum Zen Bali':          'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
};

const HOTEL_GALLERY = {
  'Le Grand Aurum Paris':    ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80','https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=1200&q=80','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80'],
  'Aurum Palace London':     ['https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=1200&q=80','https://images.unsplash.com/photo-1562790351-d273a961e0e9?w=1200&q=80','https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80'],
  'Aurum Medina Marrakesh':  ['https://images.unsplash.com/photo-1590073844006-33379778ae09?w=1200&q=80','https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80','https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80'],
  'Aurum Sakura Tokyo':      ['https://images.unsplash.com/photo-1553855994-dbbf0af09b4c?w=1200&q=80','https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80','https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&q=80'],
  'Aurum Overwater Maldives':['https://images.unsplash.com/photo-1540202404-1b927e27fa8b?w=1200&q=80','https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1200&q=80','https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=1200&q=80'],
  'Aurum Summit Aspen':      ['https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=1200&q=80','https://images.unsplash.com/photo-1562632777-5e0b6e687513?w=1200&q=80','https://images.unsplash.com/photo-1542621334-a254cf47733d?w=1200&q=80'],
  'Aurum Duomo Florence':    ['https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=1200&q=80','https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80','https://images.unsplash.com/photo-1578898886250-b39f1ad40a5f?w=1200&q=80'],
  'Aurum Sentosa Singapore': ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80','https://images.unsplash.com/photo-1540541338537-71637f2ced2b?w=1200&q=80'],
  // New hotel galleries
  'Aurum Royale Dubai':      ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80','https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=1200&q=80','https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80'],
  'Aurum Bosphorus Istanbul':['https://images.unsplash.com/photo-1454518027385-dcb7e548f29d?w=1200&q=80','https://images.unsplash.com/photo-1615873968403-89e06862989f?w=1200&q=80','https://images.unsplash.com/photo-1534351450181-ea9f78427fe8?w=1200&q=80'],
  'Aurum Riviera Santorini': ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80','https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80','https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=1200&q=80'],
  'Aurum Zen Bali':          ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80','https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=1200&q=80','https://images.unsplash.com/photo-1561557958-4c39df35f955?w=1200&q=80'],
};

const ROOM_IMGS = {
  'Deluxe Room':        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
  'Junior Suite':       'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200&q=80',
  'Grand Suite':        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80',
  'Presidential Suite': 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80',
};

const AMENITY_IMGS = [
  'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=1200&q=80',
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
  'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&q=80',
];

function makeRealPhotos(hotelName, initial, color) {
  const cover   = HOTEL_COVERS[hotelName];
  const gallery = HOTEL_GALLERY[hotelName] || [];
  const c1 = color || '#1a1208';
  const galleryLabels = ['Lobby', 'Terrace', 'Courtyard'];
  return {
    hotel: [
      { url: cover || '', gradient:`linear-gradient(135deg,${c1},#2a1f0a)`, label:'Exterior', initial },
      ...gallery.map((url, i) => ({ url, gradient:`linear-gradient(135deg,${c1},#0e0c06)`, label: galleryLabels[i] || 'View', initial })),
    ],
    rooms: Object.entries(ROOM_IMGS).map(([label, url]) => ({ url, gradient:`linear-gradient(135deg,${c1},#0e0c06)`, label, initial })),
    amenities: ['Pool','Spa','Restaurant','Bar & Lounge'].map((label,i) => ({ url: AMENITY_IMGS[i], gradient:`linear-gradient(135deg,${c1},#0e0c06)`, label, initial })),
  };
}

async function loadHotelsFromAPI() {
    try {
        const res = await fetch(`${API_BASE}/hotels`);
        const data = await res.json();
        if (data.success && data.data.length) {
            hotelDatabase = data.data.map(h => ({
              ...h,
              imageUrl: HOTEL_COVERS[h.name] || '',
              maxChildren: 4,
              rooms: 5,
              photos: makeRealPhotos(h.name, h.initial, h.color),
            }));
            window._hotelsData = hotelDatabase;
        } else {
            useLocalHotelDatabase();
        }
    } catch(e) {
        useLocalHotelDatabase();
    }
    renderResults(filterHotels('', 1, 0, 'any'), '', 1, 0, 'any');
}

function useLocalHotelDatabase() {
    hotelDatabase = [
        // Existing 3 hotels
        { id:1, name:'Le Grand Hôtel', city:'Paris', country:'France', stars:5, price:450, rating:4.9, reviews:1284, desc:'Belle Époque grandeur at the heart of Paris...', amenities:['Wi-Fi','Spa','Restaurant','Concierge','Bar'], initial:'LG', color:'#1a1208', maxChildren:4, rooms:3, imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600', photos: makePhotos('LG','#1a1208','#2a1f0a','#180e04') },
        { id:2, name:'Hôtel de Crillon', city:'Paris', country:'France', stars:5, price:980, rating:4.95, reviews:876, desc:'A palatial 18th-century landmark...', amenities:['Wi-Fi','Pool','Spa','Restaurant','Concierge'], initial:'HC', color:'#14100a', maxChildren:2, rooms:5, imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600', photos: makePhotos('HC','#14100a','#201808','#0e0c06') },
        { id:3, name:'Burj Al Arab', city:'Dubai', country:'UAE', stars:5, price:1800, rating:4.85, reviews:2341, desc:'The world\'s most iconic hotel...', amenities:['Pool','Spa','Restaurant','Bar','Transfer','Concierge'], initial:'BA', color:'#0a1218', maxChildren:3, rooms:2, imageUrl: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600', photos: makePhotos('BA','#0a1218','#0d1e2e','#06101a') },
        // NEW HOTELS (4)
        { id:4, name:'Aurum Royale Dubai', city:'Dubai', country:'UAE', stars:5, price:2500, rating:4.9, reviews:345, desc:'Ultra-luxury beachfront resort with gold leaf interiors.', amenities:['Private Beach','Infinity Pool','Butler','Helipad'], initial:'AR', color:'#1a1008', maxChildren:4, rooms:4, imageUrl: HOTEL_COVERS['Aurum Royale Dubai'], photos: makePhotos('AR','#1a1008','#2a1f0a','#0e0c06') },
        { id:5, name:'Aurum Bosphorus Istanbul', city:'Istanbul', country:'Turkey', stars:5, price:1700, rating:4.8, reviews:567, desc:'Ottoman palace turned luxury hotel on the Bosphorus.', amenities:['Hammam','Rooftop Pool','Butler','Yacht Charter'], initial:'AB', color:'#1a1208', maxChildren:2, rooms:3, imageUrl: HOTEL_COVERS['Aurum Bosphorus Istanbul'], photos: makePhotos('AB','#1a1208','#2a1f0a','#0e0c06') },
        { id:6, name:'Aurum Riviera Santorini', city:'Santorini', country:'Greece', stars:5, price:2400, rating:4.95, reviews:432, desc:'Cliffside villas with private plunge pools and sunset views.', amenities:['Infinity Pool','Cave Spa','Butler','Sunset Dining'], initial:'AS', color:'#0e0818', maxChildren:2, rooms:2, imageUrl: HOTEL_COVERS['Aurum Riviera Santorini'], photos: makePhotos('AS','#0e0818','#2a1f0a','#0e0c06') },
        { id:7, name:'Aurum Zen Bali', city:'Bali', country:'Indonesia', stars:5, price:1100, rating:4.88, reviews:789, desc:'Jungle sanctuary with Ayurvedic spa and rice terrace views.', amenities:['Jungle Pool','Ayurvedic Spa','Butler','Temple Tours'], initial:'AZ', color:'#0e1208', maxChildren:3, rooms:3, imageUrl: HOTEL_COVERS['Aurum Zen Bali'], photos: makePhotos('AZ','#0e1208','#2a1f0a','#0e0c06') },
    ];
    window._hotelsData = hotelDatabase;
}
function makePhotos(initial, c1, c2, c3) {
  const imageUrl = (typeof c2 === 'string' && c2.startsWith('http')) ? c2 : '';
  const col2 = imageUrl ? '#2a1f0a' : (c2 || '#2a1f0a');
  const col3 = c3 || '#0e0c06';
  return {
    hotel: [
      { gradient:`linear-gradient(135deg,${c1},${col2})`, label:'Exterior', initial, url: imageUrl },
      { gradient:`linear-gradient(160deg,${col2},${col3})`, label:'Lobby', initial, url: '' },
      { gradient:`linear-gradient(120deg,${c1},${col3})`, label:'Terrace', initial, url: '' },
      { gradient:`linear-gradient(180deg,${col3},${col2})`, label:'Garden / Courtyard', initial, url: '' },
    ],
    rooms: [
      { gradient:`linear-gradient(140deg,${c1},${col3})`, label:'Deluxe Room', initial, url: ROOM_IMGS['Deluxe Room'] || '' },
      { gradient:`linear-gradient(160deg,${col2},${c1})`, label:'Junior Suite', initial, url: ROOM_IMGS['Junior Suite'] || '' },
      { gradient:`linear-gradient(120deg,${col3},${col2})`, label:'Grand Suite', initial, url: ROOM_IMGS['Grand Suite'] || '' },
      { gradient:`linear-gradient(180deg,${c1},${col2})`, label:'Presidential Suite', initial, url: ROOM_IMGS['Presidential Suite'] || '' },
    ],
    amenities: [
      { gradient:`linear-gradient(135deg,${col2},${col3})`, label:'Swimming Pool', initial, url: AMENITY_IMGS[0] },
      { gradient:`linear-gradient(150deg,${c1},${col2})`, label:'Spa & Wellness', initial, url: AMENITY_IMGS[1] },
      { gradient:`linear-gradient(125deg,${col3},${c1})`, label:'Restaurant', initial, url: AMENITY_IMGS[2] },
      { gradient:`linear-gradient(165deg,${col2},${c1})`, label:'Bar & Lounge', initial, url: AMENITY_IMGS[3] },
    ],
  };
}

/* ══════════ CUSTOM SEARCH DROPDOWNS ══════════ */
function initCustomSelect(id, hiddenSelectId) {
  const container = document.getElementById(id);
  const hiddenSel = document.getElementById(hiddenSelectId);
  if (!container || !hiddenSel) return;

  const trigger = container.querySelector('.custom-select-trigger');
  const dropdown = container.querySelector('.custom-select-dropdown');
  const valueSpan = container.querySelector('.custom-select-value');
  const options = container.querySelectorAll('.custom-select-option');

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.custom-select.open').forEach(el => {
      if (el !== container) el.classList.remove('open');
    });
    container.classList.toggle('open');
  });

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      const val = opt.dataset.value;
      const text = opt.textContent;
      hiddenSel.value = val;
      valueSpan.textContent = text;
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      container.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove('open');
    }
  });

  hiddenSel.addEventListener('change', () => syncCustomSelect(container, hiddenSel, options, valueSpan));
}

function syncCustomSelect(container, hiddenSel, options, valueSpan) {
  const val = hiddenSel.value;
  options.forEach(opt => {
    if (opt.dataset.value === val) {
      opt.classList.add('selected');
      valueSpan.textContent = opt.textContent;
    } else {
      opt.classList.remove('selected');
    }
  });
}

initCustomSelect('roomsSelect', 's-rooms');
initCustomSelect('childrenSelect', 's-children');
initCustomSelect('budgetSelect', 's-price');

/* ══════════ SEARCH ══════════ */
document.getElementById('searchBtn').addEventListener('click', () => {
  const location = document.getElementById('s-location').value.trim();
  const rooms    = parseInt(document.getElementById('s-rooms').value);
  const children = parseInt(document.getElementById('s-children').value);
  const price    = document.getElementById('s-price').value;
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
  const grid  = document.getElementById('resultsGrid');
  const title = document.getElementById('resultsTitle');
  const meta  = document.getElementById('resultsMeta');
  const pl    = price === 'any' ? 'Any budget' : price === '1001' ? 'Over $1,000/night' : `Up to $${price}/night`;

  title.innerHTML = `Hotels in <em>${loc || 'All Destinations'}</em>`;
  meta.textContent = `Showing ${hotels.length} propert${hotels.length===1?'y':'ies'} · ${rooms} room${rooms>1?'s':''} · ${children} child${children!==1?'ren':''} · ${pl}`;
  grid.innerHTML = '';

  if (!hotels.length) {
    grid.innerHTML = `<div class="no-results">No properties found.<br/><small style="font-size:16px;color:var(--text-m)">Try adjusting your filters.</small></div>`;
    return;
  }

  hotels.forEach((h, i) => grid.appendChild(createHotelCard(h, i)));

  document.getElementById('sortFilter').onchange = function() {
    const s = [...hotels];
    if (this.value === 'price-asc')  s.sort((a,b)=>a.price-b.price);
    if (this.value === 'price-desc') s.sort((a,b)=>b.price-a.price);
    if (this.value === 'rating')     s.sort((a,b)=>b.rating-a.rating);
    grid.innerHTML = '';
    s.forEach((h,i) => grid.appendChild(createHotelCard(h,i)));
  };
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
      <div class="hotel-card-location">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${hotel.city}, ${hotel.country}
      </div>
      <div class="hotel-card-desc">${hotel.desc}</div>
      <div class="hotel-card-amenities">${hotel.amenities.slice(0,4).map(a=>`<span class="amenity-tag">${a}</span>`).join('')}</div>
      <div class="hotel-card-footer">
        <div>
          <span class="price-from">from</span>
          <span class="price-num">$${hotel.price}</span>
          <span class="price-per">/night</span>
        </div>
        <div style="text-align:right">
          <span class="stars">${stars}</span>
          <span class="rating-count">${hotel.rating} (${hotel.reviews.toLocaleString()})</span>
        </div>
      </div>
      <button class="hotel-book-btn">Reserve Now</button>
    </div>`;

  card.querySelector('.hotel-view-photos').addEventListener('click', e => { e.stopPropagation(); openGallery(hotel); });
  card.querySelector('.hotel-card-img-inner').addEventListener('click', () => openGallery(hotel));
  const bookBtn = card.querySelector('.hotel-book-btn');
  bookBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const curUser = JSON.parse(localStorage.getItem('aurum-user') || 'null');
    if (curUser) {
      openBookingModal(hotel);
    } else {
      showSideSigninTip(bookBtn, hotel);
    }
  });
  return card;
}

/* Featured clicks */
document.querySelectorAll('.featured-card').forEach(card => {
  card.addEventListener('click', () => {
    const dest = card.dataset.dest;
    document.getElementById('s-location').value = dest;
    renderResults(filterHotels(dest,1,0,'any'), dest, 1, 0, 'any');
    showPage('results');
  });
});

/* ══════════ GALLERY MODAL ══════════ */
let galHotel   = null;
let galTab     = 'hotel';
let galIndex   = 0;

const galleryModal   = document.getElementById('galleryModal');
const galleryBackdrop= document.getElementById('galleryBackdrop');
const galleryClose   = document.getElementById('galleryClose');
const galImgInner    = document.getElementById('galImgInner');
const galImgLabel    = document.getElementById('galImgLabel');
const galleryThumbs  = document.getElementById('galleryThumbs');
const galPrev        = document.getElementById('galPrev');
const galNext        = document.getElementById('galNext');

function openGallery(hotel) {
  galHotel = hotel;
  galTab   = 'hotel';
  galIndex = 0;
  document.getElementById('galleryHotelName').textContent = hotel.name;
  document.getElementById('galleryHotelLoc').textContent  = `${hotel.city}, ${hotel.country}`;
  document.getElementById('galPrice').textContent = `$${hotel.price}`;

  document.querySelectorAll('.gtab').forEach(t => t.classList.remove('active'));
  document.querySelector('.gtab[data-tab="hotel"]').classList.add('active');

  renderGallery();
  galleryModal.classList.add('open');
  document.body.style.overflow = 'hidden';

  document.getElementById('galBookBtn').onclick = () => {
    const curUser = JSON.parse(localStorage.getItem('aurum-user') || 'null');
    if (curUser) {
      closeGallery();
      setTimeout(() => openBookingModal(hotel), 200);
    } else {
      const galBtn = document.getElementById('galBookBtn');
      showSideSigninTip(galBtn, hotel);
    }
  };
}

function renderGallery() {
  const photos = galHotel.photos[galTab];
  renderMainPhoto(photos[galIndex]);
  renderThumbs(photos);
}

function renderMainPhoto(photo) {
  const imgUrl = photo.url || (galHotel && galHotel.imageUrl ? galHotel.imageUrl : '');
  if (imgUrl) {
    galImgInner.style.background = `url('${imgUrl}') center/cover no-repeat`;
    galImgInner.textContent = '';
  } else {
    galImgInner.style.background = photo.gradient || `linear-gradient(135deg,${galHotel.color},#0a0805)`;
    galImgInner.textContent = photo.initial || galHotel.initial;
    galImgInner.style.color = 'rgba(201,169,110,0.18)';
    galImgInner.style.fontSize = '72px';
    galImgInner.style.fontFamily = "'Cormorant Garamond',serif";
    galImgInner.style.letterSpacing = '6px';
  }
  galImgLabel.textContent = photo.label;
  galImgInner.style.opacity = '0';
  requestAnimationFrame(() => { galImgInner.style.transition='opacity 0.3s'; galImgInner.style.opacity='1'; });
}
function renderThumbs(photos) {
  galleryThumbs.innerHTML = '';
  photos.forEach((p, i) => {
    const t = document.createElement('div');
    t.className = 'gallery-thumb' + (i === galIndex ? ' active' : '');
    const imgUrl = p.url || (i === 0 && galHotel && galHotel.imageUrl ? galHotel.imageUrl : '');
    if (imgUrl) {
      t.style.cssText = `background:url('${imgUrl}') center/cover;`;
    } else {
      t.style.cssText = `background:${p.gradient || p.color || '#1a1208'};font-size:10px;color:rgba(201,169,110,0.4);letter-spacing:1px;text-transform:uppercase;`;
      t.textContent = p.label.slice(0,2);
    }
    t.title = p.label;
    t.addEventListener('click', () => { galIndex = i; renderGallery(); });
    galleryThumbs.appendChild(t);
  });
}

galPrev.addEventListener('click', () => {
  const photos = galHotel.photos[galTab];
  galIndex = (galIndex - 1 + photos.length) % photos.length;
  renderGallery();
});
galNext.addEventListener('click', () => {
  const photos = galHotel.photos[galTab];
  galIndex = (galIndex + 1) % photos.length;
  renderGallery();
});

document.addEventListener('keydown', e => {
  if (!galleryModal.classList.contains('open')) return;
  if (e.key === 'ArrowRight') galNext.click();
  if (e.key === 'ArrowLeft')  galPrev.click();
  if (e.key === 'Escape')     closeGallery();
});

document.querySelectorAll('.gtab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.gtab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    galTab  = btn.dataset.tab;
    galIndex= 0;
    renderGallery();
  });
});

galleryClose.addEventListener('click', closeGallery);
galleryBackdrop.addEventListener('click', closeGallery);

function closeGallery() {
  galleryModal.classList.remove('open');
  document.body.style.overflow = '';
  const existing = document.getElementById('signinTip');
  if (existing) { existing.classList.remove('show'); setTimeout(() => { try { existing.remove(); } catch(e){} }, 220); }
}

/* ══════════ BOOKING MODAL (SAVES TO SHARED BOOKINGS) ══════════ */
const bookingModal   = document.getElementById('bookingModal');
const bookingBackdrop= document.getElementById('bookingBackdrop');

// Helper: Get all shared bookings (across all users)
function getAllSharedBookings() {
  try {
    return JSON.parse(localStorage.getItem('aurum-shared-bookings') || '[]');
  } catch { return []; }
}
function saveSharedBookings(bookings) {
  localStorage.setItem('aurum-shared-bookings', JSON.stringify(bookings));
}
function addSharedBooking(newBooking) {
  const bookings = getAllSharedBookings();
  // Check for duplicate (same hotel and overlapping dates)
  const isDuplicate = bookings.some(b => b.hotelId === newBooking.hotelId &&
    ((newBooking.checkIn >= b.checkIn && newBooking.checkIn < b.checkOut) ||
     (newBooking.checkOut > b.checkIn && newBooking.checkOut <= b.checkOut) ||
     (newBooking.checkIn <= b.checkIn && newBooking.checkOut >= b.checkOut)));
  if (isDuplicate) {
    showToast('This hotel is already booked for these dates.', 'error');
    return false;
  }
  bookings.push(newBooking);
  saveSharedBookings(bookings);
  return true;
}

function openBookingModal(hotel) {
  const curUser = JSON.parse(localStorage.getItem('aurum-user') || 'null');
  if (!curUser) {
    showSideSigninTip(document.querySelector('.gallery-window .btn-gold') || document.body, hotel);
    return;
  }
  document.getElementById('modalHotelName').textContent = hotel.name;
  document.getElementById('modalHotelLoc').textContent  = `${hotel.city}, ${hotel.country}`;
  document.getElementById('summaryRate').textContent    = `$${hotel.price}/night`;

  const today    = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate()+7);
  const toISO = d => d.toISOString().split('T')[0];
  document.getElementById('bookingCheckin').value  = toISO(tomorrow);
  document.getElementById('bookingCheckout').value = toISO(nextWeek);

  updateSummary(hotel.price);
  _currentBookingHotel = hotel;
  const paySection = document.getElementById('paymentSection'); if (paySection) paySection.classList.add('hidden');
  bookingModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function showSideSigninTip(button, hotel, msg) {
  const existing = document.getElementById('signinTip');
  if (existing) existing.remove();

  const message = msg || 'Please sign in to continue your reservation';

  const tip = document.createElement('div');
  tip.id = 'signinTip';
  tip.className = 'signin-tip signin-tip--alert';
  tip.innerHTML = `<div class="signin-tip-body"><div class="signin-tip-msg">${message}</div></div>`;
  document.body.appendChild(tip);

  const rect = button.getBoundingClientRect();
  const preferOffset = 20;
  tip.style.position = 'absolute';
  tip.style.zIndex = 9999;
  const tipRect = tip.getBoundingClientRect();
  const spaceRight = window.innerWidth - rect.right;
  let left;
  if (spaceRight > tipRect.width + preferOffset) {
    left = window.scrollX + rect.right + preferOffset;
  } else {
    left = Math.max(12, window.scrollX + rect.left - tipRect.width - preferOffset);
  }
  const rawTop = window.scrollY + rect.top + (rect.height - tipRect.height) / 2;
  const minTop = window.scrollY + 12;
  const maxTop = window.scrollY + window.innerHeight - tipRect.height - 12;
  const top = Math.min(maxTop, Math.max(minTop, rawTop));
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;

  requestAnimationFrame(() => { tip.classList.add('show'); });

  tip.style.cursor = 'pointer';
  const onClickTip = () => { window.location.href = 'auth.html'; };
  tip.addEventListener('click', onClickTip);

  let dismissTimer = setTimeout(() => cleanupTip(), 1500);
  function onScroll() { cleanupTip(); }
  function onResize() { repositionTip(); }

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onResize);

  function cleanupTip() {
    if (!tip || !tip.parentNode) return;
    tip.classList.remove('show');
    setTimeout(() => { try { tip.remove(); } catch(e){} }, 220);
    clearTimeout(dismissTimer);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    tip.removeEventListener('click', onClickTip);
  }

  function repositionTip() {
    if (!tip || !tip.parentNode) return;
    const rect = button.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const preferOffset = 20;
    const spaceRight = window.innerWidth - rect.right;
    let left;
    if (spaceRight > tipRect.width + preferOffset) {
      left = window.scrollX + rect.right + preferOffset;
    } else {
      left = Math.max(12, window.scrollX + rect.left - tipRect.width - preferOffset);
    }
    const rawTop = window.scrollY + rect.top + (rect.height - tipRect.height) / 2;
    const minTop = window.scrollY + 12;
    const maxTop = window.scrollY + window.innerHeight - tipRect.height - 12;
    const top = Math.min(maxTop, Math.max(minTop, rawTop));
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }
}

function openInlineSignin(onSuccess) {
  if (document.getElementById('inlineSignin')) return;
  const overlay = document.createElement('div');
  overlay.id = 'inlineSignin';
  overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display = 'flex';
  overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.zIndex = 10000;
  overlay.style.background = 'rgba(0,0,0,0.45)';

  overlay.innerHTML = `
    <div style="width:360px;max-width:92%;padding:20px;background:var(--bg2);border:1px solid var(--border);box-shadow:var(--shadow);">
      <h3 style="margin:0 0 8px;color:var(--white);font-family:'Cormorant Garamond',serif;">Sign In</h3>
      <p style="margin:0 0 12px;color:var(--text-m);font-size:13px;">Enter your name to sign in and continue.</p>
      <input id="inlineName" placeholder="Full name" style="width:100%;padding:10px;margin-bottom:8px;border:1px solid var(--border-s);background:var(--bg3);color:var(--text);outline:none;" />
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button id="inlineCancel" class="btn-outline">Cancel</button>
        <button id="inlineSubmit" class="btn-gold">Sign In</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('inlineCancel').addEventListener('click', () => overlay.remove());
  document.getElementById('inlineSubmit').addEventListener('click', () => {
    const name = document.getElementById('inlineName').value.trim();
    if (!name) { showToast('Please enter your name to sign in.', 'error'); return; }
    const initials = name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() || 'AU';
    const user = { name, initials };
    localStorage.setItem('aurum-user', JSON.stringify(user));
    try { navUser.style.display = 'none'; navUserLogged.classList.remove('hidden'); navAvatar.textContent = initials; navUsername.textContent = name.split(' ')[0]; } catch(e){}
    overlay.remove();
    showToast('Signed in — continuing reservation.');
    if (typeof onSuccess === 'function') onSuccess();
  });
}

function updateSummary(rate) {
  const cin   = new Date(document.getElementById('bookingCheckin').value);
  const cout  = new Date(document.getElementById('bookingCheckout').value);
  const rooms = parseInt(document.getElementById('bookingRooms').value) || 1;
  if (cin && cout && cout > cin) {
    const nights = Math.round((cout-cin)/(1000*60*60*24));
    document.getElementById('summaryNights').textContent = nights;
    document.getElementById('summaryTotal').textContent  = '$' + (nights*rate*rooms).toLocaleString();
  }
}

document.getElementById('bookingClose').addEventListener('click', closeBooking);
bookingBackdrop.addEventListener('click', closeBooking);
function closeBooking() { bookingModal.classList.remove('open'); document.body.style.overflow=''; }

['bookingCheckin','bookingCheckout','bookingRooms'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    const r = parseFloat(document.getElementById('summaryRate').textContent.replace(/[^0-9.]/g,''));
    updateSummary(r);
  });
});

let _currentBookingHotel = null;

document.getElementById('confirmBooking').addEventListener('click', () => {
  const cin  = document.getElementById('bookingCheckin').value;
  const cout = document.getElementById('bookingCheckout').value;
  if (!cin || !cout) { showToast('Please select dates.','error'); return; }
  const paySection = document.getElementById('paymentSection');
  if (paySection && paySection.classList.contains('hidden')) {
    paySection.classList.remove('hidden');
    setTimeout(() => { document.getElementById('payName')?.focus(); }, 120);
    return;
  }
  // Trigger payment confirmation button
  document.getElementById('payConfirmBtn')?.click();
});

const payConfirm = document.getElementById('payConfirmBtn');
if (payConfirm) {
  payConfirm.addEventListener('click', async () => {
    const name   = document.getElementById('payName')?.value.trim() || '';
    const number = document.getElementById('payNumber')?.value.replace(/\s+/g,'') || '';
    const exp    = document.getElementById('payExp')?.value.trim() || '';
    const cvc    = document.getElementById('payCvc')?.value.trim() || '';
    if (!name || !number || !exp || !cvc) { showToast('Please complete payment details.','error'); return; }

    const cin   = document.getElementById('bookingCheckin')?.value;
    const cout  = document.getElementById('bookingCheckout')?.value;
    const rooms = parseInt(document.getElementById('bookingRooms')?.value) || 1;
    const curUser = JSON.parse(localStorage.getItem('aurum-user') || 'null');

    if (!cin || !cout || !_currentBookingHotel) {
      showToast('Missing booking details. Please try again.','error'); return;
    }

    payConfirm.disabled = true; payConfirm.textContent = 'Processing…';

    try {
      const checkIn  = new Date(cin);
      const checkOut = new Date(cout);
      const nights   = Math.round((checkOut - checkIn) / (1000*60*60*24));
      const last4    = number.slice(-4);
      const totalPrice = _currentBookingHotel.price * nights * rooms;
      const roomType = document.getElementById('bookingRoomType')?.value || 'Deluxe Room';

      // ── Save to backend API ──
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          hotelId:       _currentBookingHotel.id,
          roomType:      roomType,
          rooms:         rooms,
          guests:        rooms * 2,
          checkIn:       cin,
          checkOut:      cout,
          pricePerNight: _currentBookingHotel.price,
          paymentMethod: 'card',
          paymentLast4:  last4,
          guestName:     curUser?.name || name,
          guestEmail:    curUser?.email || '',
        })
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Booking failed. Please try again.', 'error');
        payConfirm.disabled = false; payConfirm.textContent = 'Pay & Confirm';
        return;
      }

      closeBooking();
      showToast(`✔ Confirmed! Total: $${totalPrice.toLocaleString()} — View in My Reservations`, 'success');
      setTimeout(() => {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:9999;background:var(--gold,#c9a96e);color:#000;padding:10px 18px;font-size:11px;letter-spacing:1px;cursor:pointer;border-radius:4px;';
        t.textContent = '→ VIEW MY RESERVATIONS';
        t.onclick = () => { window.location.href = 'reservations.html'; };
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 5000);
      }, 500);
      payConfirm.disabled = false; payConfirm.textContent = 'Pay & Confirm';
    } catch(err) {
      payConfirm.disabled = false; payConfirm.textContent = 'Pay & Confirm';
      showToast('Connection error. Please try again.', 'error');
      console.error('[booking]', err);
    }
  });
}

/* ══════════ AI CONCIERGE (with per-user chat history) ══════════ */
const aiModal    = document.getElementById('aiModal');
const aiMessages = document.getElementById('aiMessages');
const aiInput    = document.getElementById('aiInput');

// Get chat storage key based on logged-in user
function getChatStorageKey() {
  const user = JSON.parse(localStorage.getItem('aurum-user') || 'null');
  return user?.email ? `aurum-chat-${user.email}` : 'aurum-chat-temp';
}

// Load chat history for current user
function loadChatHistory() {
  const key = getChatStorageKey();
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      window._aiHistory = JSON.parse(saved) || [];
      // Clear existing messages and restore
      aiMessages.innerHTML = '';
      window._aiHistory.forEach(turn => {
        const div = document.createElement('div');
        div.className = `ai-msg ai-msg--${turn.role === 'user' ? 'user' : 'bot'}`;
        div.innerHTML = `<div class="ai-msg-avatar">${turn.role === 'user' ? '✦' : 'A'}</div><div class="ai-msg-bubble">${turn.content}</div>`;
        aiMessages.appendChild(div);
      });
      if (window._aiHistory.length) aiMessages.scrollTop = aiMessages.scrollHeight;
    } else {
      // Default welcome message
      aiMessages.innerHTML = '<div class="ai-msg ai-msg--bot"><div class="ai-msg-avatar">A</div><div class="ai-msg-bubble">Welcome to AURUM. I\'m your personal concierge — tell me about your ideal stay. Where are you dreaming of going?</div></div>';
      window._aiHistory = [{ role: 'assistant', content: 'Welcome to AURUM. I\'m your personal concierge — tell me about your ideal stay. Where are you dreaming of going?' }];
    }
  } catch(e) {
    window._aiHistory = [];
  }
}

// Save chat history for current user
function saveChatHistory() {
  const key = getChatStorageKey();
  try {
    localStorage.setItem(key, JSON.stringify(window._aiHistory));
  } catch(e) {}
}

function openAiChatModal() {
  aiModal.classList.add('open');
  var win = document.getElementById('aiWindow');
  if (win) win.classList.remove('minimized');
  setTimeout(() => aiInput.focus(), 100);
  loadChatHistory();
}

document.getElementById('openAiChat').addEventListener('click', openAiChatModal);
document.getElementById('aiFab').addEventListener('click', openAiChatModal);
document.getElementById('aiClose').addEventListener('click', () => aiModal.classList.remove('open'));

document.getElementById('aiSend').addEventListener('click', sendAI);

// Minimize button etc. (existing code unchanged)
var aiMinBtn = document.getElementById('aiMinimize');
if (aiMinBtn) {
  aiMinBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    var win = document.getElementById('aiWindow');
    if (!win) return;
    var isMin = win.classList.contains('minimized');
    if (isMin) {
      win.classList.remove('minimized');
      aiMinBtn.textContent = '—';
      aiMinBtn.title = 'Minimize';
    } else {
      win.classList.add('minimized');
      aiMinBtn.textContent = '▲';
      aiMinBtn.title = 'Restore chat';
    }
  });
}
document.getElementById('aiDragHandle').addEventListener('click', function() {
  var win = document.getElementById('aiWindow');
  if (win && win.classList.contains('minimized')) {
    win.classList.remove('minimized');
    var btn = document.getElementById('aiMinimize');
    if (btn) { btn.textContent = '—'; btn.title = 'Minimize'; }
  }
});
document.getElementById('aiFab').addEventListener('click', function() {
  var win = document.getElementById('aiWindow');
  if (win && win.classList.contains('minimized')) {
    win.classList.remove('minimized');
    var btn = document.getElementById('aiMinimize');
    if (btn) { btn.textContent = '—'; }
  }
});
aiInput.addEventListener('keydown', e => { if(e.key==='Enter') sendAI(); });

function appendMsg(text, role) {
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg--${role}`;
  div.innerHTML = `<div class="ai-msg-avatar">${role === 'user' ? '✦' : 'A'}</div><div class="ai-msg-bubble">${text}</div>`;
  aiMessages.appendChild(div);
  aiMessages.scrollTop = aiMessages.scrollHeight;
  return div;
}

function quickAsk(btn) {
  aiInput.value = btn.textContent.replace(/[🌹🌊]/g, '').trim();
  document.getElementById('aiSuggestions').style.display = 'none';
  sendAI();
}

// Ambient audio (unchanged)
(function() {
  if (sessionStorage.getItem('aurum-played')) return;
  sessionStorage.setItem('aurum-played', '1');
  function playAmbient() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var notes = [110, 165, 220, 277];
      notes.forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 2);
        gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 6);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.3);
        osc.stop(ctx.currentTime + 12);
      });
    } catch(e) {}
  }
  document.addEventListener('click', function handler() {
    playAmbient();
    document.removeEventListener('click', handler);
  }, { once: true });
  document.addEventListener('scroll', function handler2() {
    playAmbient();
    document.removeEventListener('scroll', handler2);
  }, { once: true });
})();

// Clear chat with confirmation and per‑user deletion
var aiClearBtn = document.getElementById('aiClear');
if (aiClearBtn) {
  aiClearBtn.addEventListener('click', function() {
    if (confirm('Clear all conversation history?')) {
      window._aiHistory = [];
      const key = getChatStorageKey();
      localStorage.removeItem(key);
      aiMessages.innerHTML = '<div class="ai-msg ai-msg--bot"><div class="ai-msg-avatar">A</div><div class="ai-msg-bubble">Conversation cleared. How may I assist you?</div></div>';
      document.getElementById('aiSuggestions').style.display = 'flex';
      saveChatHistory(); // save empty history
    }
  });
}

// Drag & resize chat window (unchanged)
(function() {
  var win = document.getElementById('aiWindow');
  if (!win) return;
  var dragHandle = document.getElementById('aiDragHandle');
  var dragging = false, dragStartX, dragStartY, winStartLeft, winStartTop;
  function initPosition() {
    if (win.style.left) return;
    var rect = win.getBoundingClientRect();
    win.style.left = rect.left + 'px';
    win.style.top  = rect.top  + 'px';
    win.style.right  = 'auto';
    win.style.bottom = 'auto';
    win.style.position = 'fixed';
  }
  dragHandle.addEventListener('mousedown', function(e) {
    if (e.target.closest('button')) return;
    if (win.classList.contains('maximized')) return;
    initPosition();
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    winStartLeft = parseInt(win.style.left) || 0;
    winStartTop  = parseInt(win.style.top)  || 0;
    win.classList.add('dragging');
    e.preventDefault();
  });
  dragHandle.addEventListener('touchstart', function(e) {
    if (e.target.closest('button')) return;
    if (win.classList.contains('maximized')) return;
    initPosition();
    var t = e.touches[0];
    dragging = true;
    dragStartX = t.clientX; dragStartY = t.clientY;
    winStartLeft = parseInt(win.style.left) || 0;
    winStartTop  = parseInt(win.style.top)  || 0;
    win.classList.add('dragging');
  }, { passive: true });
  document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    var dx = e.clientX - dragStartX;
    var dy = e.clientY - dragStartY;
    var newLeft = Math.max(0, Math.min(window.innerWidth  - win.offsetWidth,  winStartLeft + dx));
    var newTop  = Math.max(0, Math.min(window.innerHeight - win.offsetHeight, winStartTop  + dy));
    win.style.left = newLeft + 'px';
    win.style.top  = newTop  + 'px';
  });
  document.addEventListener('touchmove', function(e) {
    if (!dragging) return;
    var t = e.touches[0];
    var dx = t.clientX - dragStartX;
    var dy = t.clientY - dragStartY;
    var newLeft = Math.max(0, Math.min(window.innerWidth  - win.offsetWidth,  winStartLeft + dx));
    var newTop  = Math.max(0, Math.min(window.innerHeight - win.offsetHeight, winStartTop  + dy));
    win.style.left = newLeft + 'px';
    win.style.top  = newTop  + 'px';
  }, { passive: true });
  document.addEventListener('mouseup',  function() { dragging = false; win.classList.remove('dragging'); });
  document.addEventListener('touchend', function() { dragging = false; win.classList.remove('dragging'); });

  function makeResizer(handle, mode) {
    if (!handle) return;
    var resizing = false, startX, startY, startW, startH, startLeft, startTop;
    handle.addEventListener('mousedown', function(e) {
      if (win.classList.contains('maximized')) return;
      initPosition();
      resizing = true;
      startX = e.clientX; startY = e.clientY;
      startW = win.offsetWidth; startH = win.offsetHeight;
      startLeft = parseInt(win.style.left) || 0;
      startTop  = parseInt(win.style.top)  || 0;
      e.preventDefault(); e.stopPropagation();
    });
    document.addEventListener('mousemove', function(e) {
      if (!resizing) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      var minW = 300, minH = 320;
      if (mode === 'bottom' || mode === 'corner') {
        win.style.height = Math.max(minH, startH + dy) + 'px';
      }
      if (mode === 'right' || mode === 'corner') {
        win.style.width = Math.max(minW, startW + dx) + 'px';
      }
      if (mode === 'left') {
        var newW = Math.max(minW, startW - dx);
        var newLeft = startLeft + (startW - newW);
        win.style.width = newW + 'px';
        win.style.left  = newLeft + 'px';
      }
    });
    document.addEventListener('mouseup', function() { resizing = false; });
  }
  makeResizer(document.getElementById('aiResizeBottom'), 'bottom');
  makeResizer(document.getElementById('aiResizeRight'),  'right');
  makeResizer(document.getElementById('aiResizeLeft'),   'left');
  makeResizer(document.getElementById('aiResizeCorner'), 'corner');

  var maxBtn = document.getElementById('aiMaximize');
  var isMax = false;
  var savedPos = {};
  if (maxBtn) {
    maxBtn.addEventListener('click', function() {
      isMax = !isMax;
      if (isMax) {
        savedPos = { left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height };
        win.classList.add('maximized');
        maxBtn.textContent = '⤡';
        maxBtn.title = 'Restore';
      } else {
        win.classList.remove('maximized');
        win.style.left   = savedPos.left   || '';
        win.style.top    = savedPos.top    || '';
        win.style.width  = savedPos.width  || '';
        win.style.height = savedPos.height || '';
        maxBtn.textContent = '⤢';
        maxBtn.title = 'Maximize';
      }
    });
  }
})();

// Draggable FAB (unchanged)
let fab = document.getElementById('aiFab');
if (fab) {
  let isDraggingFab = false;
  let fabStartX, fabStartY, fabOriginalLeft, fabOriginalTop;
  const savedFabPos = localStorage.getItem('aurum-fab-position');
  if (savedFabPos) {
    try {
      const pos = JSON.parse(savedFabPos);
      fab.style.position = 'fixed';
      fab.style.left = pos.left + 'px';
      fab.style.top = pos.top + 'px';
      fab.style.right = 'auto';
      fab.style.bottom = 'auto';
    } catch(e) {}
  }
  fab.addEventListener('mousedown', startDrag);
  fab.addEventListener('touchstart', startDrag, { passive: false });
  function startDrag(e) {
    e.preventDefault();
    isDraggingFab = true;
    const rect = fab.getBoundingClientRect();
    fabOriginalLeft = rect.left;
    fabOriginalTop = rect.top;
    const clientX = e.clientX ?? e.touches[0].clientX;
    const clientY = e.clientY ?? e.touches[0].clientY;
    fabStartX = clientX - fabOriginalLeft;
    fabStartY = clientY - fabOriginalTop;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
  }
  function onDrag(e) {
    if (!isDraggingFab) return;
    e.preventDefault();
    let clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
    let clientY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);
    let newLeft = clientX - fabStartX;
    let newTop = clientY - fabStartY;
    newLeft = Math.max(8, Math.min(window.innerWidth - fab.offsetWidth - 8, newLeft));
    newTop = Math.max(8, Math.min(window.innerHeight - fab.offsetHeight - 8, newTop));
    fab.style.left = newLeft + 'px';
    fab.style.top = newTop + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
  }
  function stopDrag() {
    if (!isDraggingFab) return;
    isDraggingFab = false;
    const left = parseInt(fab.style.left, 10);
    const top = parseInt(fab.style.top, 10);
    if (!isNaN(left) && !isNaN(top)) {
      localStorage.setItem('aurum-fab-position', JSON.stringify({ left, top }));
    }
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
  }
}

async function sendAI() {
  const text = aiInput.value.trim();
  if (!text) return;
  appendMsg(text, 'user');
  aiInput.value = '';
  const typing = appendMsg('', 'bot');
  typing.classList.add('ai-typing');
  if (!window._aiHistory) window._aiHistory = [];

  try {
    const response = await fetch(`${API_BASE}/ai/concierge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message: text, history: window._aiHistory })
    });
    const data = await response.json();
    typing.classList.remove('ai-typing');
    if (data.success) {
      let reply = data.data.response || data.data.reply || data.data.message || '';
      typing.querySelector('.ai-msg-bubble').innerHTML = reply;
      window._aiHistory.push({ role: 'user', content: text });
      window._aiHistory.push({ role: 'assistant', content: reply });
      if (window._aiHistory.length > 32) window._aiHistory = window._aiHistory.slice(-32);
      saveChatHistory();
    } else {
      typing.querySelector('.ai-msg-bubble').innerHTML = 'AI service unavailable. Please try again later.';
    }
  } catch(err) {
    typing.classList.remove('ai-typing');
    typing.querySelector('.ai-msg-bubble').innerHTML = 'Connection error. Unable to reach AI concierge.';
    console.error(err);
  }
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

function executeAiAction(action) { /* keep as is from original */ }

// Rest of existing functions (parseUserFilters, parseReplyFilters, showToast, scroll anim, init, owner role nav) remain unchanged.
// (I'll keep them identical to your original to avoid breaking anything)
function parseUserFilters(text) { /* unchanged */ }
function parseReplyFilters(reply) { /* unchanged */ }
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' '+type : '');
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.classList.remove('show'), 4000);
}

const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.animation='fadeUp 0.6s ease forwards';
      obs.unobserve(e.target);
    }
  });
}, { threshold:0.1 });
document.querySelectorAll('.featured-card, .why-feat').forEach(el => { el.style.opacity='0'; obs.observe(el); });

window.addEventListener('DOMContentLoaded', () => {
  loadHotelsFromAPI();
  try {
    const params = new URLSearchParams(window.location.search);
    const openBooking = params.get('openBooking');
    if (openBooking) {
      const hid = parseInt(openBooking,10);
      const h = hotelDatabase.find(x=>x.id===hid);
      if (h) openBookingModal(h);
      history.replaceState(null,'', window.location.pathname);
    }
  } catch(e){}
  const navToggle = document.getElementById('navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      document.querySelector('.nav-links')?.classList.toggle('mobile-open');
    });
  }
    makeFabDraggable();
  setupClearChat();
  overrideAiButtons();
  loadChatHistory(); // load chat for current user
});

(function() {
  const u = JSON.parse(localStorage.getItem('aurum-user') || 'null');
  if (u && u.role === 'owner') {
    const loggedDiv = document.getElementById('navUserLogged');
    if (loggedDiv) {
      const dashLink = document.createElement('a');
      dashLink.href = 'owner-dashboard.html';
      dashLink.className = 'nav-btn nav-btn-dash';
      dashLink.style.cssText = 'margin-right:8px;';
      dashLink.textContent = 'Dashboard';
      loggedDiv.insertBefore(dashLink, loggedDiv.firstChild);
    }
  }
   // ========== CHAT FUNCTIONS (private per user) ==========
function getChatStorageKey() {
  const user = JSON.parse(localStorage.getItem('aurum-user') || 'null');
  return user?.email ? `aurum-chat-${user.email}` : 'aurum-chat-temp';
}

function loadChatHistory() {
  const key = getChatStorageKey();
  const saved = localStorage.getItem(key);
  const messagesContainer = document.getElementById('aiMessages');
  if (!messagesContainer) return;
  if (saved) {
    try {
      const history = JSON.parse(saved);
      messagesContainer.innerHTML = '';
      history.forEach(msg => {
        const div = document.createElement('div');
        div.className = `ai-msg ai-msg--${msg.role === 'user' ? 'user' : 'bot'}`;
        div.innerHTML = `<div class="ai-msg-avatar">${msg.role === 'user' ? '👤' : 'A'}</div><div class="ai-msg-bubble">${escapeHtml(msg.content)}</div>`;
        messagesContainer.appendChild(div);
      });
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch(e) {}
  } else {
    messagesContainer.innerHTML = '<div class="ai-msg ai-msg--bot"><div class="ai-msg-avatar">A</div><div class="ai-msg-bubble">Welcome to AURUM Concierge. How can I help you?</div></div>';
  }
}

function saveChatMessage(role, content) {
  const key = getChatStorageKey();
  const saved = localStorage.getItem(key);
  let history = saved ? JSON.parse(saved) : [];
  history.push({ role, content });
  if (history.length > 50) history = history.slice(-50);
  localStorage.setItem(key, JSON.stringify(history));
  loadChatHistory();
}

function appendMessage(text, role) {
  const messagesContainer = document.getElementById('aiMessages');
  if (!messagesContainer) return;
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg--${role}`;
  div.innerHTML = `<div class="ai-msg-avatar">${role === 'user' ? '👤' : 'A'}</div><div class="ai-msg-bubble">${escapeHtml(text)}</div>`;
  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  saveChatMessage(role, text);
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function sendAIMessage() {
  const input = document.getElementById('aiInput');
  const text = input?.value.trim();
  if (!text) return;
  appendMessage(text, 'user');
  input.value = '';
  setTimeout(() => {
    const lower = text.toLowerCase();
    let reply = '';
    if (lower.includes('paris')) reply = 'Paris has beautiful hotels like Le Grand Hôtel. Use the search bar to see them. ✨';
    else if (lower.includes('dubai')) reply = 'Dubai offers luxury hotels like Burj Al Arab. Search now! 🏨';
    else if (lower.includes('london')) reply = 'London has elegant hotels like The Ritz. Try searching. 🇬🇧';
    else if (lower.includes('help')) reply = 'You can search by city, rooms, budget. Click "Book Now" to reserve. Need more help?';
    else reply = 'Tell me a city (Paris, Dubai, London) or ask for help. I’m your concierge. ✨';
    appendMessage(reply, 'bot');
  }, 500);
}

// ========== DRAGGABLE FAB ==========
function makeFabDraggable() {
  const fab = document.getElementById('aiFab');
  if (!fab) return;
  let isDragging = false, startX, startY, initialLeft, initialTop;
  const savedPos = localStorage.getItem('aurum-fab-position');
  if (savedPos) {
    try {
      const pos = JSON.parse(savedPos);
      fab.style.position = 'fixed';
      fab.style.left = pos.left + 'px';
      fab.style.top = pos.top + 'px';
      fab.style.right = 'auto';
      fab.style.bottom = 'auto';
    } catch(e) {}
  }
  fab.addEventListener('mousedown', startDrag);
  fab.addEventListener('touchstart', startDrag, { passive: false });
  function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    const rect = fab.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    const clientX = e.clientX ?? e.touches[0].clientX;
    const clientY = e.clientY ?? e.touches[0].clientY;
    startX = clientX - initialLeft;
    startY = clientY - initialTop;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
  }
  function onDrag(e) {
    if (!isDragging) return;
    e.preventDefault();
    let clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
    let clientY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);
    let newLeft = clientX - startX;
    let newTop = clientY - startY;
    newLeft = Math.max(8, Math.min(window.innerWidth - fab.offsetWidth - 8, newLeft));
    newTop = Math.max(8, Math.min(window.innerHeight - fab.offsetHeight - 8, newTop));
    fab.style.left = newLeft + 'px';
    fab.style.top = newTop + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
  }
  function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    const left = parseInt(fab.style.left, 10);
    const top = parseInt(fab.style.top, 10);
    if (!isNaN(left) && !isNaN(top)) {
      localStorage.setItem('aurum-fab-position', JSON.stringify({ left, top }));
    }
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
  }
}

// ========== CLEAR CHAT BUTTON ==========
function setupClearChat() {
  const clearBtn = document.getElementById('aiClear');
  if (!clearBtn) return;
  clearBtn.addEventListener('click', () => {
    if (confirm('🗑️ Clear all conversation history?')) {
      const key = getChatStorageKey();
      localStorage.removeItem(key);
      const messagesContainer = document.getElementById('aiMessages');
      if (messagesContainer) {
        messagesContainer.innerHTML = '<div class="ai-msg ai-msg--bot"><div class="ai-msg-avatar">A</div><div class="ai-msg-bubble">Conversation cleared. How may I assist you?</div></div>';
      }
    }
  });
}

// ========== OPEN CHAT MODAL ==========
function openChatModal() {
  const modal = document.getElementById('aiModal');
  if (modal) modal.classList.add('open');
  loadChatHistory();
}

// ========== OVERRIDE EXISTING AI BUTTONS ==========
function overrideAiButtons() {
  const openBtn = document.getElementById('openAiChat');
  const fab = document.getElementById('aiFab');
  if (openBtn) openBtn.onclick = openChatModal;
  if (fab) fab.onclick = openChatModal;
  const sendBtn = document.getElementById('aiSend');
  if (sendBtn) sendBtn.onclick = sendAIMessage;
  const input = document.getElementById('aiInput');
  if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendAIMessage(); });
}
})();
