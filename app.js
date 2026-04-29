/* ═══════════════════════════════════════════════
   AURUM — app.js (CORRECTED - NO DUPLICATES, FIXED IMAGES)
   Integrated with backend API, AI concierge, booking badges, 1-day alerts
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

/* ══════════ HOTEL DATABASE & IMAGES ══════════ */
let hotelDatabase = [];

// ----- IMAGE MAPS -----
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
  'Le Grand Aurum Paris':    ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80','https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=1200&q=80','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80'],
  'Aurum Palace London':     ['https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=1200&q=80','https://images.unsplash.com/photo-1562790351-d273a961e0e9?w=1200&q=80','https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80'],
  'Aurum Medina Marrakesh':  ['https://images.unsplash.com/photo-1590073844006-33379778ae09?w=1200&q=80','https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80','https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80'],
  'Aurum Sakura Tokyo':      ['https://images.unsplash.com/photo-1553855994-dbbf0af09b4c?w=1200&q=80','https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80','https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&q=80'],
  'Aurum Overwater Maldives':['https://images.unsplash.com/photo-1540202404-1b927e27fa8b?w=1200&q=80','https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1200&q=80','https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=1200&q=80'],
  'Aurum Summit Aspen':      ['https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=1200&q=80','https://images.unsplash.com/photo-1562632777-5e0b6e687513?w=1200&q=80','https://images.unsplash.com/photo-1542621334-a254cf47733d?w=1200&q=80'],
  'Aurum Duomo Florence':    ['https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=1200&q=80','https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80','https://images.unsplash.com/photo-1578898886250-b39f1ad40a5f?w=1200&q=80'],
  'Aurum Sentosa Singapore': ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80','https://images.unsplash.com/photo-1540541338537-71637f2ced2b?w=1200&q=80'],
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
      { url: cover || '', gradient: `linear-gradient(135deg,${c1},#2a1f0a)`, label: 'Exterior', initial },
      ...gallery.map((url, i) => ({ url, gradient: `linear-gradient(135deg,${c1},#0e0c06)`, label: galleryLabels[i] || 'View', initial })),
    ],
    rooms: Object.entries(ROOM_IMGS).map(([label, url]) => ({ url, gradient: `linear-gradient(135deg,${c1},#0e0c06)`, label, initial })),
    amenities: ['Pool', 'Spa', 'Restaurant', 'Bar & Lounge'].map((label, i) => ({ url: AMENITY_IMGS[i], gradient: `linear-gradient(135deg,${c1},#0e0c06)`, label, initial })),
  };
}

// ----- LOAD HOTELS (API first, then fallback) -----
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
      return;
    }
  } catch (e) {
    console.warn('API hotels failed, using local fallback', e);
  }
  useLocalHotelDatabase(); // fallback
}

// ----- FALLBACK HOTELS WITH CORRECT NAMES (MATCHING IMAGES) -----
function useLocalHotelDatabase() {
  hotelDatabase = [
    { id: 1, name: 'Le Grand Aurum Paris', city: 'Paris', country: 'France', stars: 5, price: 1850, rating: 4.9, reviews: 1284, desc: 'Belle Époque grandeur at the heart of Paris...', amenities: ['Wi-Fi', 'Spa', 'Restaurant', 'Concierge', 'Bar'], initial: 'LG', color: '#1a1208', maxChildren: 4, rooms: 5, imageUrl: HOTEL_COVERS['Le Grand Aurum Paris'], photos: makeRealPhotos('Le Grand Aurum Paris', 'LG', '#1a1208') },
    { id: 2, name: 'Aurum Palace London', city: 'London', country: 'United Kingdom', stars: 5, price: 2200, rating: 4.8, reviews: 876, desc: 'A Georgian townhouse in Mayfair that has housed diplomats...', amenities: ['Wi-Fi', 'Pool', 'Spa', 'Restaurant', 'Concierge'], initial: 'HC', color: '#14100a', maxChildren: 2, rooms: 5, imageUrl: HOTEL_COVERS['Aurum Palace London'], photos: makeRealPhotos('Aurum Palace London', 'HC', '#14100a') },
    { id: 3, name: 'Aurum Royale Dubai', city: 'Dubai', country: 'UAE', stars: 5, price: 2500, rating: 4.9, reviews: 2341, desc: 'Ultra-luxury beachfront resort with gold leaf interiors...', amenities: ['Private Beach', 'Infinity Pool', 'Butler', 'Helipad'], initial: 'AR', color: '#1a1008', maxChildren: 4, rooms: 4, imageUrl: HOTEL_COVERS['Aurum Royale Dubai'], photos: makeRealPhotos('Aurum Royale Dubai', 'AR', '#1a1008') },
    { id: 4, name: 'Aurum Zen Bali', city: 'Bali', country: 'Indonesia', stars: 5, price: 1100, rating: 4.88, reviews: 789, desc: 'Jungle sanctuary with Ayurvedic spa and rice terrace views...', amenities: ['Jungle Pool', 'Ayurvedic Spa', 'Butler', 'Temple Tours'], initial: 'AZ', color: '#0e1208', maxChildren: 3, rooms: 3, imageUrl: HOTEL_COVERS['Aurum Zen Bali'], photos: makeRealPhotos('Aurum Zen Bali', 'AZ', '#0e1208') },
    { id: 5, name: 'Aurum Riviera Santorini', city: 'Santorini', country: 'Greece', stars: 5, price: 2400, rating: 4.95, reviews: 432, desc: 'Cliffside villas with private plunge pools and sunset views...', amenities: ['Infinity Pool', 'Cave Spa', 'Butler', 'Sunset Dining'], initial: 'AS', color: '#0e0818', maxChildren: 2, rooms: 2, imageUrl: HOTEL_COVERS['Aurum Riviera Santorini'], photos: makeRealPhotos('Aurum Riviera Santorini', 'AS', '#0e0818') },
    { id: 6, name: 'Aurum Bosphorus Istanbul', city: 'Istanbul', country: 'Turkey', stars: 5, price: 1700, rating: 4.8, reviews: 567, desc: 'Ottoman palace turned luxury hotel on the Bosphorus...', amenities: ['Hammam', 'Rooftop Pool', 'Butler', 'Yacht Charter'], initial: 'AB', color: '#1a1208', maxChildren: 2, rooms: 3, imageUrl: HOTEL_COVERS['Aurum Bosphorus Istanbul'], photos: makeRealPhotos('Aurum Bosphorus Istanbul', 'AB', '#1a1208') },
  ];
  window._hotelsData = hotelDatabase;
}

