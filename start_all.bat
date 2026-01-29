@echo off
echo ============================================================
echo BRYMIX PHASE 2 - STARTING ALL SERVICES
echo ============================================================
echo.

echo Checking Redis...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Redis...
    start "Redis Server" /MIN C:\Redis\redis-server.exe
    timeout /t 2 /nobreak >nul
)
echo [OK] Redis running

echo.
echo Starting Celery Worker...
start "Brymix Worker" cmd /k "cd /d %~dp0 && python -m celery -A app.celery_worker.celery_app worker --loglevel=info --pool=solo"

echo.
echo Waiting for worker to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Starting API Server...
start "Brymix API" cmd /k "cd /d %~dp0 && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo Waiting for API to start...
timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo ALL SERVICES STARTED!
echo ============================================================
echo.
echo Services running:
echo - Redis Server (background)
echo - Celery Worker (new window)
echo - API Server (new window)
echo.
echo Dashboard: http://localhost:8000 (Local)
echo API: http://YOUR-VPS-IP:8000 (External)
echo.
echo To stop all services, close the worker and API windows
echo ============================================================
pause