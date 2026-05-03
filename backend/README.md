# ERP Backend (Central LAN Server)

## Purpose

Single central backend for all desktop clients on the local network.

## Setup

1. Copy `.env.example` to `.env`
2. Configure MySQL and LAN runtime values
3. Run:
   - `npm install`
   - `npm run db:init`
   - `npm run start`

## Environment

- `PORT` (default `5001`)
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Server binds to `0.0.0.0` for LAN access.

## API Base

- `GET /api/health`
- `GET /api/customers?page=1&pageSize=20&search=ABC`
- `GET /api/delivery-orders?page=1&pageSize=20&status=pending`
- `GET /api/dashboard/summary`
