
# Admin Dashboard Design

LAN-first desktop ERP with a centralized backend server and multiple Electron clients.

## Architecture

- `backend/`: Central Node.js + Express API with MySQL
- `src/` + `electron/`: Electron + React client UI only (no local DB/server)
- Clients connect to one LAN server via configurable API base URL

## Client Setup (Electron UI)

1. Install dependencies: `npm i`
2. Configure API base URL using either:
   - `public/app-config.json` (recommended for packaged app)
   - `.env` with `VITE_API_BASE_URL` (development)
3. Run the app:
   - Development: `npm run dev`
   - Desktop start: `npm start`

If the server is unavailable, client shows a dedicated disconnected state and API calls auto-retry.

## Central Server Setup

1. `cd backend`
2. Copy `.env.example` to `.env`
3. Set LAN/MySQL values (`PORT`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)
4. Install and start:
   - `npm i`
   - `npm run db:init`
   - `npm run start`

Server listens on `0.0.0.0` and exposes APIs under `/api` for LAN clients.
  