(() => {
  const form = document.getElementById('authForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const showPw = document.getElementById('showPw');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const statusField = document.getElementById('statusField');
  const statusCode = document.getElementById('statusCode');
  const responseBody = document.getElementById('responseBody');
  const preview = document.getElementById('preview');
  const startBtn = document.getElementById('startBtn');
  const startMenu = document.getElementById('startMenu');
  const openLogs = document.getElementById('openLogs');
  const openAdmin = document.getElementById('openAdmin');
  const playBoot = document.getElementById('playBoot');
  const muteToggle = document.getElementById('muteSounds');
  const logsWindow = document.getElementById('logsWindow');
  const closeLogs = document.getElementById('closeLogs');
  const minLogs = document.getElementById('minLogs');
  const logsContent = document.getElementById('logsContent');
  const refreshLogs = document.getElementById('refreshLogs');
  const logCount = document.getElementById('logCount');
  const clockEl = document.getElementById('clock');
  // Admin elements
  const adminWindow = document.getElementById('adminWindow');
  const closeAdmin = document.getElementById('closeAdmin');
  const minAdmin = document.getElementById('minAdmin');
  const adminMode = document.getElementById('adminMode');
  const adminLoginEmail = document.getElementById('adminLoginEmail');
  const adminLoginPw = document.getElementById('adminLoginPw');
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const usersList = document.getElementById('usersList');
  const loadUsers = document.getElementById('loadUsers');
  const refreshUsers = document.getElementById('refreshUsers');
  const loadDocs = document.getElementById('loadDocs');
  const apiDocs = document.getElementById('apiDocs');
  const adminStatus = document.getElementById('adminStatus');
  let adminLoggedIn = sessionStorage.getItem('adminLoggedIn') === '1';
  function updateAdminUiState() {
    const needsLogin = !adminLoggedIn;
    [loadUsers, refreshUsers, loadDocs].forEach((btn) => { if (btn) btn.disabled = needsLogin; });
  }

  function setStatus(message, code) {
    statusField.textContent = message || '';
    statusCode.textContent = code != null ? `HTTP ${code}` : '';
  }

  async function postJson(path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (adminLoggedIn) headers['X-Admin'] = '1';
    const res = await fetch(path, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return { res, data };
  }

  async function getJson(path) {
    const headers = {};
    if (adminLoggedIn) headers['X-Admin'] = '1';
    const res = await fetch(path, { headers });
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return { res, data };
  }

  function disableForm(disabled) {
    [emailInput, passwordInput, loginBtn, registerBtn].forEach((el) => {
      el.disabled = disabled;
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = { email: emailInput.value.trim(), password: passwordInput.value };
    if (!payload.email || !payload.password) {
      setStatus('Email and password are required', 400);
      return;
    }
    disableForm(true);
    setStatus('Logging in…');
    try {
      const { res, data } = await postJson('/login', payload);
      responseBody.textContent = JSON.stringify(data, null, 2);
      setStatus(res.ok ? 'Login success' : 'Login failed', res.status);
    } catch (err) {
      responseBody.textContent = String(err);
      setStatus('Network error');
    } finally {
      disableForm(false);
    }
  });

  registerBtn.addEventListener('click', async () => {
    const payload = { email: emailInput.value.trim(), password: passwordInput.value };
    if (!payload.email || !payload.password) {
      setStatus('Email and password are required', 400);
      return;
    }
    disableForm(true);
    setStatus('Registering…');
    try {
      const { res, data } = await postJson('/register', payload);
      responseBody.textContent = JSON.stringify(data, null, 2);
      setStatus(res.ok ? 'User created' : 'Register failed', res.status);
    } catch (err) {
      responseBody.textContent = String(err);
      setStatus('Network error');
    } finally {
      disableForm(false);
    }
  });

  showPw.addEventListener('change', () => {
    passwordInput.type = showPw.checked ? 'text' : 'password';
  });

  // Boot message
  setStatus('Ready');

  // Start Menu behavior
  startBtn?.addEventListener('click', () => {
    startMenu?.classList.toggle('hidden');
  });
  document.addEventListener('click', (e) => {
    const withinStart = e.target === startBtn || startBtn?.contains(e.target);
    const withinMenu = e.target === startMenu || startMenu?.contains(e.target);
    if (!withinStart && !withinMenu) startMenu?.classList.add('hidden');
  });

  // Logs window
  function showLogs() {
    logsWindow?.classList.remove('hidden');
    startMenu?.classList.add('hidden');
    fetchLogs();
  }
  function hideLogs() {
    logsWindow?.classList.add('hidden');
  }
  async function fetchLogs() {
    const count = Number.parseInt(logCount?.value || '200', 10);
    try {
      const res = await fetch(`/logs?limit=${encodeURIComponent(count)}`);
      const text = await res.text();
      logsContent.textContent = text || '(no logs)';
      logsContent.scrollTop = logsContent.scrollHeight;
      notify('Logs refreshed');
    } catch (e) {
      logsContent.textContent = String(e);
    }
  }
  openLogs?.addEventListener('click', showLogs);
  closeLogs?.addEventListener('click', hideLogs);
  minLogs?.addEventListener('click', hideLogs);
  refreshLogs?.addEventListener('click', fetchLogs);
  logCount?.addEventListener('change', fetchLogs);

  // Admin Panel
  function showAdmin() {
    adminWindow?.classList.remove('hidden');
    startMenu?.classList.add('hidden');
    bringToFront(adminWindow);
    updateAdminUiState();
  }
  openAdmin?.addEventListener('click', showAdmin);
  closeAdmin?.addEventListener('click', () => adminWindow?.classList.add('hidden'));
  minAdmin?.addEventListener('click', () => adminWindow?.classList.add('hidden'));
  adminMode.checked = localStorage.getItem('adminMode') === '1';
  adminMode.addEventListener('change', () => {
    const val = adminMode.checked ? '1' : '0';
    localStorage.setItem('adminMode', val);
    notify(val === '1' ? 'Admin enabled' : 'Admin disabled');
  });
  adminLoginBtn?.addEventListener('click', async () => {
    const payload = { email: adminLoginEmail.value.trim(), password: adminLoginPw.value };
    if (!payload.email || !payload.password) { adminStatus.textContent = 'Email and password required'; return; }
    const { res, data } = await postJson('/login', payload);
    adminStatus.textContent = res.ok ? 'Login OK' : `Login failed (${res.status})`;
    if (res.ok) {
      adminLoggedIn = true;
      sessionStorage.setItem('adminLoggedIn', '1');
      if (adminMode.checked) localStorage.setItem('adminMode', '1');
    } else {
      adminLoggedIn = false;
      sessionStorage.removeItem('adminLoggedIn');
      if (adminMode.checked) localStorage.removeItem('adminMode');
    }
    updateAdminUiState();
  });
  async function loadUsersList() {
    adminStatus.textContent = 'Loading users…';
    const { res, data } = await getJson('/admin/users');
    usersList.textContent = res.ok ? JSON.stringify(data, null, 2) : `${res.status}: ${JSON.stringify(data)}`;
    adminStatus.textContent = res.ok ? 'Loaded users' : 'Load users failed';
  }
  loadUsers?.addEventListener('click', loadUsersList);
  refreshUsers?.addEventListener('click', loadUsersList);
  loadDocs?.addEventListener('click', async () => {
    adminStatus.textContent = 'Loading docs…';
    try {
      const { res, data } = await getJson('/admin/docs');
      apiDocs.textContent = res.ok ? JSON.stringify(data, null, 2) : `${res.status}: ${JSON.stringify(data)}`;
      adminStatus.textContent = res.ok ? 'Loaded docs' : 'Load docs failed';
      apiDocs.scrollTop = 0;
    } catch (e) {
      apiDocs.textContent = String(e);
      adminStatus.textContent = 'Load docs error';
    }
  });

  // Clock
  function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}`;
  }
  updateClock();
  setInterval(updateClock, 10000);

  // Sounds (WebAudio simple tones)
  let audioCtx;
  let muted = false;
  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    return audioCtx;
  }
  function playTone({ freq = 440, durationMs = 250, type = 'sine', gain = 0.05 } = {}) {
    if (muted) return;
    const ctx = ensureAudio();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g).connect(ctx.destination);
    const now = ctx.currentTime;
    osc.start(now);
    osc.stop(now + durationMs / 1000);
  }
  function playBootSound() {
    // Rough approximation using a short chord
    playTone({ freq: 523.25, durationMs: 400, type: 'sine' }); // C5
    setTimeout(() => playTone({ freq: 659.25, durationMs: 400, type: 'sine' }), 120); // E5
    setTimeout(() => playTone({ freq: 783.99, durationMs: 600, type: 'sine' }), 240); // G5
  }
  function notify(message) {
    setStatus(message);
    playTone({ freq: 880, durationMs: 100, type: 'square' });
  }
  playBoot?.addEventListener('click', () => {
    playBootSound();
    startMenu?.classList.add('hidden');
  });
  muteToggle?.addEventListener('change', () => {
    muted = !!muteToggle.checked;
  });

  // Insecure client-side hash preview derived similarly to server scheme
  function wrapToPrintable(code) {
    const PRINTABLE_START = 33;
    const PRINTABLE_END = 126;
    const PRINTABLE_RANGE = PRINTABLE_END - PRINTABLE_START + 1;
    let c = code;
    while (c < PRINTABLE_START) c += PRINTABLE_RANGE;
    while (c > PRINTABLE_END) c -= PRINTABLE_RANGE;
    return c;
  }
  function computeShiftedPrefix(email, password) {
    const combined = `${password}${email}`;
    const shift = password.length;
    let out = '';
    for (let i = 0; i < combined.length; i += 1) {
      out += String.fromCharCode(wrapToPrintable(combined.charCodeAt(i) - shift));
    }
    return out;
  }
  function updatePreview() {
    const email = emailInput.value.trim();
    const pass = passwordInput.value;
    if (!email || !pass) {
      preview.value = '';
      return;
    }
    const prefix = computeShiftedPrefix(email, pass);
    preview.value = `${prefix}********************`; // shows deterministic prefix
  }
  emailInput.addEventListener('input', updatePreview);
  passwordInput.addEventListener('input', updatePreview);
  updatePreview();

  // Dragging windows
  function bringToFront(winEl) {
    document.querySelectorAll('.window-floating').forEach((w) => w.classList.remove('active'));
    winEl?.classList.add('active');
  }

  function makeDraggable(winEl) {
    if (!winEl) return;
    const titleBar = winEl.querySelector('.title-bar');
    if (!titleBar) return;
    let dragging = false;
    let pointerOffsetX = 0;
    let pointerOffsetY = 0;

    function onMouseDown(e) {
      if (e.button !== 0) return; // left only
      dragging = true;
      bringToFront(winEl);
      const rect = winEl.getBoundingClientRect();
      const desktopRect = document.querySelector('.desktop').getBoundingClientRect();
      // If no explicit left/top set, initialize from current rect
      if (!winEl.style.left || !winEl.style.top) {
        winEl.style.left = `${rect.left - desktopRect.left}px`;
        winEl.style.top = `${rect.top - desktopRect.top}px`;
      }
      pointerOffsetX = e.clientX - rect.left;
      pointerOffsetY = e.clientY - rect.top;
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    }

    function onMouseMove(e) {
      if (!dragging) return;
      const desktopRect = document.querySelector('.desktop').getBoundingClientRect();
      let nextLeft = e.clientX - desktopRect.left - pointerOffsetX;
      let nextTop = e.clientY - desktopRect.top - pointerOffsetY;
      const maxLeft = Math.max(0, desktopRect.width - winEl.offsetWidth);
      const maxTop = Math.max(0, desktopRect.height - winEl.offsetHeight - 32);
      nextLeft = Math.max(0, Math.min(nextLeft, maxLeft));
      nextTop = Math.max(0, Math.min(nextTop, maxTop));
      winEl.style.left = `${nextLeft}px`;
      winEl.style.top = `${nextTop}px`;
    }

    function onMouseUp() {
      dragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    titleBar.addEventListener('mousedown', onMouseDown);
    winEl.addEventListener('mousedown', bringToFront);
  }

  makeDraggable(document.querySelector('.auth-window'));
  makeDraggable(document.getElementById('logsWindow'));
  makeDraggable(document.getElementById('adminWindow'));
  updateAdminUiState();
})();


