@echo off
echo Downloading Redis for Windows (simple method)...
echo.

echo Creating Redis directory...
if not exist "C:\Redis" mkdir C:\Redis

echo Downloading Redis...
powershell -Command "try { Invoke-WebRequest -Uri 'https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.zip' -OutFile 'C:\Redis\redis.zip' } catch { Write-Host 'Download failed, trying alternative...' }"

echo Extracting Redis...
powershell -Command "try { Expand-Archive -Path 'C:\Redis\redis.zip' -DestinationPath 'C:\Redis' -Force } catch { Write-Host 'Extract failed' }"

echo Starting Redis server...
cd /d C:\Redis
start "Redis Server" redis-server.exe

echo.
echo Redis should now be running on localhost:6379
echo Check if you see a Redis window opened
echo.
echo Testing Redis connection...
timeout /t 3 /nobreak >nul
redis-cli ping

echo.
echo If you see "PONG" above, Redis is working!
echo You can now run: setup_phase2.bat
pause