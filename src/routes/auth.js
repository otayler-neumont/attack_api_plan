const { Router } = require('express');
const { computePasswordHash, isPasswordValid } = require('../hash/hash');
const { findByEmail, addUser, updateUserPassword } = require('../storage/usersRepo');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const LOG_FILE = path.join(__dirname, '..', '..', 'logs', 'app.log');
const resetTokens = new Map();

async function appendLog(line) {
  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    await fs.appendFile(LOG_FILE, `${line}\n`, 'utf-8');
  } catch (_e) {
    // ignore logging errors intentionally
  }
}

async function generateResetToken(email, timestamp = Date.now()) {
    const data = `${email}${Math.floor(timestamp / 1000)}`;
    return crypto.createHash('md5').update(data).digest('hex');
}

async function isValidResetToken(email, providedToken) {
    const storedData = resetTokens.get(email);
    if (!storedData) return false;
    
    const { token, expiry } = storedData;
    
    if (providedToken.length !== token.length) return false;
    
    let isValid = true;
    for (let i = 0; i < token.length; i++) {
        if (providedToken[i] !== token[i]) {
            isValid = false;
        }
    }
    
    const now = Date.now();
    if (now > expiry) {
        appendLog(`RESET_TOKEN_EXPIRED email=${email} token=${token} expired_at=${new Date(expiry).toISOString()}`);
        return false;
    }
    
    return isValid;
}

const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const existing = await findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'User with that email already exists' });
    }

    const passwordHash = computePasswordHash(email, password);
    await addUser({ email, passwordHash });
    await appendLog(`REGISTER email=${email} hash=${passwordHash}`);
    return res.status(201).json({ email });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await findByEmail(email);
    if (!user) {
      await appendLog(`LOGIN email=${email} userFound=false`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const ok = isPasswordValid(email, password, user.passwordHash);
    if (!ok) {
      await appendLog(`LOGIN email=${email} userFound=true hash=${user.passwordHash} ok=false`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await appendLog(`LOGIN email=${email} userFound=true hash=${user.passwordHash} ok=true`);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
});

authRouter.get('/debug/tokens', (req, res) => {
    const tokens = [];
    resetTokens.forEach((data, email) => {
        tokens.push({
            email,
            token: data.token,
            expiry: new Date(data.expiry).toISOString(),
            expired: Date.now() > data.expiry
        });
    });
    res.json({ 
        message: "Debug endpoint - remove in production!",
        activeTokens: tokens,
        count: tokens.length
    });
});

authRouter.post('/request-reset', async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await findByEmail(email);
        if (!user) {
            const fakeToken = generateResetToken(email);
            await appendLog(`RESET_REQUEST email=${email} user_exists=false fake_token=${fakeToken}`);
            return res.json({ message: 'If the email exists, a reset link has been sent' });
        }

        const token = generateResetToken(email);
        const expiry = Date.now() + (60 * 60 * 1000);
        
        resetTokens.set(email, { token, expiry });

        await appendLog(`RESET_REQUEST email=${email} user_exists=true token=${token} expiry=${new Date(expiry).toISOString()}`);

        res.json({ 
            message: 'If the email exists, a reset link has been sent',
            debug_token: process.env.NODE_ENV === 'development' ? token : undefined
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

authRouter.post('/reset-password', async (req, res) => {
    try {
        const { email, token, newPassword } = req.body || {};
        
        if (!email || !token || !newPassword) {
            return res.status(400).json({ 
                message: 'Email, token, and new password are required' 
            });
        }

        if (!isValidResetToken(email, token)) {
            await appendLog(`RESET_ATTEMPT email=${email} token=${token} result=invalid_token`);
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const newHash = computePasswordHash(email, newPassword);
        await updateUserPassword(email, newHash);
        
        resetTokens.delete(email);

        await appendLog(`RESET_SUCCESS email=${email} token=${token} new_hash=${newHash}`);

        res.json({ message: 'Password reset successful' });

    } catch (err) {
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message,
            stack: err.stack 
        });
    }
});

authRouter.get('/check-token/:email/:token', async (req, res) => {
    const { email, token } = req.params;
    
    const isValid = isValidResetToken(email, token);
    
    await appendLog(`TOKEN_CHECK email=${email} token=${token} valid=${isValid}`);
    
    res.json({ 
        valid: isValid,
        email: email,
        reason: isValid ? 'valid' : (resetTokens.has(email) ? 'token_mismatch' : 'no_token_found')
    });
});

module.exports = {
  authRouter,
};