/* ══════════ USER BOOKINGS & BADGES ══════════ */
let userBookings = [];

async function fetchUserBookings() {
  if (!currentUser) return [];
  try {
    const res = await fetch(`${API_BASE}/bookings`, { credentials: 'include' });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      userBookings = data.data;
      return userBookings;
    } else {
      userBookings = [];
      return [];
    }
  } catch (err) {
    console.error('Failed to fetch bookings:', err);
    userBookings = [];
    return [];
  }
}

function checkUpcomingBookings() {
  if (!userBookings.length) return;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  userBookings.forEach(b => {
    if (b.status === 'cancelled') return;
    const checkIn = new Date(b.check_in + 'T00:00:00Z');
    const checkOut = new Date(b.check_out + 'T00:00:00Z');
    const daysToCheckIn = Math.round((checkIn - today) / (1000 * 60 * 60 * 24));
    const daysToCheckOut = Math.round((checkOut - today) / (1000 * 60 * 60 * 24));
    if (daysToCheckIn === 1) showToast(`🔔 Reminder: Your stay at ${b.hotel_name || b.hotelName} starts tomorrow!`, 'info');
    if (daysToCheckOut === 1) showToast(`🔔 Reminder: You check out of ${b.hotel_name || b.hotelName} tomorrow.`, 'info');
  });
}

