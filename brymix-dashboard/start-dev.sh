#!/bin/bash

echo "🚀 Starting Brymix Dashboard in Development Mode"
echo "================================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, copying from .env.example"
    cp .env.example .env
    echo "✅ Created .env file - please update with your MongoDB connection string"
fi

# Check if MongoDB URI is configured
if grep -q "your-username:your-password" .env; then
    echo "⚠️  Please update MONGODB_URI in .env with your actual MongoDB connection string"
    echo "   Current: $(grep MONGODB_URI .env)"
fi

# Set development environment
export NODE_ENV=development

echo ""
echo "🔧 Development Configuration:"
echo "   • Node Environment: $NODE_ENV"
echo "   • Server Port: 5000"
echo "   • Client Port: 3000"
echo "   • Enhanced Logging: Enabled"
echo "   • Rate Limiting: Relaxed (1000 req/15min)"
echo ""

# Start both server and client concurrently
echo "🏃 Starting both server and client..."
npm run dev