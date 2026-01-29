@echo off
echo Generating secure dashboard environment...
echo.

cd /d "%~dp0"
node generate-env.js

echo.
echo Dashboard environment configured!
echo You can now start the dashboard with: npm run dev
pause