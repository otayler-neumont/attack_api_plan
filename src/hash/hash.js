const PRINTABLE_START = 33; // '!'
const PRINTABLE_END = 126; // '~'
const PRINTABLE_RANGE = PRINTABLE_END - PRINTABLE_START + 1; // 94

function wrapToPrintable(asciiCode) {
  let code = asciiCode;
  while (code < PRINTABLE_START) {
    code += PRINTABLE_RANGE;
  }
  while (code > PRINTABLE_END) {
    code -= PRINTABLE_RANGE;
  }
  return code;
}

function computeShiftedPrefix(email, password) {
  const originalLength = password.length;
  const combined = `${password}${email}`;
  let output = '';
  for (let i = 0; i < combined.length; i += 1) {
    const ch = combined[i];
    const shifted = wrapToPrintable(ch.charCodeAt(0) - originalLength);
    output += String.fromCharCode(shifted);
  }
  return output;
}

const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomSuffix(length) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * ALPHANUM.length);
    out += ALPHANUM[idx];
  }
  return out;
}

function computePasswordHash(email, password) {
  const prefix = computeShiftedPrefix(email, password);
  return `${prefix}${randomSuffix(20)}`;
}

function isPasswordValid(email, password, storedHash) {
  if (typeof storedHash !== 'string' || storedHash.length === 0) return false;
  const prefix = computeShiftedPrefix(email, password);
  if (!storedHash.startsWith(prefix)) return false;
  const suffix = storedHash.slice(prefix.length);
  return /^([A-Za-z0-9]{20})$/.test(suffix);
}

module.exports = {
  computePasswordHash,
  isPasswordValid,
  computeShiftedPrefix,
};


