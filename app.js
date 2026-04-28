/* ═══════════════════════════════════════════════
   AURUM — app.js (COMPLETE FIXED VERSION)
   Short, clean, with real images
═══════════════════════════════════════════════ */

const API_BASE = 'https://aurum-m4v8.onrender.com/api';

// ========== REAL HOTEL IMAGES BY CITY ==========
const cityImages = {
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
  'Dubai': 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600',
  'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600',
  'Marrakesh': 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600',
  'Marrakech': 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600',
  'Maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600',
  'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600',
  'Florence': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600'
};

// ========== HOTELS DATABASE (local fallback) ==========
const localHotels = [
  { id:1, name:'Le Grand Hôtel', city:'Paris', country:'France', stars:5, price:450, rating:4.9, desc:'Belle Époque grandeur at the heart of Paris', amenities:['Wi-Fi','Spa','Restaurant','Concierge','Bar'] },
  { id:2, name:'Hôtel de Crillon', city:'Paris', country:'France', stars:5, price:980, rating:4.95, desc:'A palatial 18th-century landmark', amenities:['Wi-Fi','Pool','Spa','Restaurant','Concierge'] },
  { id:3, name:'Burj Al Arab', city:'Dubai', country:'UAE', stars:5, price:1800, rating:4.85, desc:'The world\'s most iconic hotel', amenities:['Pool','Spa','Restaurant','Bar','Transfer'] },
  { id:4, name:'Atlantis The Palm', city:'Dubai', country:'UAE', stars:5, price:750, rating:4.7, desc:'Iconic resort on Palm Jumeirah', amenities:['Pool','Aquarium','Restaurant','Bar'] },
  { id:5, name:'The Ritz London', city:'London', country:'UK', stars:5, price:1200, rating:4.92, desc:'Timeless elegance in Piccadilly', amenities:['Restaurant','Bar','Concierge','Tea'] },
  { id:6, name:'Royal Mansour', city:'Marrakesh', country:'Morocco', stars:5, price:1400, rating:4.98, desc:'Palatial riads with private pools', amenities:['Pool','Spa','Restaurant','Butler'] },
  { id:7, name:'Aman Tokyo', city:'Tokyo', country:'Japan', stars:5, price:1100, rating:4.96, desc:'Urban sanctuary with city views', amenities:['Pool','Spa','Restaurant','Yoga'] },
  { id:8, name:'Soneva Fushi', city:'Maldives', country:'Maldives', stars:5, price:2200, rating:4.99, desc:'No shoes, no news luxury', amenities:['Pool','Spa','Restaurant','Cinema'] },
  { id:9, name:'Marina Bay Sands', city:'Singapore', country:'Singapore', stars:5, price:650, rating:4.8, desc:'Iconic infinity pool', amenities:['Pool','Casino','Restaurant','Bar'] },
  { id:10, name:'Belmond Hotel', city:'Florence', country:'Italy', stars:5, price:890, rating:4.88, desc:'Renaissance palace on the Arno', amenities:['Pool','Restaurant','Bar','Concierge'] }
];

let hotelDatabase = [];

// ========== THEME ==========
const body = document.body;
const savedTheme = localStorage.getItem('aurum-theme') || 'dark-mode';
body.className = savedTheme;
document.getElementById('themeToggle')?.addEventListener('click', () => {
  const next = body.classList.contains('dark-mode') ? 'light-mode' : 'dark-mode';
  body.className = next;
  localStorage.setItem('aurum-theme', next);
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = next === 'dark-mode' ? '☀' : '☾';
});

// ========== SESSION ==========
function updateNav() {
  const user = JSON.parse(localStorage.getItem('aurum-user') || 'null');
  const navUser = document.getElementById('navUser');
  const navUserLogged = document.getElementById('navUserLogged');
  if (user && user.email) {
    if (navUser) navUser.style.display = 'none';
    if (navUserLogged) navUserLogged.classList.remove('hidden');
    const avatar = document.getElementById('navAvatar');
    const username = document.getElementById('navUsername');
    if (avatar) avatar.textContent = user.initials || user.email[0].toUpperCase();
    if (username) username.textContent = user.name?.split(' ')[0] || 'User';
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
  location.reload();
});

// Fix login links
document.querySelectorAll('#navUser a').forEach(link => {
  link.addEventListener('click', e => e.stopPropagation());
});