function getHotelBookingStatus(hotelId) {
  if (!userBookings.length) return null;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const booking = userBookings.find(b => b.hotel_id === hotelId && b.status !== 'cancelled');
  if (!booking) return null;
  const checkIn = new Date(booking.check_in + 'T00:00:00Z');
  const checkOut = new Date(booking.check_out + 'T00:00:00Z');
  let statusText = '', statusClass = '';
  if (checkOut < today) {
    statusText = 'Completed';
    statusClass = 'completed';
  } else if (checkIn <= today && checkOut >= today) {
    const nightsLeft = Math.round((checkOut - today) / (1000 * 60 * 60 * 24));
    statusText = `Current stay · ${nightsLeft} night${nightsLeft !== 1 ? 's' : ''} left`;
    statusClass = 'current';
  } else if (checkIn > today) {
    const daysLeft = Math.round((checkIn - today) / (1000 * 60 * 60 * 24));
    statusText = `Booked · starts in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
    statusClass = 'upcoming';
  }
  return { text: statusText, class: statusClass };
}

async function updateAllBookingBadges() {
  if (!currentUser) return;
  await fetchUserBookings();
  const cards = document.querySelectorAll('.hotel-card');
  cards.forEach(card => {
    const hotelId = parseInt(card.dataset.hotelId);
    const status = getHotelBookingStatus(hotelId);
    const existingBadge = card.querySelector('.hotel-booked-badge');
    const bookBtn = card.querySelector('.hotel-book-btn');
    if (status) {
      if (!existingBadge) {
        const badge = document.createElement('div');
        badge.className = `hotel-booked-badge ${status.class}`;
        badge.textContent = status.text;
        card.querySelector('.hotel-card-img').appendChild(badge);
      } else {
        existingBadge.textContent = status.text;
        existingBadge.className = `hotel-booked-badge ${status.class}`;
      }
      if (bookBtn) {
        bookBtn.classList.add('booked-btn');
        bookBtn.textContent = 'View My Stay';
        const newBtn = bookBtn.cloneNode(true);
        bookBtn.parentNode.replaceChild(newBtn, bookBtn);
        newBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.location.href = 'reservations.html';
        });
      }
    } else {
      if (existingBadge) existingBadge.remove();
      if (bookBtn) {
        bookBtn.classList.remove('booked-btn');
        bookBtn.textContent = 'Reserve Now';
        const newBtn = bookBtn.cloneNode(true);
        bookBtn.parentNode.replaceChild(newBtn, bookBtn);
        newBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const curUser = JSON.parse(localStorage.getItem('aurum-user') || 'null');
          const hotel = hotelDatabase.find(h => h.id === hotelId);
          if (curUser && hotel) openBookingModal(hotel);
          else if (hotel) showSideSigninTip(newBtn, hotel);
        });
      }
    }
  });
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
      const val = opt.dataset.value;
      const text = opt.textContent;
      hiddenSel.value = val;
      valueSpan.textContent = text;
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      container.classList.remove('open');
    });
  });
  document.addEventListener('click', (e) => { if (!container.contains(e.target)) container.classList.remove('open'); });
  hiddenSel.addEventListener('change', () => {
    const val = hiddenSel.value;
    options.forEach(opt => {
      if (opt.dataset.value === val) {
        opt.classList.add('selected');
        valueSpan.textContent = opt.textContent;
      } else opt.classList.remove('selected');
    });
  });
}
initCustomSelect('roomsSelect', 's-rooms');
initCustomSelect('childrenSelect', 's-children');
initCustomSelect('budgetSelect', 's-price');

/* ══════════ SEARCH & RENDER ══════════ */
document.getElementById('searchBtn').addEventListener('click', () => {
  const location = document.getElementById('s-location').value.trim();
  const rooms = parseInt(document.getElementById('s-rooms').value);
  const children = parseInt(document.getElementById('s-children').value);
  const price = document.getElementById('s-price').value;
  if (!location) { showToast('Please enter a destination.', 'error'); return; }
  const hotels = filterHotels(location, rooms, children, price);
  renderResults(hotels, location, rooms, children, price);
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
  meta.textContent = `Showing ${hotels.length} propert${hotels.length === 1 ? 'y' : 'ies'} · ${rooms} room${rooms > 1 ? 's' : ''} · ${children} child${children !== 1 ? 'ren' : ''} · ${pl}`;
  grid.innerHTML = '';
  if (!hotels.length) {
    grid.innerHTML = `<div class="no-results">No properties found.<br/><small style="font-size:16px;color:var(--text-m)">Try adjusting your filters.</small></div>`;
    return;
  }
  hotels.forEach((h, i) => {
    const card = createHotelCard(h, i);
    card.dataset.hotelId = h.id;
    grid.appendChild(card);
  });
  document.getElementById('sortFilter').onchange = async function () {
    const s = [...hotels];
    if (this.value === 'price-asc') s.sort((a, b) => a.price - b.price);
    if (this.value === 'price-desc') s.sort((a, b) => b.price - a.price);
    if (this.value === 'rating') s.sort((a, b) => b.rating - a.rating);
    grid.innerHTML = '';
    s.forEach((h, i) => {
      const card = createHotelCard(h, i);
      card.dataset.hotelId = h.id;
      grid.appendChild(card);
    });
    if (currentUser) await updateAllBookingBadges();
  };
  if (currentUser) updateAllBookingBadges();
}

function createHotelCard(hotel, delay = 0) {
  const card = document.createElement('div');
  card.className = 'hotel-card';
  card.style.cssText = `animation:fadeUp 0.5s ease ${delay * 0.07}s both`;
  const stars = '★'.repeat(hotel.stars) + '☆'.repeat(5 - hotel.stars);
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
      <div class="hotel-card-amenities">${hotel.amenities.slice(0, 4).map(a => `<span class="amenity-tag">${a}</span>`).join('')}</div>
      <div class="hotel-card-footer"><div><span class="price-from">from</span><span class="price-num">$${hotel.price}</span><span class="price-per">/night</span></div><div style="text-align:right"><span class="stars">${stars}</span><span class="rating-count">${hotel.rating} (${hotel.reviews?.toLocaleString() || 0})</span></div></div>
      <button class="hotel-book-btn">Reserve Now</button>
    </div>`;
  card.querySelector('.hotel-view-photos').addEventListener('click', e => { e.stopPropagation(); openGallery(hotel); });
  card.querySelector('.hotel-card-img-inner').addEventListener('click', () => openGallery(hotel));
  const bookBtn = card.querySelector('.hotel-book-btn');
  bookBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentUser) openBookingModal(hotel);
    else showSideSigninTip(bookBtn, hotel);
  });
  return card;
}

document.querySelectorAll('.featured-card').forEach(card => {
  card.addEventListener('click', () => {
    const dest = card.dataset.dest;
    document.getElementById('s-location').value = dest;
    const hotels = filterHotels(dest, 1, 0, 'any');
    renderResults(hotels, dest, 1, 0, 'any');
    showPage('results');
  });
});

