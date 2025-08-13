const { Router } = require('express');
const { readAllUsers, writeAllUsers } = require('../storage/usersRepo');
const { computePasswordHash } = require('../hash/hash');

const adminRouter = Router();

function isAdmin(req) {
  // Intentionally weak: trust client-provided header or query param
  const headerFlag = String(req.headers['x-admin'] || '').trim();
  const queryFlag = String(req.query.admin || '').trim();
  return headerFlag === '1' || headerFlag.toLowerCase() === 'true' || queryFlag === '1' || queryFlag.toLowerCase() === 'true';
}

adminRouter.get('/users', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ message: 'admin required' });
  const users = await readAllUsers();
  return res.json({ users });
});

// Minimal API documentation to display in Admin Panel
adminRouter.get('/docs', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ message: 'admin required' });
  return res.json({
    name: 'Vuln Login API',
    baseUrl: '/',
    endpoints: [
      { method: 'GET', path: '/health', body: null, notes: 'API health check' },
      { method: 'POST', path: '/register', body: { email: 'string', password: 'string' } },
      { method: 'POST', path: '/login', body: { email: 'string', password: 'string' } },
      { method: 'GET', path: '/logs?limit=200', body: null, notes: 'Tail of logs as text/plain' },
      { method: 'GET', path: '/admin/users', body: null, auth: 'X-Admin: 1' },
      { method: 'GET', path: '/admin/docs', body: null, auth: 'X-Admin: 1' },
    ],
  });
});

module.exports = { adminRouter };


