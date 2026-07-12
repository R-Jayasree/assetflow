# AssetFlow - Enterprise Asset & Resource Management System

## Quick Start

### 1. Database Setup (MySQL)
```bash
mysql -u root -p
CREATE DATABASE assetflow;
USE assetflow;
SOURCE assetflow_schema.sql;
```

### 2. Backend
```bash
cd backend
npm install
# Edit .env if needed (DB_PASSWORD=sastra)
npm run dev
```
Runs on http://localhost:5000

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173

## Default Login
- Sign up as a new employee, then promote to Admin via database:
```sql
UPDATE employees SET role='Admin' WHERE email='your-email@example.com';
```

## Tech Stack
- Backend: Node.js + Express + MySQL2
- Frontend: React 19 + Vite + Tailwind CSS
- Charts: Recharts
- State: Zustand
