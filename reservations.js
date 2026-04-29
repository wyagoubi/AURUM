/* AURUM — reservations.js */
/* Simplified: Cancel button ALWAYS visible for every booking (if not already cancelled) */

const API_BASE = 'https://aurum-m4v8.onrender.com/api';
const body = document.body;

/* ── Theme ── */
const savedTheme = localStorage.getItem('aurum-theme') || 'dark-mode';
body.className = savedTheme;
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
function syncThemeIcon() { if (themeIcon) themeIcon.textContent = body.classList.contains('dark-mode') ? '☀' : '☾'; }
syncThemeIcon();
themeToggle?.addEventListener('click', () => {
  const isDark = body.classList.contains('dark-mode');
  body.className = isDark ? 'light-mode' : 'dark-mode';
  localStorage.setItem('aurum-theme', body.className);
  syncThemeIcon();
});

/* ── Mobile nav ── */
document.getElementById('navToggle')?.addEventListener('click', () =>
  document.querySelector('.nav-links')?.classList.toggle('mobile-open'));

/* ── Toast ── */
function showToast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 350); }, 3500);
}

/* ── Auth ── */
const user = JSON.parse(localStorage.getItem('aurum-user') || 'null');
const navUserLogged = document.getElementById('navUserLogged');
const navAvatar = document.getElementById('navAvatar');
const navUsername = document.getElementById('navUsername');
const navUserGuest = document.getElementById('navUser');
if (user) {
  navUserLogged?.classList.remove('hidden');
  if (navAvatar) navAvatar.textContent = user.initials || (user.name?.[0] ?? 'A').toUpperCase();
  if (navUsername) navUsername.textContent = (user.name || 'Guest').split(' ')[0];
} else {
  navUserGuest?.classList.remove('hidden');
}
document.getElementById('navSignout')?.addEventListener('click', () => {
  localStorage.removeItem('aurum-user');
  localStorage.removeItem('aurum-token');
  window.location.href = 'auth.html';
});

/* ── Images (abbreviated, keep your full list) ── */
const HOTEL_COVERS = {
  'Le Grand Aurum Paris': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80',
  'Aurum Palace London': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80',
  // ... add all your hotels
};
const ROOM_COVERS = {
  'Deluxe Room': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&q=80',
  'Junior Suite': 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=300&q=80',
  'Grand Suite': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=300&q=80',
  'Presidential Suite': 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300&q=80',
};

let allBookings = [];
let activeFilter = 'all';
let searchTerm = '';
const listEl = document.getElementById('resList');
const searchEl = document.getElementById('resSearch');
const filtersEl = document.getElementById('resFilters');

function fmtMoney(n) { return '$' + (Number(n) || 0).toLocaleString(); }
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
function escapeHtml(s) { return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function normalizeBooking(b) {
  return {
    id: b.id,
    reference: b.reference || ('AUR-' + String(b.id).padStart(6, '0')),
    hotelName: b.hotel_name || b.hotelName || 'AURUM Stay',
    roomType: b.room_type || b.roomType || 'Deluxe Room',
    rooms: b.rooms || 1,
    guests: b.guests || 1,
    checkIn: b.check_in || b.checkIn,
    checkOut: b.check_out || b.checkOut,
    nights: b.nights || 1,
    total: b.total || 0,
    status: b.status || 'confirmed',
    paymentLast4: b.payment_last4 || b.paymentLast4 || '',
    createdAt: b.created_at || b.createdAt || new Date().toISOString(),
  };
}

/* ── Cancel function ── */
async function cancelBooking(bookingId, button) {
  button.disabled = true;
  button.textContent = 'Cancelling...';
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: '' })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Cancel failed');
    // Update local state
    const idx = allBookings.findIndex(b => b.id === bookingId);
    if (idx !== -1) allBookings[idx].status = 'cancelled';
    renderList();
    showToast('Reservation cancelled.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    button.disabled = false;
    button.textContent = 'Cancel';
  }
}

