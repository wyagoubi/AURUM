/* AURUM — reservations.js */
/* MODIFIED: Simple cancel modal with optional reason */

const API_BASE   = 'https://aurum-m4v8.onrender.com/api';
const CACHE_KEY  = 'aurum-bookings-cache';
const SHARED_KEY = 'aurum-shared-bookings';
const NOTIF_KEY  = 'aurum-notif-seen';
const body = document.body;

/* ── Theme ── */
const savedTheme = localStorage.getItem('aurum-theme') || 'dark-mode';
body.className = savedTheme;
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
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
const user  = JSON.parse(localStorage.getItem('aurum-user') || 'null');
const token = localStorage.getItem('aurum-token') || '';

const navUserLogged = document.getElementById('navUserLogged');
const navAvatar     = document.getElementById('navAvatar');
const navUsername   = document.getElementById('navUsername');
const navUserGuest  = document.getElementById('navUser');

if (user) {
  navUserLogged?.classList.remove('hidden');
  if (navAvatar)   navAvatar.textContent   = user.initials || (user.name?.[0] ?? 'A').toUpperCase();
  if (navUsername) navUsername.textContent = (user.name || 'Guest').split(' ')[0];
} else {
  navUserGuest?.classList.remove('hidden');
}
document.getElementById('navSignout')?.addEventListener('click', () => {
  localStorage.removeItem('aurum-user');
  localStorage.removeItem('aurum-token');
  window.location.href = 'auth.html';
});

/* ── Images ── */
const HOTEL_COVERS = {
  'Le Grand Aurum Paris':     'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80',
  'Aurum Palace London':      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80',
  'Aurum Medina Marrakesh':   'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80',
  'Aurum Sakura Tokyo':       'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
  'Aurum Overwater Maldives': 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400&q=80',
  'Aurum Summit Aspen':       'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80',
  'Aurum Duomo Florence':     'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80',
  'Aurum Sentosa Singapore':  'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80',
  'Aurum Royale Dubai':       'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&q=80',
  'Aurum Bosphorus Istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400&q=80',
  'Aurum Riviera Santorini':  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&q=80',
  'Aurum Zen Bali':           'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
};
const ROOM_COVERS = {
  'Deluxe Room':        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&q=80',
  'Junior Suite':       'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=300&q=80',
  'Grand Suite':        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=300&q=80',
  'Presidential Suite': 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300&q=80',
};

/* ── Cache helpers ── */
function saveCache(data) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch(_){} }
function loadCache()     { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch(_){ return []; } }

/* ── Shared bookings helpers (fallback) ── */
function getSharedBookings() {
  try { return JSON.parse(localStorage.getItem(SHARED_KEY) || '[]'); } catch { return []; }
}
function saveSharedBookings(bookings) {
  localStorage.setItem(SHARED_KEY, JSON.stringify(bookings));
  saveCache(bookings);
}

/* ── State ── */
let allBookings  = [];
let activeFilter = 'all';
let searchTerm   = '';

const listEl        = document.getElementById('resList');
const searchEl      = document.getElementById('resSearch');
const filtersEl     = document.getElementById('resFilters');

// New modal elements
const cancelModal       = document.getElementById('cancelModal');
const cancelModalDesc   = document.getElementById('cancelModalDesc');
const cancelReasonInput = document.getElementById('cancelReason');
const cancelModalClose  = document.getElementById('cancelModalClose');
const cancelModalCloseBtn = document.getElementById('cancelModalCloseBtn');
const cancelConfirmBtn  = document.getElementById('cancelConfirmBtn');

let pendingCancelId = null;

