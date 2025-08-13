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

  function setStatus(message, code) {
    statusField.textContent = message || '';
    statusCode.textContent = code != null ? `HTTP ${code}` : '';
  }

  async function postJson(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
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
})();