/* ══════════ GALLERY MODAL ══════════ */
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
  galHotel = hotel; galTab = 'hotel'; galIndex = 0;
  document.getElementById('galleryHotelName').textContent = hotel.name;
  document.getElementById('galleryHotelLoc').textContent = `${hotel.city}, ${hotel.country}`;
  document.getElementById('galPrice').textContent = `$${hotel.price}`;
  document.querySelectorAll('.gtab').forEach(t => t.classList.remove('active'));
  document.querySelector('.gtab[data-tab="hotel"]').classList.add('active');
  renderGallery();
  galleryModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('galBookBtn').onclick = () => {
    if (currentUser) { closeGallery(); setTimeout(() => openBookingModal(hotel), 200); }
    else showSideSigninTip(document.getElementById('galBookBtn'), hotel);
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
  requestAnimationFrame(() => { galImgInner.style.transition = 'opacity 0.3s'; galImgInner.style.opacity = '1'; });
}
function renderThumbs(photos) {
  galleryThumbs.innerHTML = '';
  photos.forEach((p, i) => {
    const t = document.createElement('div');
    t.className = 'gallery-thumb' + (i === galIndex ? ' active' : '');
    const imgUrl = p.url || (i === 0 && galHotel && galHotel.imageUrl ? galHotel.imageUrl : '');
    if (imgUrl) t.style.cssText = `background:url('${imgUrl}') center/cover;`;
    else { t.style.cssText = `background:${p.gradient || p.color || '#1a1208'};font-size:10px;color:rgba(201,169,110,0.4);letter-spacing:1px;text-transform:uppercase;`; t.textContent = p.label.slice(0, 2); }
    t.title = p.label;
    t.addEventListener('click', () => { galIndex = i; renderGallery(); });
    galleryThumbs.appendChild(t);
  });
}
galPrev.addEventListener('click', () => { const photos = galHotel.photos[galTab]; galIndex = (galIndex - 1 + photos.length) % photos.length; renderGallery(); });
galNext.addEventListener('click', () => { const photos = galHotel.photos[galTab]; galIndex = (galIndex + 1) % photos.length; renderGallery(); });
document.addEventListener('keydown', e => { if (!galleryModal.classList.contains('open')) return; if (e.key === 'ArrowRight') galNext.click(); if (e.key === 'ArrowLeft') galPrev.click(); if (e.key === 'Escape') closeGallery(); });
document.querySelectorAll('.gtab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.gtab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    galTab = btn.dataset.tab;
    galIndex = 0;
    renderGallery();
  });
});
galleryClose.addEventListener('click', closeGallery);
galleryBackdrop.addEventListener('click', closeGallery);
function closeGallery() {
  galleryModal.classList.remove('open');
  document.body.style.overflow = '';
  const existing = document.getElementById('signinTip');
  if (existing) { existing.classList.remove('show'); setTimeout(() => { try { existing.remove(); } catch (e) { } }, 220); }
}

/* ══════════ BOOKING MODAL ══════════ */
const bookingModal = document.getElementById('bookingModal');
const bookingBackdrop = document.getElementById('bookingBackdrop');
let _currentBookingHotel = null;

