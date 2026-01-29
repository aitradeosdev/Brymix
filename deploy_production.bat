@echo off
echo BRYMIX PRODUCTION DEPLOYMENT
echo =============================

echo 1. Building React dashboard...
cd dashboard
call npm install
call npm run build
cd ..

echo 2. Starting production services...
call start_all.bat

echo =============================
echo Production deployment complete!
echo Dashboard: http://localhost:8000/dashboard
echo API: http://localhost:8000/api/v1/
echo =============================
pause