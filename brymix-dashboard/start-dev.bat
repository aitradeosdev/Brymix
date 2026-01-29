@echo off
echo 🚀 Starting Brymix Dashboard in Development Mode
echo ================================================

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found, copying from .env.example
    copy .env.example .env
    echo ✅ Created .env file - please update with your MongoDB connection string
)

REM Set development environment
set NODE_ENV=development

echo.
echo 🔧 Development Configuration:
echo    • Node Environment: %NODE_ENV%
echo    • Server Port: 5000
echo    • Client Port: 3000
echo    • Enhanced Logging: Enabled
echo    • Rate Limiting: Relaxed (1000 req/15min)
echo.

REM Start both server and client concurrently
echo 🏃 Starting both server and client...
npm run dev