function openBookingModal(hotel) {
  if (!currentUser) { showSideSigninTip(document.querySelector('.gallery-window .btn-gold') || document.body, hotel); return; }
  document.getElementById('modalHotelName').textContent = hotel.name;
  document.getElementById('modalHotelLoc').textContent = `${hotel.city}, ${hotel.country}`;
  document.getElementById('summaryRate').textContent = `$${hotel.price}/night`;
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
  const toISO = d => d.toISOString().split('T')[0];
  document.getElementById('bookingCheckin').value = toISO(tomorrow);
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
  let left = (spaceRight > tipRect.width + preferOffset) ? window.scrollX + rect.right + preferOffset : Math.max(12, window.scrollX + rect.left - tipRect.width - preferOffset);
  const rawTop = window.scrollY + rect.top + (rect.height - tipRect.height) / 2;
  const minTop = window.scrollY + 12;
  const maxTop = window.scrollY + window.innerHeight - tipRect.height - 12;
  const top = Math.min(maxTop, Math.max(minTop, rawTop));
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
  requestAnimationFrame(() => tip.classList.add('show'));
  tip.style.cursor = 'pointer';
  const onClickTip = () => window.location.href = 'auth.html';
  tip.addEventListener('click', onClickTip);
  let dismissTimer = setTimeout(() => cleanupTip(), 1500);
  window.addEventListener('scroll', () => cleanupTip(), { passive: true });
  window.addEventListener('resize', () => repositionTip());
  function cleanupTip() { if (!tip.parentNode) return; tip.classList.remove('show'); setTimeout(() => tip.remove(), 220); clearTimeout(dismissTimer); window.removeEventListener('scroll', cleanupTip); window.removeEventListener('resize', repositionTip); tip.removeEventListener('click', onClickTip); }
  function repositionTip() {
    if (!tip.parentNode) return;
    const rect = button.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    let left = (spaceRight > tipRect.width + preferOffset) ? window.scrollX + rect.right + preferOffset : Math.max(12, window.scrollX + rect.left - tipRect.width - preferOffset);
    const rawTop = window.scrollY + rect.top + (rect.height - tipRect.height) / 2;
    const minTop = window.scrollY + 12;
    const maxTop = window.scrollY + window.innerHeight - tipRect.height - 12;
    const top = Math.min(maxTop, Math.max(minTop, rawTop));
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }
}
function updateSummary(rate) {
  const cin = new Date(document.getElementById('bookingCheckin').value);
  const cout = new Date(document.getElementById('bookingCheckout').value);
  const rooms = parseInt(document.getElementById('bookingRooms').value) || 1;
  if (cin && cout && cout > cin) { const nights = Math.round((cout - cin) / (1000 * 60 * 60 * 24)); document.getElementById('summaryNights').textContent = nights; document.getElementById('summaryTotal').textContent = '$' + (nights * rate * rooms).toLocaleString(); }
}
document.getElementById('bookingClose').addEventListener('click', closeBooking);
bookingBackdrop.addEventListener('click', closeBooking);
function closeBooking() { bookingModal.classList.remove('open'); document.body.style.overflow = ''; }
['bookingCheckin', 'bookingCheckout', 'bookingRooms'].forEach(id => { document.getElementById(id).addEventListener('change', () => { const r = parseFloat(document.getElementById('summaryRate').textContent.replace(/[^0-9.]/g, '')); updateSummary(r); }); });
document.getElementById('confirmBooking').addEventListener('click', () => {
  const cin = document.getElementById('bookingCheckin').value;
  const cout = document.getElementById('bookingCheckout').value;
  if (!cin || !cout) { showToast('Please select dates.', 'error'); return; }
  const paySection = document.getElementById('paymentSection');
  if (paySection && paySection.classList.contains('hidden')) { paySection.classList.remove('hidden'); setTimeout(() => document.getElementById('payName')?.focus(), 120); return; }
  document.getElementById('payConfirmBtn')?.click();
});
const payConfirm = document.getElementById('payConfirmBtn');
if (payConfirm) {
  payConfirm.addEventListener('click', async () => {
    const name = document.getElementById('payName')?.value.trim() || '';
    const number = document.getElementById('payNumber')?.value.replace(/\s+/g, '') || '';
    const exp = document.getElementById('payExp')?.value.trim() || '';
    const cvc = document.getElementById('payCvc')?.value.trim() || '';
    if (!name || !number || !exp || !cvc) { showToast('Please complete payment details.', 'error'); return; }
    const cin = document.getElementById('bookingCheckin')?.value;
    const cout = document.getElementById('bookingCheckout')?.value;
    const rooms = parseInt(document.getElementById('bookingRooms')?.value) || 1;
    if (!cin || !cout || !_currentBookingHotel) { showToast('Missing booking details. Please try again.', 'error'); return; }
    payConfirm.disabled = true; payConfirm.textContent = 'Processing…';
    try {
      const checkIn = new Date(cin); const checkOut = new Date(cout);
      const nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const last4 = number.slice(-4);
      const totalPrice = _currentBookingHotel.price * nights * rooms;
      const roomType = document.getElementById('bookingRoomType')?.value || 'Deluxe Room';
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ hotelId: _currentBookingHotel.id, roomType, rooms, guests: rooms * 2, checkIn: cin, checkOut: cout, pricePerNight: _currentBookingHotel.price, paymentMethod: 'card', paymentLast4: last4, guestName: currentUser?.name || name, guestEmail: currentUser?.email || '' })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Booking failed');
      closeBooking();
      showToast(`✔ Confirmed! Total: $${totalPrice.toLocaleString()} — View in My Reservations`, 'success');
      if (currentUser) { await fetchUserBookings(); updateAllBookingBadges(); checkUpcomingBookings(); }
      setTimeout(() => {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:9999;background:var(--gold,#c9a96e);color:#000;padding:10px 18px;font-size:11px;letter-spacing:1px;cursor:pointer;border-radius:4px;';
        t.textContent = '→ VIEW MY RESERVATIONS';
        t.onclick = () => window.location.href = 'reservations.html';
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 5000);
      }, 500);
    } catch (err) { showToast(err.message || 'Connection error', 'error'); } finally { payConfirm.disabled = false; payConfirm.textContent = 'Pay & Confirm'; }
  });
}

