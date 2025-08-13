const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs/promises');

const { authRouter } = require('./routes/auth');
const { randomLoggerMiddleware } = require('./middleware/randomLogger');
const { ensureUsersDataFile } = require('./storage/usersRepo');

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

async function start() {
  const port = process.env.PORT || 3000;
  await ensureDirs();
  await ensureUsersDataFile();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Vuln Login API listening on http://localhost:${port}`);
  });
}

start();


