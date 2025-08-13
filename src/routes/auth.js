const { Router } = require('express');
const { computePasswordHash, isPasswordValid } = require('../hash/hash');
const { findByEmail, addUser } = require('../storage/usersRepo');

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
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const ok = isPasswordValid(email, password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = {
  authRouter,
};


