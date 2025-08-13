## Vuln Login API (for practice)

Intentionally vulnerable Express API implementing a homegrown password hashing scheme, noisy logging, and insecure defaults for educational use.

### Setup

1. Node.js 20+
2. Install deps:
   - `npm install`
3. Run:
   - `npm start`

API runs on `http://localhost:3000` by default.

### Endpoints

- POST `/register` with JSON `{ "email": string, "password": string }`
- POST `/login` with JSON `{ "email": string, "password": string }`
- GET `/health`

### Notes

- User data is stored in `data/users.json` for easy reading.
- Logs are written to `logs/app.log` and occasionally include random hashes and Chuck Norris jokes.


