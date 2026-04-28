/* AURUM — auth.js (integrated with backend API) */
const API_BASE = 'https://aurum-m4v8.onrender.com/api';

/* ── Theme ── */
const body = document.body;
const savedTheme = localStorage.getItem('aurum-theme') || 'dark-mode';
body.className = savedTheme;

const themeIcon = document.getElementById('themeIcon');
if (themeIcon) themeIcon.textContent = savedTheme === 'dark-mode' ? '☀' : '☾';

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = body.classList.contains('dark-mode');
    const newTheme = isDark ? 'light-mode' : 'dark-mode';
    body.className = newTheme;
    localStorage.setItem('aurum-theme', newTheme);
    if (themeIcon) themeIcon.textContent = isDark ? '☾' : '☀';
    themeToggle.style.animation = 'none';
    setTimeout(() => { if (themeToggle) themeToggle.style.animation = ''; }, 10);
  });
}

/* ── Role Switcher ── */
const roleGuest = document.getElementById('roleGuest');
const roleOwner = document.getElementById('roleOwner');
const guestSection = document.getElementById('guestSection');
const ownerSection = document.getElementById('ownerSection');

function switchRole(role) {
  if (!roleGuest || !roleOwner || !guestSection || !ownerSection) return;
  if (role === 'guest') {
    roleGuest.classList.add('active');
    roleOwner.classList.remove('active');
    guestSection.classList.remove('hidden');
    ownerSection.classList.add('hidden');
  } else {
    roleOwner.classList.add('active');
    roleGuest.classList.remove('active');
    ownerSection.classList.remove('hidden');
    guestSection.classList.add('hidden');
  }
}

if (roleGuest && roleOwner) {
  roleGuest.addEventListener('click', () => switchRole('guest'));
  roleOwner.addEventListener('click', () => switchRole('owner'));
}

(function() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('role') === 'owner') switchRole('owner');
})();

/* ── Guest Tabs ── */
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginWrap = document.getElementById('loginWrap');
const registerWrap = document.getElementById('registerWrap');

if (tabLogin && tabRegister && loginWrap && registerWrap) {
  tabLogin.addEventListener('click', () => switchGuestTab('login'));
  tabRegister.addEventListener('click', () => switchGuestTab('register'));
}

const goRegisterLink = document.getElementById('goRegisterLink');
const goLoginLink = document.getElementById('goLoginLink');
if (goRegisterLink) goRegisterLink.addEventListener('click', e => { e.preventDefault(); switchGuestTab('register'); });
if (goLoginLink) goLoginLink.addEventListener('click', e => { e.preventDefault(); switchGuestTab('login'); });

function switchGuestTab(tab) {
  if (!tabLogin || !tabRegister || !loginWrap || !registerWrap) return;
  if (tab === 'login') {
    tabLogin.classList.add('active'); tabRegister.classList.remove('active');
    loginWrap.classList.remove('hidden'); registerWrap.classList.add('hidden');
  } else {
    tabRegister.classList.add('active'); tabLogin.classList.remove('active');
    registerWrap.classList.remove('hidden'); loginWrap.classList.add('hidden');
  }
}

/* ── Owner Tabs ── */
const ownerTabLogin = document.getElementById('ownerTabLogin');
const ownerTabRegister = document.getElementById('ownerTabRegister');
const ownerLoginWrap = document.getElementById('ownerLoginWrap');
const ownerRegWrap = document.getElementById('ownerRegisterWrap');

if (ownerTabLogin && ownerTabRegister && ownerLoginWrap && ownerRegWrap) {
  ownerTabLogin.addEventListener('click', () => switchOwnerTab('login'));
  ownerTabRegister.addEventListener('click', () => switchOwnerTab('register'));
}

const goOwnerRegisterLink = document.getElementById('goOwnerRegisterLink');
const goOwnerLoginLink = document.getElementById('goOwnerLoginLink');
if (goOwnerRegisterLink) goOwnerRegisterLink.addEventListener('click', e => { e.preventDefault(); switchOwnerTab('register'); });
if (goOwnerLoginLink) goOwnerLoginLink.addEventListener('click', e => { e.preventDefault(); switchOwnerTab('login'); });

