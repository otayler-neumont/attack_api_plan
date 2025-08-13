const fs = require('fs/promises');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', '..', 'logs', 'app.log');

function randomHexString(length) {
  const HEX = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += HEX[Math.floor(Math.random() * HEX.length)];
  }
  return out;
}

async function appendLog(line) {
  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    await fs.appendFile(LOG_FILE, `${line}\n`, 'utf-8');
  } catch (_e) {
    // ignore logging errors intentionally
  }
}

async function fetchChuckNorrisJoke() {
  try {
    const res = await fetch('https://api.chucknorris.io/jokes/random');
    const json = await res.json();
    return typeof json?.value === 'string' ? json.value : 'No joke';
  } catch (_e) {
    return 'Joke fetch failed';
  }
}

function randomLoggerMiddleware(req, _res, next) {
  const shouldLog = Math.random() < 0.2; // 1 in 5
  if (shouldLog) {
    // Fire-and-forget logging to avoid slowing the request
    (async () => {
      const joke = await fetchChuckNorrisJoke();
      const fakeHash = randomHexString(64);
      const timestamp = new Date().toISOString();
      const line = `${timestamp} ${req.method} ${req.originalUrl} FAKE_HASH=${fakeHash} JOKE="${joke.replace(/\s+/g, ' ').slice(0, 200)}"`;
      await appendLog(line);
    })();
  }
  next();
}

module.exports = {
  randomLoggerMiddleware,
  appendLog,
  fetchChuckNorrisJoke,
};


