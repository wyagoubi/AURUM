/* AURUM — app.js (FIXED: real images, simple search, working AI, localStorage bookings) */

const API_BASE = 'https://aurum-m4v8.onrender.com/api';

// ========== THEME ==========
const body = document.body;
const savedTheme = localStorage.getItem('aurum-theme') || 'dark-mode';
body.className = savedTheme;
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
if (themeIcon) themeIcon.textContent = savedTheme === 'dark-mode' ? '☀' : '☾';
themeToggle?.addEventListener('click', () => {
  const next = body.classList.contains('dark-mode') ? 'light-mode' : 'dark-mode';
  body.className = next;
  localStorage.setItem('aurum-theme', next);
  if (themeIcon) themeIcon.textContent = next === 'dark-mode' ? '☀' : '☾';
});

// ========== SESSION & NAV ==========
let currentUser = JSON.parse(localStorage.getItem('aurum-user') || 'null');
const navUser = document.getElementById('navUser');
const navUserLogged = document.getElementById('navUserLogged');
const navAvatar = document.getElementById('navAvatar');
const navUsername = document.getElementById('navUsername');

function updateNav() {
  currentUser = JSON.parse(localStorage.getItem('aurum-user') || 'null');
  if (currentUser?.email) {
    if (navUser) navUser.style.display = 'none';
    if (navUserLogged) navUserLogged.classList.remove('hidden');
    if (navAvatar) navAvatar.textContent = currentUser.initials || currentUser.email[0].toUpperCase();
    if (navUsername) navUsername.textContent = currentUser.name?.split(' ')[0] || 'User';
  } else {
    if (navUser) navUser.style.display = '';
    if (navUserLogged) navUserLogged.classList.add('hidden');
  }
}
updateNav();

document.getElementById('navSignout')?.addEventListener('click', () => {
  localStorage.removeItem('aurum-user');
  updateNav();
  showToast('Signed out');
  window.location.reload();
});

// ========== PAGE NAVIGATION ==========
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
function showPage(pageId) {
  pages.forEach(p => p.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('active'));
  document.getElementById('page-' + pageId)?.classList.add('active');
  navLinks.forEach(l => { if (l.dataset.page === pageId) l.classList.add('active'); });
}
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    if (link.dataset.page) {
      e.preventDefault();
      showPage(link.dataset.page);
    }
  });
});