// ========== LOAD HOTELS ==========
async function loadHotels() {
  try {
    const res = await fetch(`${API_BASE}/hotels`);
    const data = await res.json();
    if (data.success && data.data.length) {
      hotelDatabase = data.data;
    } else {
      hotelDatabase = localHotels;
    }
  } catch(e) {
    console.warn('Using local hotels');
    hotelDatabase = localHotels;
  }
  renderResults('', 1, 0, 'any');
}

// ========== SEARCH ==========
function filterHotels(location, rooms, children, price) {
  return hotelDatabase.filter(h => {
    const matchLoc = !location || h.city.toLowerCase().includes(location.toLowerCase());
    const matchPrice = price === 'any' ? true : (price === '1001' ? h.price > 1000 : h.price <= parseInt(price));
    return matchLoc && matchPrice;
  });
}

function renderResults(location, rooms, children, price) {
  const hotels = filterHotels(location, rooms, children, price);
  const grid = document.getElementById('resultsGrid');
  const title = document.getElementById('resultsTitle');
  const meta = document.getElementById('resultsMeta');
  
  if (title) title.innerHTML = `Hotels in <em>${location || 'All Destinations'}</em>`;
  if (meta) meta.textContent = `Showing ${hotels.length} properties`;
  if (!grid) return;
  grid.innerHTML = '';
  
  if (!hotels.length) {
    grid.innerHTML = '<div class="no-results">No hotels found. Try different filters.</div>';
    return;
  }
  
  hotels.forEach((h, i) => grid.appendChild(createHotelCard(h, i)));
}

function createHotelCard(hotel, delay) {
  const card = document.createElement('div');
  card.className = 'hotel-card';
  card.style.animation = `fadeUp 0.4s ease ${delay * 0.05}s forwards`;
  card.style.opacity = '0';
  
  const stars = '★'.repeat(hotel.stars) + '☆'.repeat(5 - hotel.stars);
  const imageUrl = cityImages[hotel.city] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600';
  
  card.innerHTML = `
    <div class="hotel-card-img">
      <img src="${imageUrl}" alt="${hotel.name}" style="width:100%;height:180px;object-fit:cover">
      <div class="hotel-badge">${hotel.stars} ★</div>
      <button class="hotel-view-photos">📷 Photos</button>
    </div>
    <div class="hotel-card-body">
      <div class="hotel-card-name">${hotel.name}</div>
      <div class="hotel-card-location">📍 ${hotel.city}, ${hotel.country}</div>
      <div class="hotel-card-desc">${hotel.desc || 'Luxury hotel with exceptional service.'}</div>
      <div class="hotel-card-amenities">${(hotel.amenities || []).slice(0,4).map(a => `<span class="amenity-tag">${a}</span>`).join('')}</div>
      <div class="hotel-card-footer">
        <div><span class="price-num">$${hotel.price}</span> <span class="price-per">/night</span></div>
        <div class="stars">${stars} (${hotel.rating})</div>
      </div>
      <button class="hotel-book-btn">Book Now</button>
    </div>
  `;
  
  card.querySelector('.hotel-view-photos')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showGallery(hotel);
  });
  
  card.querySelector('.hotel-book-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const user = JSON.parse(localStorage.getItem('aurum-user') || 'null');
    if (user) openBookingModal(hotel);
    else showToast('Please sign in first', 'error');
  });
  
  return card;
}

// ========== SIMPLE GALLERY ==========
function showGallery(hotel) {
  const images = [
    cityImages[hotel.city] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'
  ];
  alert(`📸 ${hotel.name}\nImages: ${images.join(', ')}\n(Full gallery coming soon)`);
}

// ========== BOOKING MODAL ==========
let currentBookingHotel = null;