function switchOwnerTab(tab) {
  if (!ownerTabLogin || !ownerTabRegister || !ownerLoginWrap || !ownerRegWrap) return;
  if (tab === 'login') {
    ownerTabLogin.classList.add('active'); ownerTabRegister.classList.remove('active');
    ownerLoginWrap.classList.remove('hidden'); ownerRegWrap.classList.add('hidden');
  } else {
    ownerTabRegister.classList.add('active'); ownerTabLogin.classList.remove('active');
    ownerRegWrap.classList.remove('hidden'); ownerLoginWrap.classList.add('hidden');
  }
}

/* ── Helpers ── */
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; if (msg) setTimeout(() => el.textContent = '', 4000); }
}
function clearError(id) { setError(id, ''); }
function highlightInvalid(inputId) {
  const el = document.getElementById(inputId);
  if (el) { el.style.borderColor = '#e74c3c'; setTimeout(() => el.style.borderColor = '', 2000); }
}

window.togglePw = function(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  if (btn) btn.style.opacity = show ? '1' : '0.5';
};

window.checkStrength = function(val) { applyStrength(val, 'strengthFill', 'strengthLabel'); };
window.checkOwnerStrength = function(val) { applyStrength(val, 'ownerStrFill', 'ownerStrLabel'); };
function applyStrength(val, fillId, labelId) {
  const fill = document.getElementById(fillId);
  const label = document.getElementById(labelId);
  if (!fill || !label) return;
  if (!val) { fill.style.width = '0%'; label.textContent = ''; return; }
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const map = [
    { w:'20%', bg:'#e74c3c', txt:'Weak' },
    { w:'45%', bg:'#e67e22', txt:'Fair' },
    { w:'70%', bg:'#f1c40f', txt:'Good' },
    { w:'100%',bg:'#2ecc71', txt:'Strong' },
  ];
  const s = map[score - 1] || map[0];
  fill.style.width = s.w; fill.style.background = s.bg;
  label.textContent = s.txt; label.style.color = s.bg;
}

function showMsg(text, type) {
  let el = document.getElementById('authMsg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'authMsg';
    el.style.cssText = 'position:fixed;bottom:32px;right:32px;z-index:9999;padding:14px 24px;font-size:12px;letter-spacing:0.5px;border:1px solid;max-width:340px;line-height:1.5;transition:all 0.4s;opacity:0;transform:translateY(10px);font-family:Jost,sans-serif;background:var(--bg2);';
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.style.borderColor = type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : 'rgba(201,169,110,0.5)';
  el.style.color = type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#c9a96e';
  el.style.opacity = '1'; el.style.transform = 'translateY(0)';
  clearTimeout(window._msgT);
  window._msgT = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; }, 4000);
}

function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.origText = btn.querySelector('.btn-auth-text')?.textContent || btn.textContent;
    const span = btn.querySelector('.btn-auth-text');
    if (span) span.textContent = 'Please wait...';
    else btn.textContent = 'Please wait...';
  } else {
    btn.disabled = false;
    const span = btn.querySelector('.btn-auth-text');
    if (span) span.textContent = btn.dataset.origText || span.textContent;
    else btn.textContent = btn.dataset.origText || btn.textContent;
  }
}