/* ── Helpers ── */
function fmtMoney(n) { return '$' + (Number(n)||0).toLocaleString('en-US',{minimumFractionDigits:0}); }
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length===10?'T00:00:00Z':''));
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
}
function daysUntil(isoDate) {
  const today = new Date(); today.setUTCHours(0,0,0,0);
  const d = new Date(isoDate + 'T00:00:00Z');
  return Math.round((d - today)/(1000*60*60*24));
}
function statusOf(b) {
  if (b.status === 'cancelled') return 'cancelled';
  const today = new Date(); today.setUTCHours(0,0,0,0);
  const cin  = new Date(b.checkIn  + 'T00:00:00Z');
  const cout = new Date(b.checkOut + 'T00:00:00Z');
  if (cout < today) return 'past';
  if (cin  > today) return 'upcoming';
  return 'current';
}
function statusLabel(s) {
  return ({upcoming:'Upcoming',past:'Past',cancelled:'Cancelled',current:'In Stay'})[s]||s;
}
function escapeHtml(s) {
  return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function normalizeBooking(b) {
  return {
    id:           b.id,
    reference:    b.reference || ('AUR-'+String(b.id).padStart(6,'0')),
    hotelId:      b.hotel_id   || b.hotelId,
    hotelName:    b.hotel_name || b.hotelName || 'AURUM Stay',
    roomType:     b.room_type  || b.roomType  || 'Deluxe Room',
    rooms:        b.rooms  || 1,
    guests:       b.guests || 1,
    checkIn:      b.check_in   || b.checkIn,
    checkOut:     b.check_out  || b.checkOut,
    nights:       b.nights || 1,
    pricePerNight:b.price_per_night || b.pricePerNight || 0,
    total:        b.total || 0,
    status:       b.status || 'confirmed',
    guestName:    b.guest_name  || b.guestName  || '',
    paymentLast4: b.payment_last4 || b.paymentLast4 || '',
    createdAt:    b.created_at || b.createdAt || new Date().toISOString(),
  };
}

/* ── Countdown badge ── */
function countdownBadge(b) {
  const s = statusOf(b);
  if (s === 'cancelled' || s === 'past') return '';
  if (s === 'current') {
    const d = daysUntil(b.checkOut);
    if (d <= 1) return `<span class="res-countdown warning">⏰ Check-out ${d===1?'tomorrow':'today'}</span>`;
    return `<span class="res-countdown">🏨 ${d} night${d!==1?'s':''} remaining</span>`;
  }
  const d = daysUntil(b.checkIn);
  if (d <= 0) return `<span class="res-countdown">✦ Check-in today</span>`;
  if (d === 1) return `<span class="res-countdown warning">⏰ Check-in tomorrow</span>`;
  return `<span class="res-countdown">✦ ${d} day${d!==1?'s':''} to check-in</span>`;
}

/* ── 1-day alerts ── */
function checkNotifications(bookings) {
  const seen = JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}');
  const msgs = [];
  bookings.forEach(b => {
    if (b.status === 'cancelled') return;
    const dIn  = daysUntil(b.checkIn);
    const dOut = daysUntil(b.checkOut);
    const kIn  = `in-${b.id}`;
    const kOut = `out-${b.id}`;
    if (dIn === 1 && !seen[kIn])  { msgs.push(`🔔 Check-in tomorrow: ${b.hotelName}`); seen[kIn]  = true; }
    if (dOut === 1 && !seen[kOut]) { msgs.push(`🔔 Check-out tomorrow: ${b.hotelName}`); seen[kOut] = true; }
  });
  if (msgs.length) {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(seen));
    msgs.forEach((m,i) => setTimeout(() => showToast(m, 'info'), 800 + i*900));
  }
}

/* ── Render list ── */
function renderList() {
  if (!allBookings.length) {
    listEl.innerHTML = `
      <div class="res-state">
        <h3 class="res-state-title">No reservations yet</h3>
        <p>Begin your AURUM story — choose a property and reserve your first stay.</p>
        <a class="btn-ghost" href="index.html" style="display:inline-block;margin-top:22px;text-decoration:none">Discover hotels</a>
      </div>`;
    return;
  }
  const term = searchTerm.toLowerCase();
  const filtered = allBookings.filter(b => {
    const s = statusOf(b);
    if (activeFilter==='upcoming'  && !(s==='upcoming'||s==='current')) return false;
    if (activeFilter==='past'      && s!=='past')      return false;
    if (activeFilter==='cancelled' && s!=='cancelled') return false;
    if (!term) return true;
    return [b.hotelName,b.reference,b.guestName].filter(Boolean).some(v=>v.toLowerCase().includes(term));
  });
  if (!filtered.length) {
    listEl.innerHTML = `<div class="res-state"><h3 class="res-state-title">Nothing matches</h3><p>Try a different filter.</p></div>`;
    return;
  }
  listEl.innerHTML = filtered.map(b => {
    const s         = statusOf(b);
    const showStatus= b.status==='cancelled' ? 'cancelled' : s;
    const canCancel = s==='upcoming' && b.status!=='cancelled';
    const cover     = HOTEL_COVERS[b.hotelName];
    const roomImg   = ROOM_COVERS[b.roomType] || ROOM_COVERS['Deluxe Room'];
    const imgStyle  = cover
      ? `background:url('${cover}') center/cover no-repeat`
      : `background:linear-gradient(135deg,#1a1208,#2a1f0a)`;
    return `
      <article class="res-card" data-id="${b.id}">
        <div class="res-card-art" style="${imgStyle}">
          <div class="res-card-art-overlay"></div>
          <div class="res-card-art-ref">${escapeHtml(b.reference)}</div>
        </div>
        <div class="res-card-body">
          <div class="res-meta-row">
            <span class="res-status ${showStatus}">${statusLabel(showStatus)}</span>
            ${countdownBadge(b)}
          </div>
          <h2 class="res-hotel-name">${escapeHtml(b.hotelName)}</h2>
          <div class="res-room-row">
            <img class="res-room-img" src="${roomImg}" alt="${escapeHtml(b.roomType)}" loading="lazy"/>
            <span class="res-hotel-loc">${escapeHtml(b.roomType)} · ${b.rooms} room${b.rooms!==1?'s':''} · ${b.guests} guest${b.guests!==1?'s':''}</span>
          </div>
          <div class="res-detail-grid">
            <div><div class="res-detail-label">Check in</div><div class="res-detail-value">${fmtDate(b.checkIn)}</div></div>
            <div><div class="res-detail-label">Check out</div><div class="res-detail-value">${fmtDate(b.checkOut)}</div></div>
            <div><div class="res-detail-label">Nights</div><div class="res-detail-value">${b.nights}</div></div>
            <div><div class="res-detail-label">Booked</div><div class="res-detail-value">${fmtDate((b.createdAt||'').slice(0,10))}</div></div>
          </div>
        </div>
        <div class="res-card-side">
          <div>
            <div class="res-total-label">Total</div>
            <div class="res-total">${fmtMoney(b.total)}</div>
            ${b.paymentLast4?`<div class="res-total-label" style="margin-top:4px;font-size:10px">•••• ${escapeHtml(b.paymentLast4)}</div>`:''}
          </div>
          <div class="res-card-actions">
            ${canCancel
              ? `<button class="btn btn-danger" data-cancel="${b.id}">Cancel</button>`
              : `<span style="opacity:.45;font-size:11px;letter-spacing:1px">${b.status==='cancelled'?'Cancelled':s==='past'?'Complete':'Active'}</span>`}
          </div>
        </div>
      </article>`;
  }).join('');
}

