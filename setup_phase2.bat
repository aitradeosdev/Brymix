@echo off
echo ============================================================
echo BRYMIX CHALLENGE CHECKER - PHASE 2 SETUP
echo ============================================================
echo.

echo 1. Installing Phase 2 dependencies...
pip install -r requirements.txt

echo.
echo 2. Creating database tables...
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine); print('Database initialized')"

echo.
echo 3. Creating default API key...
python manage_keys.py create "default_test_key"

echo.
echo ============================================================
echo PHASE 2 SETUP COMPLETE!
echo ============================================================
echo.
echo Next steps:
echo 1. Install Redis: https://redis.io/download
echo 2. Start Redis server
echo 3. Run: start_worker.bat (in one terminal)
echo 4. Run: start_api.bat (in another terminal)
echo 5. Open: http://localhost:8000 (dashboard)
echo.
echo Phase 2 Features:
echo - Multi-terminal MT5 pool
echo - Redis job queue with Celery
echo - Database persistence
echo - Web dashboard
echo - API key management
echo.
pause