function showSuccessOverlay(title, subtitle) {
  let overlay = document.getElementById('successOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'successOverlay';
    overlay.className = 'success-overlay';
    overlay.innerHTML = `
      <div class="success-content">
        <div class="success-checkmark">
          <svg viewBox="0 0 50 50" width="50" height="50">
            <circle cx="25" cy="25" r="23" fill="none" stroke="currentColor" stroke-width="2" class="checkmark-circle"/>
            <path d="M14 27l7 7 15-15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="checkmark-check"/>
          </svg>
        </div>
        <div class="success-text" id="successText"></div>
        <div class="success-subtext" id="successSubtext"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  document.getElementById('successText').textContent = title || 'Welcome!';
  document.getElementById('successSubtext').textContent = subtitle || 'Redirecting...';
  requestAnimationFrame(() => overlay.classList.add('show'));
}

/* ── Guest Login ── */
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail')?.value.trim() || '';
    const pass = document.getElementById('loginPass')?.value || '';
    clearError('loginEmailErr'); clearError('loginPassErr');

    if (!email || !email.includes('@')) {
      setError('loginEmailErr', 'Please enter a valid email.');
      highlightInvalid('loginEmail'); return;
    }
    if (!pass) {
      setError('loginPassErr', 'Password is required.');
      highlightInvalid('loginPass'); return;
    }

    setLoading(loginBtn, true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password: pass, expectedRole: 'guest' })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('aurum-user', JSON.stringify(data.data.user));
        localStorage.setItem('aurum-theme', body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode');
        showSuccessOverlay('Welcome back!', 'Redirecting...');
        setTimeout(() => {
          const p = new URLSearchParams(window.location.search);
          const next = p.get('nextBooking');
          window.location.href = next ? `index.html?openBooking=${encodeURIComponent(next)}` : 'index.html';
        }, 1500);
      } else {
        setLoading(loginBtn, false);
        if (res.status === 404 || data.error?.includes('Invalid')) {
          setError('loginEmailErr', 'No account found. Please register first.');
        } else {
          showMsg(data.error || 'Login failed', 'error');
        }
      }
    } catch(err) {
      setLoading(loginBtn, false);
      showMsg('Cannot connect to server. Please try again.', 'error');
    }
  });
}

/* ── Guest Register ── */
const registerBtn = document.getElementById('registerBtn');
if (registerBtn) {
  registerBtn.addEventListener('click', async () => {
    const first = document.getElementById('regFirst')?.value.trim() || '';
    const last = document.getElementById('regLast')?.value.trim() || '';
    const email = document.getElementById('regEmail')?.value.trim() || '';
    const pass = document.getElementById('regPass')?.value || '';
    const pass2 = document.getElementById('regPass2')?.value || '';
    const agreed = document.getElementById('agreeTerms')?.checked || false;

    let ok = true;
    ['regFirstErr','regLastErr','regEmailErr','regPassErr','regPass2Err','agreeErr'].forEach(id => clearError(id));
    if (!first) { setError('regFirstErr', 'Required.'); ok = false; }
    if (!last) { setError('regLastErr', 'Required.'); ok = false; }
    if (!email || !email.includes('@')) { setError('regEmailErr', 'Please enter a valid email.'); ok = false; }
    if (pass.length < 8) { setError('regPassErr', 'Password must be at least 8 characters.'); ok = false; }
    if (pass !== pass2) { setError('regPass2Err', 'Passwords do not match.'); ok = false; }
    if (!agreed) { setError('agreeErr', 'Please accept the Terms of Service.'); ok = false; }
    if (!ok) return;

    setLoading(registerBtn, true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName: first, lastName: last, email, password: pass, role: 'guest' })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('aurum-user', JSON.stringify(data.data.user));
        localStorage.setItem('aurum-theme', body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode');
        showSuccessOverlay(`Welcome to AURUM, ${first}!`, 'Setting up your account...');
        setTimeout(() => window.location.href = 'index.html', 1500);
      } else {
        setLoading(registerBtn, false);
        if (res.status === 409) {
          setError('regEmailErr', 'An account with this email already exists. Please login.');
        } else {
          showMsg(data.error || 'Registration failed', 'error');
        }
      }
    } catch(err) {
      setLoading(registerBtn, false);
      showMsg('Cannot connect to server. Please try again.', 'error');
    }
  });
}

/* ── Owner Login ── */
const ownerLoginBtn = document.getElementById('ownerLoginBtn');
if (ownerLoginBtn) {
  ownerLoginBtn.addEventListener('click', async () => {
    const email = document.getElementById('ownerLoginEmail')?.value.trim() || '';
    const pass = document.getElementById('ownerLoginPass')?.value || '';
    clearError('ownerLoginEmailErr'); clearError('ownerLoginPassErr');

    if (!email || !email.includes('@')) {
      setError('ownerLoginEmailErr', 'Please enter a valid email.');
      highlightInvalid('ownerLoginEmail'); return;
    }
    if (!pass) {
      setError('ownerLoginPassErr', 'Password is required.');
      highlightInvalid('ownerLoginPass'); return;
    }

    setLoading(ownerLoginBtn, true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password: pass, expectedRole: 'owner' })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('aurum-user', JSON.stringify(data.data.user));
        localStorage.setItem('aurum-theme', body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode');
        showSuccessOverlay('Welcome back!', 'Accessing your dashboard...');
        setTimeout(() => window.location.href = 'owner-dashboard.html', 1500);
      } else {
        setLoading(ownerLoginBtn, false);
        if (res.status === 404 || data.error?.includes('Invalid')) {
          setError('ownerLoginEmailErr', 'No owner account found. Please register first.');
        } else {
          showMsg(data.error || 'Login failed', 'error');
        }
      }
    } catch(err) {
      setLoading(ownerLoginBtn, false);
      showMsg('Cannot connect to server. Please try again.', 'error');
    }
  });
}

/* ── Owner Register ── */
const ownerRegisterBtn = document.getElementById('ownerRegisterBtn');
if (ownerRegisterBtn) {
  ownerRegisterBtn.addEventListener('click', async () => {
    const first = document.getElementById('ownerFirst')?.value.trim() || '';
    const last = document.getElementById('ownerLast')?.value.trim() || '';
    const email = document.getElementById('ownerEmail')?.value.trim() || '';
    const hotel = document.getElementById('ownerHotel')?.value.trim() || '';
    const pass = document.getElementById('ownerPass')?.value || '';
    const agreed = document.getElementById('ownerAgreeTerms')?.checked || false;

    let ok = true;
    ['ownerFirstErr','ownerLastErr','ownerEmailErr','ownerHotelErr','ownerPassErr','ownerAgreeErr'].forEach(id => clearError(id));
    if (!first) { setError('ownerFirstErr', 'Required.'); ok = false; }
    if (!last) { setError('ownerLastErr', 'Required.'); ok = false; }
    if (!email || !email.includes('@')) { setError('ownerEmailErr', 'Please enter a valid email.'); ok = false; }
    if (!hotel) { setError('ownerHotelErr', 'Hotel name is required.'); ok = false; }
    if (pass.length < 8) { setError('ownerPassErr', 'Password must be at least 8 characters.'); ok = false; }
    if (!agreed) { setError('ownerAgreeErr', 'Please accept the Partner Terms.'); ok = false; }
    if (!ok) return;

    setLoading(ownerRegisterBtn, true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName: first, lastName: last, email, password: pass, role: 'owner', hotelName: hotel })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('aurum-user', JSON.stringify(data.data.user));
        localStorage.setItem('aurum-theme', body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode');
        showSuccessOverlay(`Welcome to AURUM, ${first}!`, 'Setting up your dashboard...');
        setTimeout(() => window.location.href = 'owner-dashboard.html', 1500);
      } else {
        setLoading(ownerRegisterBtn, false);
        if (res.status === 409) {
          setError('ownerEmailErr', 'An account with this email already exists.');
        } else {
          showMsg(data.error || 'Registration failed', 'error');
        }
      }
    } catch(err) {
      setLoading(ownerRegisterBtn, false);
      showMsg('Cannot connect to server. Please try again.', 'error');
    }
  });
}

/* ── Google Login (OAuth simulation - shows clear message) ── */
window.socialLogin = function(provider) {
  showMsg(`${provider} login requires OAuth setup. Please use email/password.`, 'error');
};
