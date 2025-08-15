const fs = require('fs/promises');
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', '..', 'data', 'users.json');

async function ensureUsersDataFile() {
  try {
    await fs.access(USERS_FILE);
  } catch (_e) {
    await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
    await fs.writeFile(USERS_FILE, '[]', 'utf-8');
  }
}

async function readAllUsers() {
  const raw = await fs.readFile(USERS_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (_e) {
    return [];
  }
}

async function writeAllUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

async function findByEmail(email) {
  const users = await readAllUsers();
  return users.find((u) => u.email === email) || null;
}

async function addUser(user) {
  const users = await readAllUsers();
  users.push(user);
  await writeAllUsers(users);
  return user;
}
async function updateUserPassword(email, newPasswordHash) {
  const users = await readAllUsers();
  const userIndex = users.findIndex(u => u.email === email);
    
  if (userIndex === -1) {
    throw new Error('User not found');
  }
    
  users[userIndex].passwordHash = newPasswordHash;
  await writeAllUsers(users);
    
  return users[userIndex];
}

module.exports = {
  ensureUsersDataFile,
  readAllUsers,
  writeAllUsers,
  findByEmail,
  addUser,
  updateUserPassword,
};


