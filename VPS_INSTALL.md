# VPS Installation Guide

## Prerequisites (Already Installed)
- ✅ Windows VPS
- ✅ Python 3.9+
- ✅ Redis Server
- ✅ MetaTrader 5

## Installation Steps

### 1. Clone Repository
```bash
git clone https://github.com/aitradeosdev/Brymix.git
cd Brymix
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
Create `.env` file:
```env
# MT5 Configuration
MT5_PATH=C:\Program Files\MetaTrader 5\terminal64.exe
MT5_POOL_SIZE=3
MT5_TIMEOUT=30

# Security
WEBHOOK_SECRET=your_secure_webhook_secret_here
API_SECRET_KEY=your_api_secret_key_here
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Redis
REDIS_URL=redis://localhost:6379/0

# Database
DATABASE_URL=sqlite:///./brymix.db

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# API Settings
API_HOST=0.0.0.0
API_PORT=8000
```

### 4. Initialize Database
```bash
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 5. Create API Key
```bash
python manage_keys.py create "Production API Key"
```

### 6. Start Services

**Option A: Manual Start**
```bash
# Terminal 1: Start FastAPI
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Start Celery Worker
celery -A app.celery_worker worker --loglevel=info --pool=solo
```

**Option B: Use Batch File**
```bash
start_all.bat
```

### 7. Test Installation
```bash
python test_phase2.py
```

### 8. Access Points
- **API**: http://your-vps-ip:8000
- **API Docs**: http://your-vps-ip:8000/docs
- **Health Check**: http://your-vps-ip:8000/health

## Production Considerations

### Firewall Rules
Open port 8000 for API access:
```bash
# Windows Firewall
netsh advfirewall firewall add rule name="Brymix API" dir=in action=allow protocol=TCP localport=8000
```

### Process Management
Consider using PM2 or similar for process management:
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### SSL Certificate
Use nginx or IIS as reverse proxy with SSL certificate for production.

### Monitoring
- Check logs in the console windows
- Monitor Redis: `redis-cli monitor`
- Check MT5 connection status in logs