// ========== HOTELS WITH REAL IMAGES (UNSPLASH) ==========
const hotelsData = [
  { id:1, name:'Le Grand Hôtel', city:'Paris', country:'France', stars:5, price:450, rating:4.9, desc:'Belle Époque grandeur in Paris', amenities:['Wi-Fi','Spa','Restaurant','Concierge'], image:'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600' },
  { id:2, name:'Hôtel de Crillon', city:'Paris', country:'France', stars:5, price:980, rating:4.95, desc:'Palatial 18th-century landmark', amenities:['Wi-Fi','Pool','Spa','Restaurant'], image:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600' },
  { id:3, name:'Burj Al Arab', city:'Dubai', country:'UAE', stars:5, price:1800, rating:4.85, desc:'World\'s most iconic hotel', amenities:['Pool','Spa','Restaurant','Bar'], image:'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600' },
  { id:4, name:'Atlantis The Palm', city:'Dubai', country:'UAE', stars:5, price:750, rating:4.7, desc:'Resort on Palm Jumeirah', amenities:['Pool','Aquarium','Restaurant','Bar'], image:'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600' },
  { id:5, name:'The Ritz London', city:'London', country:'UK', stars:5, price:1200, rating:4.92, desc:'Timeless elegance in Piccadilly', amenities:['Restaurant','Bar','Concierge'], image:'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600' },
  { id:6, name:'Royal Mansour', city:'Marrakesh', country:'Morocco', stars:5, price:1400, rating:4.98, desc:'Palatial riads with private pools', amenities:['Pool','Spa','Restaurant'], image:'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600' },
  { id:7, name:'Aman Tokyo', city:'Tokyo', country:'Japan', stars:5, price:1100, rating:4.96, desc:'Urban sanctuary with city views', amenities:['Pool','Spa','Restaurant'], image:'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600' },
  { id:8, name:'Soneva Fushi', city:'Maldives', country:'Maldives', stars:5, price:2200, rating:4.99, desc:'Overwater villas', amenities:['Pool','Spa','Restaurant'], image:'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600' }
];

let hotelDatabase = hotelsData;

// ========== SIMPLE SEARCH ==========
const searchBtn = document.getElementById('searchBtn');
const locationInput = document.getElementById('s-location');
const roomsSelect = document.getElementById('s-rooms');
const childrenSelect = document.getElementById('s-children');
const priceSelect = document.getElementById('s-price');
const resultsGrid = document.getElementById('resultsGrid');
const resultsTitle = document.getElementById('resultsTitle');
const resultsMeta = document.getElementById('resultsMeta');

function filterHotels() {
  const location = locationInput?.value.trim().toLowerCase() || '';
  const rooms = parseInt(roomsSelect?.value) || 1;
  const children = parseInt(childrenSelect?.value) || 0;
  const maxPrice = priceSelect?.value !== 'any' ? parseInt(priceSelect.value) : null;
  return hotelDatabase.filter(hotel => {
    if (location && !hotel.city.toLowerCase().includes(location)) return false;
    if (maxPrice && hotel.price > maxPrice) return false;
    return true;
  });
}

function renderResults() {
  const hotels = filterHotels();
  const loc = locationInput?.value.trim() || 'All Destinations';
  resultsTitle.innerHTML = `Hotels in <em>${loc}</em>`;
  resultsMeta.textContent = `Showing ${hotels.length} properties`;
  if (!resultsGrid) return;
  resultsGrid.innerHTML = '';
  if (hotels.length === 0) {
    resultsGrid.innerHTML = '<div class="no-results">No hotels found. Try different filters.</div>';
    return;
  }
  hotels.forEach(hotel => {
    const card = document.createElement('div');
    card.className = 'hotel-card';
    card.innerHTML = `
      <div class="hotel-card-img">
        <img src="${hotel.image}" alt="${hotel.name}" style="width:100%;height:180px;object-fit:cover">
        <div class="hotel-badge">${hotel.stars} ★</div>
      </div>
      <div class="hotel-card-body">
        <div class="hotel-card-name">${hotel.name}</div>
        <div class="hotel-card-location">📍 ${hotel.city}, ${hotel.country}</div>
        <div class="hotel-card-desc">${hotel.desc}</div>
        <div class="hotel-card-amenities">${hotel.amenities.slice(0,4).map(a => `<span class="amenity-tag">${a}</span>`).join('')}</div>
        <div class="hotel-card-footer">
          <div><span class="price-num">$${hotel.price}</span> <span class="price-per">/night</span></div>
          <div class="stars">${'★'.repeat(hotel.stars)} (${hotel.rating})</div>
        </div>
        <button class="hotel-book-btn" data-id="${hotel.id}">Book Now</button>
      </div>
    `;
    card.querySelector('.hotel-book-btn').addEventListener('click', () => openBookingModal(hotel));
    resultsGrid.appendChild(card);
  });
}

searchBtn?.addEventListener('click', () => {
  renderResults();
  showPage('results');
});

// ========== BOOKING MODAL (localStorage) ==========
let currentBookingHotel = null;

function openBookingModal(hotel) {
  if (!currentUser?.email) {
    alert('Please sign in first');
    window.location.href = 'auth.html';
    return;
  }
  currentBookingHotel = hotel;
  const modal = document.getElementById('bookingModal');
  if (!modal) return;
  document.getElementById('modalHotelName').textContent = hotel.name;
  document.getElementById('modalHotelLoc').textContent = `${hotel.city}, ${hotel.country}`;
  document.getElementById('summaryRate').textContent = `$${hotel.price}/night`;
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
  document.getElementById('bookingCheckin').value = tomorrow.toISOString().split('T')[0];
  document.getElementById('bookingCheckout').value = nextWeek.toISOString().split('T')[0];
  updateSummary();
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function updateSummary() {
  const checkin = document.getElementById('bookingCheckin')?.value;
  const checkout = document.getElementById('bookingCheckout')?.value;
  if (!checkin || !checkout || !currentBookingHotel) return;
  const nights = Math.ceil((new Date(checkout) - new Date(checkin)) / (1000*60*60*24));
  const total = nights * currentBookingHotel.price;
  document.getElementById('summaryNights').textContent = nights;
  document.getElementById('summaryTotal').textContent = `$${total}`;
}

document.getElementById('bookingCheckin')?.addEventListener('change', updateSummary);
document.getElementById('bookingCheckout')?.addEventListener('change', updateSummary);
document.getElementById('bookingClose')?.addEventListener('click', () => {
  document.getElementById('bookingModal')?.classList.remove('open');
  document.body.style.overflow = '';
});

document.getElementById('confirmBooking')?.addEventListener('click', () => {
  const checkin = document.getElementById('bookingCheckin')?.value;
  const checkout = document.getElementById('bookingCheckout')?.value;
  const rooms = parseInt(document.getElementById('bookingRooms')?.value) || 1;
  const nights = Math.ceil((new Date(checkout) - new Date(checkin)) / (1000*60*60*24));
  const total = nights * currentBookingHotel.price * rooms;
  const booking = {
    id: Date.now(),
    hotelName: currentBookingHotel.name,
    hotelCity: currentBookingHotel.city,
    checkIn: checkin,
    checkOut: checkout,
    nights: nights,
    total: total,
    status: 'confirmed',
    userId: currentUser.email,
    bookedAt: new Date().toISOString()
  };
  let bookings = JSON.parse(localStorage.getItem('aurum-bookings') || '[]');
  bookings.push(booking);
  localStorage.setItem('aurum-bookings', JSON.stringify(bookings));
  document.getElementById('bookingModal')?.classList.remove('open');
  showToast(`Booking confirmed! Total: $${total}`);
  renderResults();
});

// ========== SIMPLE AI (SHORT & CLEAN) ==========
function openAIChat() {
  const city = prompt('AURUM Concierge: Which city would you like to visit? (e.g., Paris, Dubai, London)');
  if (!city) return;
  const found = hotelsData.find(h => h.city.toLowerCase() === city.toLowerCase());
  if (found) {
    alert(`✨ We have ${found.name} in ${city} from $${found.price}/night. Use the search bar to see more.`);
    locationInput.value = city;
    renderResults();
    showPage('results');
  } else {
    alert(`We don't have hotels in ${city} yet. Try Paris, Dubai, London, Marrakesh, Tokyo, or Maldives.`);
  }
}
document.getElementById('openAiChat')?.addEventListener('click', openAIChat);
document.getElementById('aiFab')?.addEventListener('click', openAIChat);

// ========== FEATURED DESTINATIONS ==========
document.querySelectorAll('.featured-card').forEach(card => {
  card.addEventListener('click', () => {
    const dest = card.dataset.dest;
    if (dest) {
      locationInput.value = dest;
      renderResults();
      showPage('results');
    }
  });
});

// ========== TOAST & INIT ==========
function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

window.addEventListener('DOMContentLoaded', () => {
  renderResults();
  showPage('home');
  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      document.querySelector('.nav-links')?.classList.toggle('mobile-open');
    });
  }
});
