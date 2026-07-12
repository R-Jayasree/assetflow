# AssetFlow Backend

FastAPI-based backend for AssetFlow Enterprise Asset & Resource Management System.

## Tech Stack
- **Framework**: FastAPI
- **ORM**: SQLAlchemy 2.0
- **Database**: MySQL 5.1+
- **Auth**: JWT (python-jose) + bcrypt
- **Validation**: Pydantic v2

## Setup

### 1. Install Dependencies
```bash
cd assetflow-backend
pip install -r requirements.txt
```

### 2. Configure Database
Copy `.env.example` to `.env` and update:
```bash
DB_HOST=localhost
DB_PORT=3306
DB_NAME=assetflow
DB_USER=root
DB_PASSWORD=your_password
SECRET_KEY=your-secret-key
```

### 3. Run Database Schema
```bash
mysql -u root -p
CREATE DATABASE assetflow CHARACTER SET utf8 COLLATE utf8_general_ci;
USE assetflow;
SOURCE ../database/assetflow_schema.sql;
```

### 4. Start Server
```bash
python run.py
```

Server runs at `http://localhost:8000`

API Docs: `http://localhost:8000/docs`

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/signup` | Register new employee | No |
| POST | `/api/v1/auth/login` | Login (OAuth2 form) | No |
| POST | `/api/v1/auth/logout` | Logout | Yes |
| GET | `/api/v1/auth/me` | Get current user | Yes |
| POST | `/api/v1/auth/change-password` | Change password | Yes |
| POST | `/api/v1/auth/forgot-password` | Request reset | No |
| POST | `/api/v1/auth/reset-password` | Reset password | No |
| POST | `/api/v1/auth/refresh` | Refresh token | Yes |

### Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/dashboard/kpis` | Get KPI cards | Yes |
| GET | `/api/v1/dashboard/overdue-returns` | Overdue allocations | Yes |
| GET | `/api/v1/dashboard/upcoming-returns` | Returns due soon | Yes |
| GET | `/api/v1/dashboard/quick-actions` | Role-based actions | Yes |
| GET | `/api/v1/dashboard/full` | Complete dashboard | Yes |
| GET | `/api/v1/dashboard/admin-overview` | Admin analytics | Admin |

## Project Structure
```
assetflow-backend/
├── app/
│   ├── core/           # Config, DB, Security
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic request/response
│   ├── routers/        # API endpoints
│   ├── services/       # Business logic
│   └── main.py         # FastAPI app
├── alembic/            # DB migrations
├── requirements.txt
└── run.py
```
