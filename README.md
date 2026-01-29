# Brymix Propfirm Challenge Checker

A production-ready system for validating propfirm trading challenges with MetaTrader 5 integration and modern dashboard.

## 🚀 Features

### Core System
- **4-Minute Trade Duration Rule**: Automatically detects trades held for less than 4 minutes
- **Maximum Drawdown Detection**: Uses 1-minute bar analysis to detect equity breaches
- **Multi-Terminal Processing**: Concurrent MT5 terminal pool for scalability
- **Redis Job Queue**: Background processing with Celery workers
- **Webhook Integration**: HMAC-SHA256 signed callbacks with per-API-key secrets
- **API Key Authentication**: Database-backed secure access with multi-tenancy

### Dashboard
- **Modern UI**: Clean black & white design like popular SaaS platforms
- **Two-Factor Authentication**: TOTP-based 2FA with backup codes
- **API Key Management**: Create, view, and manage API keys with webhook secrets
- **Real-time Analytics**: Monitor jobs and statistics with API key filtering
- **Interactive Documentation**: Complete integration guide for propfirms
- **Multi-tenant Support**: Isolated data per user/company

## ✅ Implementation Status

### Phase 1: Core System ✅
- ✅ FastAPI setup + endpoints
- ✅ MT5 single terminal integration
- ✅ Duration checker (4-minute rule)
- ✅ Drawdown checker (1-min bars)
- ✅ Webhook client with signatures

### Phase 2: Multi-Terminal + Queue ✅
- ✅ Redis job queue
- ✅ MT5 terminal pool (3 concurrent)
- ✅ Celery background workers
- ✅ SQLite database
- ✅ Job persistence

### Phase 3: Security + Dashboard ✅
- ✅ Database-backed API keys
- ✅ Per-API-key webhook secrets
- ✅ Modern React dashboard
- ✅ Real-time job monitoring
- ✅ Auto-refresh stats

### Phase 4: Advanced Features ✅
- ✅ Two-factor authentication
- ✅ API key selection & filtering
- ✅ Interactive documentation
- ✅ Professional UI design
- ✅ Multi-tenant architecture

## 📦 Quick Start

### Prerequisites
- Windows OS (MT5 requirement)
- Python 3.9+
- Node.js 16+
- MetaTrader 5 installed
- Redis server

### Installation

```bash
# 1. Install Redis
call install_redis_simple.bat

# 2. Setup Backend
python -m pip install -r requirements.txt


# 3. Setup Dashboard
cd brymix-dashboard
npm install
cd server && npm install

# 4. Start all services
call start_all.bat

# 5. Start dashboard (separate terminal)
cd brymix-dashboard
npm run dev
```

### Create API Key

1. Register at: http://localhost:3000/register
2. Login and create API key from dashboard
3. Use API key for challenge validation

 test_phase2.py
```

### Access Points

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔧 Configuration

### Backend (.env)
```env
# MT5
MT5_PATH=C:\Program Files\MetaTrader 5\terminal64.exe
MT5_POOL_SIZE=3

# Security
WEBHOOK_SECRET=your_secure_secret
API_SECRET_KEY=your_api_secret

# Redis
REDIS_URL=redis://localhost:6379/0

# Database
DATABASE_URL=sqlite:///./brymix.db
```

### Dashboard (.env)
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/brymix-dashboard

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# FastAPI Backend
FASTAPI_URL=http://localhost:8000

# Security
ENCRYPTION_KEY=your_encryption_key
TOTP_ISSUER=Brymix
```

## 📡 API Usage

### Submit Challenge Check
```bash
POST /api/v1/check
Headers: X-API-Key: your_key
Body: {
  "user_id": "user_123",
  "challenge_id": "challenge_456",
  "mt5_login": "12345678",
  "mt5_password": "password",
  "mt5_server": "Broker-Server",
  "initial_balance": 100000.0,
  "rules": {
    "max_drawdown_percent": 10.0,
    "profit_target_percent": 10.0
  },
  "callback_url": "https://yourapp.com/webhook"
}
```

### Check Job Status
```bash
GET /api/v1/job/{job_id}
Headers: X-API-Key: your_key
```

### Webhook Verification
```python
import hmac
import hashlib

def verify_signature(payload: str, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)
```

## 🔐 Security Features

- **Per-API-Key Webhook Secrets**: Each API key has unique webhook secret
- **Two-Factor Authentication**: TOTP-based 2FA with backup codes
- **Multi-tenant Architecture**: Complete data isolation per user
- **HMAC Signature Verification**: Secure webhook validation
- **JWT Authentication**: Secure dashboard sessions
- **Rate Limiting**: API abuse protection

## 📊 Rules Checked

### 1. Minimum Trade Duration
- All positions must be held ≥ 4 minutes (240 seconds)
- Checks complete account history
- Reports ticket, symbol, duration

### 2. Maximum Drawdown
- Equity must never breach max drawdown threshold
- Analyzes 1-minute bars for floating P&L
- Calculates complete equity curve

## 🛠️ Management Commands

```bash
# Start all services
call start_all.bat

# Stop all services
call stop_all.bat

# Dashboard development
cd brymix-dashboard
npm run dev

# Backend only
uvicorn app.main:app --reload
```

## 📁 Project Structure

```
brymix/
├── app/
│   ├── main.py              # FastAPI app
│   ├── celery_worker.py     # Background worker
│   ├── mt5_pool.py          # Terminal pool
│   ├── database.py          # SQLAlchemy models
│   ├── rule_checker.py      # Rule orchestrator
│   ├── duration_checker.py  # 4-min rule
│   ├── drawdown_checker.py  # Drawdown analysis
│   └── webhook_client.py    # Webhook handling
├── brymix-dashboard/
│   ├── client/              # React frontend
│   │   ├── src/pages/       # Dashboard pages
│   │   ├── src/components/  # Reusable components
│   │   └── src/contexts/    # React contexts
│   └── server/              # Node.js backend
│       ├── routes/          # API routes
│       ├── models/          # MongoDB models
│       └── middleware/      # Auth middleware
├── start_all.bat            # Start services
├── stop_all.bat             # Stop services
└── test_phase2.py           # Test script
```

## 🚨 Troubleshooting

### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# Restart Redis
call install_redis_simple.bat
```

### Dashboard Won't Start
```bash
# Install dependencies
cd brymix-dashboard
npm install
cd server && npm install

# Check MongoDB connection
# Update MONGODB_URI in .env
```

### MT5 Connection Issues
- Verify MT5_PATH in .env
- Check MT5 credentials
- Ensure broker provides 1-min bars

## 📈 Performance

- **Concurrent Jobs**: 3 MT5 terminals
- **Processing Time**: ~0.1s per check
- **Queue**: Redis-backed, persistent
- **Database**: SQLite (upgrade to PostgreSQL for production)
- **Dashboard**: React with real-time updates

## 🔜 Production Deployment

- Docker containerization
- PostgreSQL migration
- Nginx reverse proxy
- SSL/HTTPS
- Monitoring (Prometheus/Grafana)
- Production hardening

## 📄 License

Proprietary - Brymix Propfirm

---

**Status**: Complete ✅  
**Version**: 3.0.0  
**Last Updated**: 2026-01-29
