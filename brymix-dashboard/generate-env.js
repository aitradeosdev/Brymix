const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate secure random strings
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Generate all secrets
const secrets = {
  JWT_SECRET: generateSecret(64),
  JWT_REFRESH_SECRET: generateSecret(64),
  SESSION_SECRET: generateSecret(64),
  ENCRYPTION_KEY: generateEncryptionKey()
};

// Create .env content
const envContent = `# Development Environment Variables (Auto-generated)

# MongoDB Configuration (Local or Atlas for development)
MONGODB_URI=mongodb://localhost:27017/brymix-dashboard-dev

# JWT Secrets (Auto-generated - DO NOT SHARE)
JWT_SECRET=${secrets.JWT_SECRET}
JWT_REFRESH_SECRET=${secrets.JWT_REFRESH_SECRET}

# FastAPI Backend URL (Local development)
FASTAPI_URL=http://localhost:8000

# Server Configuration
NODE_ENV=development
PORT=5000

# Security (Auto-generated)
BCRYPT_ROUNDS=10
SESSION_SECRET=${secrets.SESSION_SECRET}

# Rate Limiting (More lenient for development)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=50

# CORS Origins (Development)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Logging
LOG_LEVEL=debug

# Encryption (Auto-generated)
ENCRYPTION_KEY=${secrets.ENCRYPTION_KEY}

# Two-Factor Authentication
TOTP_ISSUER=Brymix
TOTP_WINDOW=2
`;

// Write to .env file
const envPath = path.join(__dirname, '.env');
fs.writeFileSync(envPath, envContent);

console.log('✅ Dashboard .env file generated with secure secrets!');
console.log('📁 Location:', envPath);
console.log('🔐 Secrets generated:');
console.log('   - JWT_SECRET (64 chars)');
console.log('   - JWT_REFRESH_SECRET (64 chars)');
console.log('   - SESSION_SECRET (64 chars)');
console.log('   - ENCRYPTION_KEY (32 bytes hex)');
console.log('');
console.log('⚠️  Keep these secrets secure and never commit them to git!');