/* ── Load bookings ── */
async function load() {
  if (!user) {
    listEl.innerHTML = `
      <div class="res-state">
        <h3 class="res-state-title">Please sign in</h3>
        <p>Sign in to view your AURUM reservations.</p>
        <a class="btn-ghost" href="auth.html" style="display:inline-block;margin-top:22px;text-decoration:none">Sign in</a>
      </div>`;
    return;
  }
  listEl.innerHTML = '<div class="res-state"><p style="color:var(--text-m)">Loading reservations…</p></div>';
  try {
    const res = await fetch(`${API_BASE}/bookings`, { credentials: 'include' });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      allBookings = data.data.map(normalizeBooking);
      renderList();
      checkNotifications(allBookings);
    } else {
      throw new Error(data.error || 'Failed');
    }
  } catch(err) {
    const shared = getSharedBookings();
    if (shared.length) {
      allBookings = shared.map(normalizeBooking);
      renderList();
      checkNotifications(allBookings);
    } else {
      listEl.innerHTML = `
        <div class="res-state">
          <h3 class="res-state-title">No reservations yet</h3>
          <p>Book a hotel to see it here.</p>
          <a class="btn-ghost" href="index.html" style="display:inline-block;margin-top:22px;text-decoration:none">Discover hotels</a>
        </div>`;
    }
  }
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

// Cancel button click on each card
listEl?.addEventListener('click', e => {
  const btn = e.target.closest('[data-cancel]');
  if (!btn) return;
  const id = Number(btn.dataset.cancel);
  const booking = allBookings.find(b => b.id === id);
  if (!booking) return;
  pendingCancelId = id;
  if (cancelModalDesc) {
    cancelModalDesc.textContent = `Cancel stay at ${booking.hotelName} (${fmtDate(booking.checkIn)} – ${fmtDate(booking.checkOut)})? Reason (optional):`;
  }
  if (cancelReasonInput) cancelReasonInput.value = '';
  cancelModal?.classList.remove('hidden');
});

// Close modal functions
function closeCancelModal() {
  cancelModal?.classList.add('hidden');
  pendingCancelId = null;
}
cancelModalClose?.addEventListener('click', closeCancelModal);
cancelModalCloseBtn?.addEventListener('click', closeCancelModal);
cancelModal?.addEventListener('click', e => { if (e.target === cancelModal) closeCancelModal(); });

// Confirm cancellation
cancelConfirmBtn?.addEventListener('click', async () => {
  if (!pendingCancelId) return;
  const reason = cancelReasonInput ? cancelReasonInput.value.trim() : '';
  cancelConfirmBtn.disabled = true;
  cancelConfirmBtn.textContent = 'Cancelling...';
  try {
    const res = await fetch(`${API_BASE}/bookings/${pendingCancelId}/cancel`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Cancel failed');
    // Update local state
    const idx = allBookings.findIndex(b => b.id === pendingCancelId);
    if (idx !== -1) allBookings[idx].status = 'cancelled';
    closeCancelModal();
    renderList();
    showToast('Reservation cancelled.', 'success');
  } catch (err) {
    showToast(err.message || 'Could not cancel', 'error');
  } finally {
    cancelConfirmBtn.disabled = false;
    cancelConfirmBtn.textContent = 'Confirm cancellation';
  }
});

load();
