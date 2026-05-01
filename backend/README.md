# ERP Backend (Node.js + MySQL)

## Setup

1. Copy `.env.example` to `.env`
2. Update DB credentials for XAMPP MySQL
3. Run:
   - `npm install`
   - `npm run db:init`
   - `npm run dev`

## API Base

- `GET /api/health`
- `GET /api/customers?page=1&pageSize=20&search=ABC`
- `GET /api/delivery-orders?page=1&pageSize=20&status=pending`
- `GET /api/dashboard/summary`

## Optimization Notes

- Connection pooling enabled
- Column projection in list APIs
- Pagination with capped page size
- Composite indexes added for frequent filters and sorting
