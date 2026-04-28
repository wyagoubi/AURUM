/* AURUM — reservations.js
   Lists and manages the signed-in guest's bookings. */

const API_BASE = 'https://aurum-m4v8.onrender.com/api'; // ← ضع رابط Render هنا
const body = document.body;

/* ── Theme ── */
const savedTheme = localStorage.getItem('aurum-theme');
if (savedTheme === 'light-mode') { body.classList.remove('dark-mode'); body.classList.add('light-mode'); }
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
function syncThemeIcon() { if (themeIcon) themeIcon.textContent = body.classList.contains('dark-mode') ? '☀' : '☾'; }
syncThemeIcon();
themeToggle?.addEventListener('click', () => {
  body.classList.toggle('dark-mode'); body.classList.toggle('light-mode');
  localStorage.setItem('aurum-theme', body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode');
  syncThemeIcon();
});

/* ── Mobile nav ── */
document.getElementById('navToggle')?.addEventListener('click', () => {
  document.querySelector('.nav-links')?.classList.toggle('mobile-open');
});

/* ── Toast ── */
function showToast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  if (!c) { console.log(msg); return; }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 350); }, 2800);
}

/* ── Auth gate + nav user ── */
const user = JSON.parse(localStorage.getItem('aurum-user') || 'null');
const token = localStorage.getItem('aurum-token') || '';
const navUserLogged = document.getElementById('navUserLogged');
const navAvatar     = document.getElementById('navAvatar');
const navUsername   = document.getElementById('navUsername');
const navUserGuest  = document.getElementById('navUser');

