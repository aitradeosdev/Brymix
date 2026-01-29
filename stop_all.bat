@echo off
echo Stopping all Brymix services...

echo Stopping API Server...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul

echo Stopping Celery Worker...
taskkill /F /IM celery.exe 2>nul
taskkill /F /FI "WINDOWTITLE eq Brymix Worker*" 2>nul

echo Stopping Redis...
taskkill /F /IM redis-server.exe 2>nul

echo.
echo All services stopped!
pause