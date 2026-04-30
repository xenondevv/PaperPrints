# Local Development Setup

## Prerequisites
- Node.js 18+
- PostgreSQL 15+ (with PostGIS extension)
- Redis 7+
- Python 3.10+ (for pdf-service)
- Git

## Option 1: Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# Backend API: http://localhost:3000
# Vendor Web:  http://localhost:3001
# PostgreSQL:  localhost:5432
# Redis:       localhost:6379
# PDF Service: http://localhost:8001
```

## Option 2: Manual Setup

### 1. Database
```bash
# Create database
createdb paperprints

# Enable PostGIS
psql paperprints -c "CREATE EXTENSION postgis;"
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run migrate
npm run seed
npm run dev
```

### 3. Vendor Website
```bash
cd vendor-web
npm install
npm run dev
```

### 4. PDF Service
```bash
cd pdf-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

## Environment Variables
See `backend/.env.example` for all required variables.