function openBookingModal(hotel) {
  currentBookingHotel = hotel;
  const modal = document.getElementById('bookingModal');
  if (!modal) return;
  
  document.getElementById('modalHotelName').textContent = hotel.name;
  document.getElementById('modalHotelLoc').textContent = `${hotel.city}, ${hotel.country}`;
  document.getElementById('summaryRate').textContent = `$${hotel.price}/night`;
  
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
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

document.getElementById('confirmBooking')?.addEventListener('click', async () => {
  const user = JSON.parse(localStorage.getItem('aurum-user') || 'null');
  if (!user) {
    showToast('Please sign in first', 'error');
    window.location.href = 'auth.html';
    return;
  }
  
  const checkin = document.getElementById('bookingCheckin')?.value;
  const checkout = document.getElementById('bookingCheckout')?.value;
  const rooms = parseInt(document.getElementById('bookingRooms')?.value) || 1;
  const nights = Math.ceil((new Date(checkout) - new Date(checkin)) / (1000*60*60*24));
  const total = nights * currentBookingHotel.price * rooms;
  
  const booking = {
    id: Date.now(),
    hotelId: currentBookingHotel.id,
    hotelName: currentBookingHotel.name,
    city: currentBookingHotel.city,
    checkIn: checkin,
    checkOut: checkout,
    nights: nights,
    rooms: rooms,
    total: total,
    status: 'confirmed',
    userId: user.email,
    bookedAt: new Date().toISOString()
  };
  
  let bookings = JSON.parse(localStorage.getItem('aurum-bookings') || '[]');
  bookings.push(booking);
  localStorage.setItem('aurum-bookings', JSON.stringify(bookings));
  
  document.getElementById('bookingModal')?.classList.remove('open');
  showToast(`✅ Booking confirmed! Total: $${total}`, 'success');
  renderResults('', 1, 0, 'any');
});

// ========== SIMPLE AI (SHORT RESPONSES) ==========
function askAI() {
  const msg = prompt('AURUM Concierge: Where would you like to stay?\n(e.g., "Paris hotels under $500")');
  if (!msg) return;
  
  const lower = msg.toLowerCase();
  let city = '';
  let maxPrice = null;
  
  if (lower.includes('paris')) city = 'Paris';
  else if (lower.includes('dubai')) city = 'Dubai';
  else if (lower.includes('london')) city = 'London';
  else if (lower.includes('marrakesh')) city = 'Marrakesh';
  else if (lower.includes('tokyo')) city = 'Tokyo';
  else alert('Try: Paris, Dubai, London, Marrakesh, or Tokyo');
  
  const priceMatch = lower.match(/\$?(\d+)/);
  if (priceMatch) maxPrice = parseInt(priceMatch[1]);
  
  if (city) {
    document.getElementById('s-location').value = city;
    if (maxPrice && maxPrice <= 500) document.getElementById('s-price').value = '500';
    else if (maxPrice && maxPrice <= 1000) document.getElementById('s-price').value = '1000';
    renderResults(city, 1, 0, document.getElementById('s-price').value);
    showPage('results');
    alert(`✨ Showing ${city} hotels${maxPrice ? ` under $${maxPrice}` : ''}`);
  }
}

document.getElementById('openAiChat')?.addEventListener('click', askAI);
document.getElementById('aiFab')?.addEventListener('click', askAI);

// ========== NAVIGATION ==========
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');

function showPage(pageId) {
  pages.forEach(p => p.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
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

document.getElementById('searchBtn')?.addEventListener('click', () => {
  const location = document.getElementById('s-location')?.value.trim() || '';
  const rooms = parseInt(document.getElementById('s-rooms')?.value) || 1;
  const children = parseInt(document.getElementById('s-children')?.value) || 0;
  const price = document.getElementById('s-price')?.value || 'any';
  if (!location) { showToast('Please enter a destination', 'error'); return; }
  renderResults(location, rooms, children, price);
  showPage('results');
});

document.querySelectorAll('.featured-card').forEach(card => {
  card.addEventListener('click', () => {
    const dest = card.dataset.dest;
    if (dest) {
      document.getElementById('s-location').value = dest;
      renderResults(dest, 1, 0, 'any');
      showPage('results');
    }
  });
});

// ========== TOAST ==========
function showToast(msg, type = '') {
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

// ========== INIT ==========
window.addEventListener('DOMContentLoaded', () => {
  loadHotels();
  const navToggle = document.getElementById('navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      document.querySelector('.nav-links')?.classList.toggle('mobile-open');
    });
  }
});

// ========== OWNER DASHBOARD LINK ==========
const userRole = JSON.parse(localStorage.getItem('aurum-user') || 'null');
if (userRole?.role === 'owner') {
  const loggedDiv = document.getElementById('navUserLogged');
  if (loggedDiv) {
    const dashLink = document.createElement('a');
    dashLink.href = 'owner-dashboard.html';
    dashLink.className = 'nav-btn';
    dashLink.textContent = 'Dashboard';
    loggedDiv.insertBefore(dashLink, loggedDiv.firstChild);
  }
}
