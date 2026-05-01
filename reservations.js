/* AURUM — reservations.js (نهائي - يعمل على تحميل الحجوزات والأزرار) */

const API_BASE = 'https://aurum-m4v8.onrender.com/api';
const body = document.body;

/* ── Theme ── */
const savedTheme = localStorage.getItem('aurum-theme') || 'dark-mode';
body.className = savedTheme;
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
function syncThemeIcon() {
  if (themeIcon) themeIcon.textContent = body.classList.contains('dark-mode') ? '☀' : '☾';
}
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
const navAvatar     = document.getElementById('navAvatar');
const navUsername   = document.getElementById('navUsername');
const navUserGuest  = document.getElementById('navUser');

if (user && user.email) {
  navUserGuest?.classList.add('hidden');
  navUserLogged?.classList.remove('hidden');
  if (navAvatar) navAvatar.textContent = user.initials || (user.name?.[0] ?? 'A').toUpperCase();
  if (navUsername) navUsername.textContent = (user.name || 'Guest').split(' ')[0];
} else {
  navUserGuest?.classList.remove('hidden');
  navUserLogged?.classList.add('hidden');
}

document.getElementById('navSignout')?.addEventListener('click', () => {
  localStorage.removeItem('aurum-user');
  localStorage.removeItem('aurum-token');
  window.location.href = 'auth.html';
});

/* ── Images ── */
const HOTEL_COVERS = {
  'Le Grand Aurum Paris':      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80',
  'Aurum Palace London':       'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80',
  'Aurum Medina Marrakesh':    'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80',
  'Aurum Sakura Tokyo':        'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
  'Aurum Overwater Maldives':  'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400&q=80',
  'Aurum Summit Aspen':        'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80',
  'Aurum Duomo Florence':      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80',
  'Aurum Sentosa Singapore':   'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80',
  'Aurum Royale Dubai':        'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&q=80',
  'Aurum Bosphorus Istanbul':  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400&q=80',
  'Aurum Riviera Santorini':   'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&q=80',
  'Aurum Zen Bali':            'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
};
const ROOM_COVERS = {
  'Deluxe Room':        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&q=80',
  'Junior Suite':       'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=300&q=80',
  'Grand Suite':        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=300&q=80',
  'Presidential Suite': 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300&q=80',
};

let allBookings  = [];
let activeFilter = 'upcoming';
let searchTerm   = '';
const listEl    = document.getElementById('resList');
const searchEl  = document.getElementById('resSearch');
const filtersEl = document.getElementById('resFilters');

function fmtMoney(n) { return '$' + (Number(n) || 0).toLocaleString(); }
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
function escapeHtml(s) {
  return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function normalizeBooking(b) {
  const serverStatus = (b.status || '').toLowerCase();
  let status;
  if (serverStatus === 'cancelled') {
    status = 'cancelled';
  } else {
    const now      = new Date(); now.setUTCHours(0, 0, 0, 0);
    const checkIn  = new Date((b.check_in  || b.checkIn)  + 'T00:00:00Z');
    const checkOut = new Date((b.check_out || b.checkOut) + 'T00:00:00Z');
    if      (checkOut < now)                   status = 'past';
    else if (checkIn <= now && checkOut >= now) status = 'current';
    else                                        status = 'upcoming';
  }
  return {
    id:           b.id,
    reference:    b.reference || ('AUR-' + String(b.id).padStart(6, '0')),
    hotelName:    b.hotel_name || b.hotelName || 'AURUM Stay',
    roomType:     b.room_type  || b.roomType  || 'Deluxe Room',
    rooms:        b.rooms  || 1,
    guests:       b.guests || 1,
    checkIn:      b.check_in  || b.checkIn,
    checkOut:     b.check_out || b.checkOut,
    nights:       b.nights || 1,
    total:        b.total  || 0,
    status,
    paymentLast4: b.payment_last4 || b.paymentLast4 || '',
    createdAt:    b.created_at   || b.createdAt    || new Date().toISOString(),
  };
}

/* ── Cancel booking ── */
async function cancelBooking(bookingId, button) {
  if (!confirm('Are you sure you want to cancel this reservation?')) return;

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
    if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);

    // إعادة تحميل القائمة بالكامل
    await load();
    showToast('Reservation cancelled successfully.', 'success');
  } catch (err) {
    console.error('[cancel] error:', err.message);
    showToast(`Error: ${err.message}`, 'error');
    button.disabled = false;
    button.textContent = 'Cancel';
  }
}