/* ── Render list – Cancel button appears for EVERY non-cancelled booking ── */
function renderList() {
  if (!allBookings.length) {
    listEl.innerHTML = `<div class="res-state"><h3>No reservations yet</h3><p>Book a hotel to see it here.</p><a class="btn-ghost" href="index.html">Discover hotels</a></div>`;
    return;
  }
  const term = searchTerm.toLowerCase();
  const filtered = allBookings.filter(b => {
    if (activeFilter === 'upcoming' && b.status !== 'upcoming') return false;
    if (activeFilter === 'past' && b.status !== 'past') return false;
    if (activeFilter === 'cancelled' && b.status !== 'cancelled') return false;
    if (!term) return true;
    return (b.hotelName + b.reference).toLowerCase().includes(term);
  });
  if (!filtered.length) {
    listEl.innerHTML = `<div class="res-state"><h3>Nothing matches</h3><p>Try different filters.</p></div>`;
    return;
  }
  listEl.innerHTML = filtered.map(b => {
    const isCancelled = b.status === 'cancelled';
    const cover = HOTEL_COVERS[b.hotelName] || '';
    const roomImg = ROOM_COVERS[b.roomType] || ROOM_COVERS['Deluxe Room'];
    return `
      <article class="res-card">
        <div class="res-card-art" style="background:url('${cover}') center/cover no-repeat;">
          <div class="res-card-art-ref">${escapeHtml(b.reference)}</div>
        </div>
        <div class="res-card-body">
          <h2 class="res-hotel-name">${escapeHtml(b.hotelName)}</h2>
          <div class="res-room-row">
            <img class="res-room-img" src="${roomImg}" alt="${b.roomType}" loading="lazy"/>
            <span>${b.roomType} · ${b.rooms} room(s) · ${b.guests} guest(s)</span>
          </div>
          <div class="res-detail-grid">
            <div><div class="res-detail-label">Check in</div><div>${fmtDate(b.checkIn)}</div></div>
            <div><div class="res-detail-label">Check out</div><div>${fmtDate(b.checkOut)}</div></div>
            <div><div class="res-detail-label">Nights</div><div>${b.nights}</div></div>
            <div><div class="res-detail-label">Booked</div><div>${fmtDate(b.createdAt)}</div></div>
          </div>
        </div>
        <div class="res-card-side">
          <div class="res-total">${fmtMoney(b.total)}</div>
          ${b.paymentLast4 ? `<div style="font-size:10px">•••• ${b.paymentLast4}</div>` : ''}
          ${!isCancelled ? `<button class="btn btn-danger cancel-btn" data-id="${b.id}">Cancel</button>` : '<span>Cancelled</span>'}
        </div>
      </article>`;
  }).join('');

  // Attach cancel button events
  document.querySelectorAll('.cancel-btn').forEach(btn => {
    const id = parseInt(btn.dataset.id);
    btn.addEventListener('click', () => cancelBooking(id, btn));
  });
}

/* ── Load bookings ── */
async function load() {
  if (!user) {
    listEl.innerHTML = `<div class="res-state"><h3>Please sign in</h3><a class="btn-ghost" href="auth.html">Sign in</a></div>`;
    return;
  }
  listEl.innerHTML = '<div class="res-state"><p>Loading reservations...</p></div>';
  try {
    const res = await fetch(`${API_BASE}/bookings`, { credentials: 'include' });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      allBookings = data.data.map(normalizeBooking);
    } else {
      throw new Error('No data');
    }
  } catch (err) {
    console.error(err);
    allBookings = [];
  }
  renderList();
}

/* ── Events ── */
searchEl?.addEventListener('input', e => { searchTerm = e.target.value.trim(); renderList(); });
filtersEl?.addEventListener('click', e => {
  const btn = e.target.closest('.res-chip');
  if (!btn) return;
  filtersEl.querySelectorAll('.res-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = btn.dataset.filter;
  renderList();
});
load();
