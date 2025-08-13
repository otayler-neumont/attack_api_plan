const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs/promises');

const { authRouter } = require('./routes/auth');
const { adminRouter } = require('./routes/admin');
const { randomLoggerMiddleware, appendLog, fetchChuckNorrisJoke } = require('./middleware/randomLogger');
const { ensureUsersDataFile, findByEmail, addUser } = require('./storage/usersRepo');
const { computePasswordHash } = require('./hash/hash');

const app = express();

// Insecure defaults: wide-open CORS, verbose errors, no rate limiting
app.use(cors());
app.use(express.json());

// Serve static frontend (Windows 95-themed) from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Random logger (1 in 5 requests)
app.use(randomLoggerMiddleware);

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/', authRouter);
app.use('/admin', adminRouter);

// Simple logs endpoint for Start Menu viewer
app.get('/logs', async (req, res, next) => {
  try {
    const limitParam = Number.parseInt(String(req.query.limit || ''), 10);
    const maxLines = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 200;
    const logPath = path.join(__dirname, '..', 'logs', 'app.log');
    let content = '';
    try {
      content = await fs.readFile(logPath, 'utf-8');
    } catch (_e) {
      content = '';
    }
    const lines = content.split(/\r?\n/);
    const tail = lines.slice(-maxLines).join('\n');
    res.type('text/plain').send(tail);
  } catch (err) {
    next(err);
  }
});

// Verbose error handler leaking stack traces
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || 'Unexpected error',
    stack: err.stack,
  });
});

async function ensureDirs() {
  const dataDir = path.join(__dirname, '..', 'data');
  const logsDir = path.join(__dirname, '..', 'logs');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(logsDir, { recursive: true });
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'win95!';

async function ensureAdminUser() {
  const existing = await findByEmail(ADMIN_EMAIL);
  if (existing) return;
  const passwordHash = computePasswordHash(ADMIN_EMAIL, ADMIN_PASSWORD);
  await addUser({ email: ADMIN_EMAIL, passwordHash });
}

function startAdminLoginHeartbeat(port) {
  const doLogin = async () => {
    try {
      await fetch(`http://localhost:${port}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      });
    } catch (_e) {
      // ignore
    }
  };
  // initial attempt shortly after boot, then every minute
  setTimeout(doLogin, 1500);
  setInterval(doLogin, 60 * 1000);
}

function startNoiseLogger() {
  const writeNoise = async () => {
    try {
      const joke = await fetchChuckNorrisJoke();
      const timestamp = new Date().toISOString();
      await appendLog(`${timestamp} NOISE heartbeat JOKE="${String(joke).replace(/\s+/g, ' ').slice(0, 200)}"`);
    } catch (_e) {
      // ignore
    }
  };
  setInterval(writeNoise, 10 * 1000);
}

async function start() {
  const port = process.env.PORT || 3000;
  await ensureDirs();
  await ensureUsersDataFile();
  await ensureAdminUser();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Vuln Login API listening on http://localhost:${port}`);
  });
  startAdminLoginHeartbeat(port);
  startNoiseLogger();
}

start();