/* ── Render list ── */
function renderList() {
  if (!allBookings.length) {
    listEl.innerHTML = `
      <div class="res-state">
        <h3>No reservations yet</h3>
        <p>Book a hotel to see it here.</p>
        <a class="btn-ghost" href="index.html?page=home">Discover hotels</a>
      </div>`;
    return;
  }

  const term = searchTerm.toLowerCase();
  const filtered = allBookings.filter(b => {
    if (activeFilter === 'upcoming' && (b.status !== 'upcoming' && b.status !== 'current')) return false;
    if (activeFilter === 'past' && b.status !== 'past') return false;
    if (activeFilter === 'cancelled' && b.status !== 'cancelled') return false;
    if (activeFilter === 'all' && b.status === 'cancelled') return false;
    if (!term) return true;
    return (b.hotelName + b.reference).toLowerCase().includes(term);
  });

  if (!filtered.length) {
    listEl.innerHTML = `<div class="res-state"><h3>Nothing matches</h3><p>Try different filters.</p></div>`;
    return;
  }

  listEl.innerHTML = filtered.map(b => {
    const isCancelled = b.status === 'cancelled';
    const cover   = HOTEL_COVERS[b.hotelName] || '';
    const roomImg = ROOM_COVERS[b.roomType]   || ROOM_COVERS['Deluxe Room'];
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
          ${!isCancelled
            ? `<button class="btn btn-danger cancel-btn" data-id="${b.id}">Cancel</button>`
            : '<span class="cancelled-badge">Cancelled</span>'
          }
        </div>
      </article>`;
  }).join('');
}

function updateFilterUI() {
  const chips = document.querySelectorAll('.res-chip');
  chips.forEach(chip => {
    if (chip.dataset.filter === activeFilter) chip.classList.add('active');
    else chip.classList.remove('active');
  });
}

/* ── Load bookings from server ── */
async function load() {
  // إذا لم يكن مستخدم مسجل، اعرض رسالة تسجيل الدخول
  if (!user) {
    listEl.innerHTML = `<div class="res-state"><h3>Please sign in</h3><a class="btn-ghost" href="auth.html">Sign in</a></div>`;
    return;
  }

  // عرض مؤشر التحميل
  listEl.innerHTML = '<div class="res-state"><div class="res-spinner"></div><p>Loading reservations...</p></div>';

  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      allBookings = data.data.map(normalizeBooking);
    } else {
      throw new Error(data.error || 'Invalid data');
    }
    renderList();
    updateFilterUI();
  } catch (err) {
    console.error('Load error:', err);
    listEl.innerHTML = `
      <div class="res-state">
        <h3>Unable to load reservations</h3>
        <p>${err.message}</p>
        <button class="btn-ghost" onclick="location.reload()">Refresh page</button>
      </div>`;
    showToast('Failed to load reservations. Please refresh.', 'error');
  }
}

/* ── Events ── */
searchEl?.addEventListener('input', e => { searchTerm = e.target.value.trim(); renderList(); });

filtersEl?.addEventListener('click', e => {
  const btn = e.target.closest('.res-chip');
  if (!btn) return;
  activeFilter = btn.dataset.filter;
  updateFilterUI();
  renderList();
});

listEl.addEventListener('click', e => {
  const btn = e.target.closest('.cancel-btn');
  if (!btn || btn.disabled) return;
  const id = parseInt(btn.dataset.id);
  if (!isNaN(id)) cancelBooking(id, btn);
});

load();