/* ══════════ AI CONCIERGE (with per-user chat history & action handling) ══════════ */
const aiModal = document.getElementById('aiModal');
const aiMessages = document.getElementById('aiMessages');
const aiInput = document.getElementById('aiInput');
function getChatStorageKey() { const user = JSON.parse(localStorage.getItem('aurum-user') || 'null'); return user?.email ? `aurum-chat-${user.email}` : 'aurum-chat-temp'; }
function loadChatHistory() {
  const key = getChatStorageKey();
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      window._aiHistory = JSON.parse(saved) || [];
      aiMessages.innerHTML = '';
      window._aiHistory.forEach(turn => {
        const div = document.createElement('div');
        div.className = `ai-msg ai-msg--${turn.role === 'user' ? 'user' : 'bot'}`;
        div.innerHTML = `<div class="ai-msg-avatar">${turn.role === 'user' ? '✦' : 'A'}</div><div class="ai-msg-bubble">${turn.content}</div>`;
        aiMessages.appendChild(div);
      });
      if (window._aiHistory.length) aiMessages.scrollTop = aiMessages.scrollHeight;
    } else {
      aiMessages.innerHTML = '<div class="ai-msg ai-msg--bot"><div class="ai-msg-avatar">A</div><div class="ai-msg-bubble">Welcome to AURUM. I\'m your personal concierge — tell me about your ideal stay. Where are you dreaming of going?</div></div>';
      window._aiHistory = [{ role: 'assistant', content: 'Welcome to AURUM. I\'m your personal concierge — tell me about your ideal stay. Where are you dreaming of going?' }];
    }
  } catch (e) { window._aiHistory = []; }
}
function saveChatHistory() { const key = getChatStorageKey(); try { localStorage.setItem(key, JSON.stringify(window._aiHistory)); } catch (e) { } }
function openAiChatModal() { aiModal.classList.add('open'); const win = document.getElementById('aiWindow'); if (win) win.classList.remove('minimized'); setTimeout(() => aiInput.focus(), 100); loadChatHistory(); }
document.getElementById('openAiChat')?.addEventListener('click', openAiChatModal);
document.getElementById('aiFab')?.addEventListener('click', openAiChatModal);
document.getElementById('aiClose')?.addEventListener('click', () => aiModal.classList.remove('open'));
document.getElementById('aiSend')?.addEventListener('click', sendAI);
const aiMinBtn = document.getElementById('aiMinimize');
if (aiMinBtn) {
  aiMinBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    const win = document.getElementById('aiWindow');
    if (!win) return;
    if (win.classList.contains('minimized')) { win.classList.remove('minimized'); aiMinBtn.textContent = '—'; aiMinBtn.title = 'Minimize'; }
    else { win.classList.add('minimized'); aiMinBtn.textContent = '▲'; aiMinBtn.title = 'Restore chat'; }
  });
}
document.getElementById('aiDragHandle')?.addEventListener('click', function () { const win = document.getElementById('aiWindow'); if (win?.classList.contains('minimized')) { win.classList.remove('minimized'); const btn = document.getElementById('aiMinimize'); if (btn) { btn.textContent = '—'; btn.title = 'Minimize'; } } });
aiInput?.addEventListener('keydown', e => { if (e.key === 'Enter') sendAI(); });
function appendMsg(text, role) {
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg--${role}`;
  div.innerHTML = `<div class="ai-msg-avatar">${role === 'user' ? '✦' : 'A'}</div><div class="ai-msg-bubble">${text}</div>`;
  aiMessages.appendChild(div);
  aiMessages.scrollTop = aiMessages.scrollHeight;
  return div;
}
function quickAsk(btn) { aiInput.value = btn.textContent.replace(/[🌹🌊]/g, '').trim(); document.getElementById('aiSuggestions').style.display = 'none'; sendAI(); }
// Ambient audio (unchanged)
(function () { if (sessionStorage.getItem('aurum-played')) return; sessionStorage.setItem('aurum-played', '1'); function playAmbient() { try { var ctx = new (window.AudioContext || window.webkitAudioContext)(); var notes = [110, 165, 220, 277]; notes.forEach(function (freq, i) { var osc = ctx.createOscillator(); var gain = ctx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(freq, ctx.currentTime); gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 2); gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 6); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 12); osc.connect(gain); gain.connect(ctx.destination); osc.start(ctx.currentTime + i * 0.3); osc.stop(ctx.currentTime + 12); }); } catch (e) { } } document.addEventListener('click', function handler() { playAmbient(); document.removeEventListener('click', handler); }, { once: true }); document.addEventListener('scroll', function handler2() { playAmbient(); document.removeEventListener('scroll', handler2); }, { once: true }); })();
const aiClearBtn = document.getElementById('aiClear');
if (aiClearBtn) {
  aiClearBtn.addEventListener('click', () => { if (confirm('Clear all conversation history?')) { window._aiHistory = []; const key = getChatStorageKey(); localStorage.removeItem(key); aiMessages.innerHTML = '<div class="ai-msg ai-msg--bot"><div class="ai-msg-avatar">A</div><div class="ai-msg-bubble">Conversation cleared. How may I assist you?</div></div>'; document.getElementById('aiSuggestions').style.display = 'flex'; saveChatHistory(); } });
}
// Drag & resize chat window (improved)
(function () {
  const win = document.getElementById('aiWindow'); if (!win) return;
  const dragHandle = document.getElementById('aiDragHandle');
  let dragging = false, dragStartX, dragStartY, winStartLeft, winStartTop;
  function initPosition() { if (win.style.left) return; const rect = win.getBoundingClientRect(); win.style.left = rect.left + 'px'; win.style.top = rect.top + 'px'; win.style.right = 'auto'; win.style.bottom = 'auto'; win.style.position = 'fixed'; }
  dragHandle.addEventListener('mousedown', (e) => { if (e.target.closest('button')) return; if (win.classList.contains('maximized')) return; initPosition(); dragging = true; dragStartX = e.clientX; dragStartY = e.clientY; winStartLeft = parseInt(win.style.left) || 0; winStartTop = parseInt(win.style.top) || 0; win.classList.add('dragging'); e.preventDefault(); });
  dragHandle.addEventListener('touchstart', (e) => { if (e.target.closest('button')) return; if (win.classList.contains('maximized')) return; initPosition(); const t = e.touches[0]; dragging = true; dragStartX = t.clientX; dragStartY = t.clientY; winStartLeft = parseInt(win.style.left) || 0; winStartTop = parseInt(win.style.top) || 0; win.classList.add('dragging'); }, { passive: true });
  document.addEventListener('mousemove', (e) => { if (!dragging) return; const dx = e.clientX - dragStartX; const dy = e.clientY - dragStartY; let newLeft = Math.max(0, Math.min(window.innerWidth - win.offsetWidth, winStartLeft + dx)); let newTop = Math.max(0, Math.min(window.innerHeight - win.offsetHeight, winStartTop + dy)); win.style.left = newLeft + 'px'; win.style.top = newTop + 'px'; });
  document.addEventListener('touchmove', (e) => { if (!dragging) return; const t = e.touches[0]; const dx = t.clientX - dragStartX; const dy = t.clientY - dragStartY; let newLeft = Math.max(0, Math.min(window.innerWidth - win.offsetWidth, winStartLeft + dx)); let newTop = Math.max(0, Math.min(window.innerHeight - win.offsetHeight, winStartTop + dy)); win.style.left = newLeft + 'px'; win.style.top = newTop + 'px'; }, { passive: true });
  document.addEventListener('mouseup', () => { dragging = false; win.classList.remove('dragging'); });
  document.addEventListener('touchend', () => { dragging = false; win.classList.remove('dragging'); });
  function makeResizer(handle, mode) { if (!handle) return; let resizing = false, startX, startY, startW, startH, startLeft, startTop; handle.addEventListener('mousedown', (e) => { if (win.classList.contains('maximized')) return; initPosition(); resizing = true; startX = e.clientX; startY = e.clientY; startW = win.offsetWidth; startH = win.offsetHeight; startLeft = parseInt(win.style.left) || 0; startTop = parseInt(win.style.top) || 0; e.preventDefault(); e.stopPropagation(); }); document.addEventListener('mousemove', (e) => { if (!resizing) return; const dx = e.clientX - startX; const dy = e.clientY - startY; const minW = 300, minH = 320; if (mode === 'bottom' || mode === 'corner') win.style.height = Math.max(minH, startH + dy) + 'px'; if (mode === 'right' || mode === 'corner') win.style.width = Math.max(minW, startW + dx) + 'px'; if (mode === 'left') { const newW = Math.max(minW, startW - dx); const newLeft = startLeft + (startW - newW); win.style.width = newW + 'px'; win.style.left = newLeft + 'px'; } }); document.addEventListener('mouseup', () => { resizing = false; }); }
  makeResizer(document.getElementById('aiResizeBottom'), 'bottom');
  makeResizer(document.getElementById('aiResizeRight'), 'right');
  makeResizer(document.getElementById('aiResizeLeft'), 'left');
  makeResizer(document.getElementById('aiResizeCorner'), 'corner');
  const maxBtn = document.getElementById('aiMaximize');
  let isMax = false, savedPos = {};
  if (maxBtn) maxBtn.addEventListener('click', () => { isMax = !isMax; if (isMax) { savedPos = { left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height }; win.classList.add('maximized'); maxBtn.textContent = '⤡'; maxBtn.title = 'Restore'; } else { win.classList.remove('maximized'); win.style.left = savedPos.left || ''; win.style.top = savedPos.top || ''; win.style.width = savedPos.width || ''; win.style.height = savedPos.height || ''; maxBtn.textContent = '⤢'; maxBtn.title = 'Maximize'; } });
})();
let fab = document.getElementById('aiFab');
if (fab) {
  let isDraggingFab = false, fabStartX, fabStartY, fabOriginalLeft, fabOriginalTop;
  const savedFabPos = localStorage.getItem('aurum-fab-position');
  if (savedFabPos) try { const pos = JSON.parse(savedFabPos); fab.style.position = 'fixed'; fab.style.left = pos.left + 'px'; fab.style.top = pos.top + 'px'; fab.style.right = 'auto'; fab.style.bottom = 'auto'; } catch (e) { }
  fab.addEventListener('mousedown', startDrag);
  fab.addEventListener('touchstart', startDrag, { passive: false });
  function startDrag(e) { e.preventDefault(); isDraggingFab = true; const rect = fab.getBoundingClientRect(); fabOriginalLeft = rect.left; fabOriginalTop = rect.top; const clientX = e.clientX ?? e.touches[0].clientX; const clientY = e.clientY ?? e.touches[0].clientY; fabStartX = clientX - fabOriginalLeft; fabStartY = clientY - fabOriginalTop; document.addEventListener('mousemove', onDrag); document.addEventListener('mouseup', stopDrag); document.addEventListener('touchmove', onDrag, { passive: false }); document.addEventListener('touchend', stopDrag); }
  function onDrag(e) { if (!isDraggingFab) return; e.preventDefault(); let clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0); let clientY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0); let newLeft = clientX - fabStartX; let newTop = clientY - fabStartY; newLeft = Math.max(8, Math.min(window.innerWidth - fab.offsetWidth - 8, newLeft)); newTop = Math.max(8, Math.min(window.innerHeight - fab.offsetHeight - 8, newTop)); fab.style.left = newLeft + 'px'; fab.style.top = newTop + 'px'; fab.style.right = 'auto'; fab.style.bottom = 'auto'; }
  function stopDrag() { if (!isDraggingFab) return; isDraggingFab = false; const left = parseInt(fab.style.left, 10); const top = parseInt(fab.style.top, 10); if (!isNaN(left) && !isNaN(top)) localStorage.setItem('aurum-fab-position', JSON.stringify({ left, top })); document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', stopDrag); document.removeEventListener('touchmove', onDrag); document.removeEventListener('touchend', stopDrag); }
}
function executeAiAction(action) {
  if (!action) return;
  switch (action.action) {
    case 'SEARCH':
      const city = action.params?.city || '';
      if (city) { document.getElementById('s-location').value = city; const rooms = parseInt(document.getElementById('s-rooms').value) || 1; const children = parseInt(document.getElementById('s-children').value) || 0; const price = document.getElementById('s-price').value || 'any'; const hotels = filterHotels(city, rooms, children, price); renderResults(hotels, city, rooms, children, price); showPage('results'); showToast(`🔍 Showing results for ${city}`, 'info'); } else showToast('Please specify a city.', 'error');
      break;
    case 'BOOK':
      const hotelName = action.params?.hotelName;
      if (hotelName) { const hotel = hotelDatabase.find(h => h.name.toLowerCase().includes(hotelName.toLowerCase())); if (hotel) openBookingModal(hotel); else showToast(`Could not find "${hotelName}".`, 'error'); } else showToast('Specify hotel name.', 'error');
      break;
    case 'GO_RESERVATIONS': window.location.href = 'reservations.html'; break;
    case 'GO_HOME': showPage('home'); break;
    case 'CANCEL_BOOKING': window.location.href = 'reservations.html'; break;
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
  if (!window._aiHistory) window._aiHistory = [];
  try {
    const response = await fetch(`${API_BASE}/ai/concierge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ message: text, history: window._aiHistory }) });
    const data = await response.json();
    typing.classList.remove('ai-typing');
    if (data.success) {
      let reply = data.data.response || data.data.reply || data.data.message || '';
      typing.querySelector('.ai-msg-bubble').innerHTML = reply;
      window._aiHistory.push({ role: 'user', content: text });
      window._aiHistory.push({ role: 'assistant', content: reply });
      if (window._aiHistory.length > 32) window._aiHistory = window._aiHistory.slice(-32);
      saveChatHistory();
      if (data.data.action) executeAiAction(data.data.action);
    } else typing.querySelector('.ai-msg-bubble').innerHTML = 'AI service unavailable. Please try again later.';
  } catch (err) { typing.classList.remove('ai-typing'); typing.querySelector('.ai-msg-bubble').innerHTML = 'Connection error.'; console.error(err); }
  aiMessages.scrollTop = aiMessages.scrollHeight;
}
function showToast(msg, type = '') { const t = document.getElementById('toast'); t.textContent = msg; t.className = 'toast show' + (type ? ' ' + type : ''); clearTimeout(window._tt); window._tt = setTimeout(() => t.classList.remove('show'), 4000); }
// Intersection observer for fade animations
const obs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { e.target.style.animation = 'fadeUp 0.6s ease forwards'; obs.unobserve(e.target); } }); }, { threshold: 0.1 });
document.querySelectorAll('.featured-card, .why-feat').forEach(el => { el.style.opacity = '0'; obs.observe(el); });
// DOMContentLoaded
window.addEventListener('DOMContentLoaded', async () => {
  await loadHotelsFromAPI();
  if (currentUser) { await fetchUserBookings(); checkUpcomingBookings(); }
  try { const params = new URLSearchParams(window.location.search); const openBooking = params.get('openBooking'); if (openBooking) { const hid = parseInt(openBooking, 10); const h = hotelDatabase.find(x => x.id === hid); if (h) openBookingModal(h); history.replaceState(null, '', window.location.pathname); } } catch (e) { }
  const navToggle = document.getElementById('navToggle'); if (navToggle) navToggle.addEventListener('click', () => document.querySelector('.nav-links')?.classList.toggle('mobile-open'));
  loadChatHistory();
});
// Owner dashboard link
const userRole = JSON.parse(localStorage.getItem('aurum-user') || 'null');
if (userRole && userRole.role === 'owner') {
  const loggedDiv = document.getElementById('navUserLogged');
  if (loggedDiv && !document.querySelector('.nav-btn-dash')) {
    const dashLink = document.createElement('a');
    dashLink.href = 'owner-dashboard.html';
    dashLink.className = 'nav-btn nav-btn-dash';
    dashLink.style.cssText = 'margin-right:8px;';
    dashLink.textContent = 'Dashboard';
    loggedDiv.insertBefore(dashLink, loggedDiv.firstChild);
  }
}