if (user && token) {
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

/* ── State ── */
const COLOR_PALETTE = ['#1a1208','#14100a','#0a1218','#1a0e0a','#0e1014','#1a0f06','#06181c','#0e1018','#08141a','#10141a','#1a1208','#0a1018'];
let allBookings = [];
let activeFilter = 'all';
let searchTerm = '';

const listEl    = document.getElementById('resList');
const searchEl  = document.getElementById('resSearch');
const filtersEl = document.getElementById('resFilters');
const cancelModal   = document.getElementById('cancelModal');
const cancelDesc    = document.getElementById('cancelDesc');
const cancelConfirm = document.getElementById('cancelConfirm');
const cancelKeep    = document.getElementById('cancelKeep');
const cancelClose   = document.getElementById('cancelClose');
let pendingCancelId = null;

/* ── Helpers ── */
function fmtMoney(n) {
  const v = Number(n) || 0;
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
function statusOf(b) {
  if (b.status === 'cancelled') return 'cancelled';
  const today = new Date(); today.setUTCHours(0,0,0,0);
  const cin  = new Date(b.checkIn  + 'T00:00:00Z');
  const cout = new Date(b.checkOut + 'T00:00:00Z');
  if (cout.getTime() < today.getTime()) return 'past';
  if (cin.getTime()  > today.getTime()) return 'upcoming';
  return 'current';
}
function statusLabel(s) {
  return ({ upcoming: 'Upcoming', past: 'Past', cancelled: 'Cancelled', current: 'In stay', confirmed: 'Confirmed' })[s] || s;
}
function initialsFromName(n) {
  return (n || '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0,2).toUpperCase() || 'AU';
}


/* ── Normalize booking from backend snake_case ── */
function normalizeBooking(b) {
  return {
    id:            b.id,
    reference:     b.reference || ('AUR-' + String(b.id).padStart(6,'0')),
    hotelId:       b.hotel_id,
    hotelName:     b.hotel_name || b.hotelName || 'AURUM Stay',
    roomType:      b.room_type  || b.roomType  || 'Deluxe Room',
    rooms:         b.rooms  || 1,
    guests:        b.guests || 1,
    checkIn:       b.check_in   || b.checkIn,
    checkOut:      b.check_out  || b.checkOut,
    nights:        b.nights || 1,
    pricePerNight: b.price_per_night || b.pricePerNight || 0,
    total:         b.total || 0,
    status:        b.status || 'confirmed',
    guestName:     b.guest_name  || b.guestName  || '',
    guestEmail:    b.guest_email || b.guestEmail || '',
    paymentLast4:  b.payment_last4 || b.paymentLast4 || '',
    createdAt:     b.created_at || b.createdAt || new Date().toISOString(),
  };
}

/* ── Render ── */
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
    if (activeFilter === 'upcoming' && !(s === 'upcoming' || s === 'current')) return false;
    if (activeFilter === 'past'      && s !== 'past') return false;
    if (activeFilter === 'cancelled' && s !== 'cancelled') return false;
    if (!term) return true;
    return [b.hotelName, b.reference, b.guestName, b.guestEmail]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(term));
  });

  if (!filtered.length) {
    listEl.innerHTML = `
      <div class="res-state">
        <h3 class="res-state-title">Nothing matches</h3>
        <p>Try a different search or filter.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = filtered.map(b => {
    const s = statusOf(b);
    const showStatus = b.status === 'cancelled' ? 'cancelled' : s;
    const color = COLOR_PALETTE[(b.hotelId || 1) % COLOR_PALETTE.length];
    const initials = initialsFromName(b.hotelName);
    const canCancel = s === 'upcoming' && b.status !== 'cancelled';
    return `
      <article class="res-card" data-id="${b.id}">
        <div class="res-card-art" style="--art-color:${color}">${initials}</div>
        <div class="res-card-body">
          <div class="res-meta-row">
            <span class="res-ref">${b.reference || ('AUR-' + String(b.id).padStart(6,'0'))}</span>
            <span class="res-status ${showStatus}">${statusLabel(showStatus)}</span>
          </div>
          <h2 class="res-hotel-name">${escapeHtml(b.hotelName || 'AURUM Stay')}</h2>
          <p class="res-hotel-loc">${escapeHtml(b.roomType || 'Deluxe Room')} · ${b.rooms} room${b.rooms !== 1 ? 's' : ''} · ${b.guests} guest${b.guests !== 1 ? 's' : ''}</p>
          <div class="res-detail-grid">
            <div><div class="res-detail-label">Check in</div><div class="res-detail-value">${fmtDate(b.checkIn)}</div></div>
            <div><div class="res-detail-label">Check out</div><div class="res-detail-value">${fmtDate(b.checkOut)}</div></div>
            <div><div class="res-detail-label">Nights</div><div class="res-detail-value">${b.nights}</div></div>
            <div><div class="res-detail-label">Booked</div><div class="res-detail-value">${fmtDate(b.createdAt?.slice(0,10))}</div></div>
          </div>
        </div>
        <div class="res-card-side">
          <div style="text-align:right">
            <div class="res-total-label">Total</div>
            <div class="res-total">${fmtMoney(b.total)}</div>
          </div>
          <div class="res-card-actions">
            ${canCancel
              ? `<button class="btn-danger" data-cancel="${b.id}">Cancel</button>`
              : `<span class="res-ref" style="opacity:.6">${b.status === 'cancelled' ? 'Cancelled' : (s === 'past' ? 'Stay complete' : 'In progress')}</span>`}
          </div>
        </div>
      </article>`;
  }).join('');
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

/* ── Load ── */
async function load() {
  if (!token) {
    listEl.innerHTML = `
      <div class="res-state">
        <h3 class="res-state-title">Please sign in</h3>
        <p>Sign in to view your AURUM reservations.</p>
        <a class="btn-ghost" href="auth.html" style="display:inline-block;margin-top:22px;text-decoration:none">Sign in</a>
      </div>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/bookings/me`, {
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    if (res.status === 401) {
      localStorage.removeItem('aurum-token');
      window.location.href = 'auth.html';
      return;
    }
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load');
    allBookings = (data.data || []).map(normalizeBooking);
    renderList();
  } catch (err) {
    listEl.innerHTML = `
      <div class="res-state">
        <h3 class="res-state-title">Could not load reservations</h3>
        <p>${escapeHtml(err.message || 'Network error')}. Please try again in a moment.</p>
      </div>`;
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

listEl?.addEventListener('click', e => {
  const cancelBtn = e.target.closest('[data-cancel]');
  if (!cancelBtn) return;
  pendingCancelId = Number(cancelBtn.dataset.cancel);
  const b = allBookings.find(x => x.id === pendingCancelId);
  cancelDesc.textContent = b
    ? `Cancel your stay at ${b.hotelName} (${fmtDate(b.checkIn)} – ${fmtDate(b.checkOut)})? Your card will not be charged.`
    : 'Are you sure you want to cancel this reservation?';
  cancelModal.classList.remove('hidden');
});

function closeCancelModal() {
  cancelModal.classList.add('hidden');
  pendingCancelId = null;
  cancelConfirm.disabled = false;
  cancelConfirm.textContent = 'Yes, cancel';
}
cancelClose?.addEventListener('click', closeCancelModal);
cancelKeep?.addEventListener('click', closeCancelModal);
cancelModal?.addEventListener('click', e => { if (e.target === cancelModal) closeCancelModal(); });

cancelConfirm?.addEventListener('click', async () => {
  if (!pendingCancelId) return;
  cancelConfirm.disabled = true;
  cancelConfirm.textContent = 'Cancelling…';
  try {
    const res = await fetch(`${API_BASE}/bookings/${pendingCancelId}/cancel`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to cancel');
    const idx = allBookings.findIndex(b => b.id === pendingCancelId);
    if (idx >= 0) allBookings[idx] = normalizeBooking({ ...allBookings[idx], ...data.data });
    closeCancelModal();
    renderList();
    showToast('Reservation cancelled.', 'success');
  } catch (err) {
    cancelConfirm.disabled = false;
    cancelConfirm.textContent = 'Yes, cancel';
    showToast(err.message || 'Could not cancel', 'error');
  }
});

load();
