# Brymix Dashboard - Enterprise Propfirm Challenge Checker

A comprehensive, enterprise-grade dashboard for managing propfirm trading challenge validations with iOS-style glassmorphism design.

## 🚀 Features

- **Enterprise Security**: JWT authentication, rate limiting, account lockout protection
- **Multi-Tenant Architecture**: Each propfirm has isolated data access
- **Real-time Analytics**: Dashboard with job statistics and success rates
- **API Key Management**: Create, view, and delete API keys with usage tracking
- **iOS-Style Design**: Glassmorphism UI with smooth animations
- **Responsive Design**: Works perfectly on desktop and mobile
- **Production Ready**: Optimized for Vercel deployment

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- MongoDB with Mongoose
- JWT Authentication
- Helmet.js Security
- Rate Limiting
- CORS Protection

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React Icons
- Axios for API calls

**Deployment:**
- Vercel (Frontend + API)
- MongoDB Atlas (Database)

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Your existing FastAPI backend running

### Local Development

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd brymix-dashboard
npm install
cd client && npm install
```

2. **Environment Setup:**
```bash
# Copy environment files
cp .env.example .env
cp client/.env.example client/.env

# Update .env with your MongoDB connection string and secrets
```

3. **Start development servers:**
```bash
# Start both backend and frontend
npm run dev

# Or start individually
npm run server  # Backend on :5000
npm run client  # Frontend on :3000
```

## 🌐 Vercel Deployment

### 1. Prepare for Deployment

Update your FastAPI backend to allow CORS from your Vercel domain:
```python
# In your FastAPI main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://brymix.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 3. Configure Environment Variables

In Vercel Dashboard, add these environment variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/brymix-dashboard
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
FASTAPI_URL=https://your-fastapi-backend.com
NODE_ENV=production
CORS_ORIGINS=https://brymix.vercel.app
```

### 4. Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add `brymix.vercel.app` or your custom domain
3. Update CORS_ORIGINS environment variable

## 🔐 Security Features

- **Password Requirements**: 8+ chars, uppercase, lowercase, number, special char
- **Account Lockout**: 5 failed attempts = 2-hour lockout
- **Rate Limiting**: 100 requests/15min, 5 auth attempts/15min
- **JWT Tokens**: 15-minute access tokens, 7-day refresh tokens
- **CORS Protection**: Whitelist specific origins
- **Helmet.js**: Security headers
- **Input Validation**: Server-side validation for all inputs

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### API Keys
- `POST /api/keys/create` - Create new API key
- `GET /api/keys` - List user's API keys
- `DELETE /api/keys/:keyId` - Delete API key
- `GET /api/keys/:keyId/stats` - Get API key usage stats

### Dashboard
- `GET /api/dashboard/overview` - Dashboard statistics
- `GET /api/dashboard/jobs` - List jobs with pagination
- `GET /api/dashboard/jobs/:jobId` - Get job details
- `GET /api/dashboard/analytics` - Analytics data

## 🎨 Design System

The dashboard uses a custom glassmorphism design system:

```css
.glass - Basic glass effect
.glass-card - Card components
.glass-button - Interactive buttons
.glass-input - Form inputs
.glass-nav - Navigation components
```

## 🔧 Configuration

### MongoDB Setup
1. Create MongoDB Atlas cluster
2. Create database user
3. Whitelist Vercel IPs (0.0.0.0/0 for simplicity)
4. Get connection string

### FastAPI Integration
Ensure your FastAPI backend has these endpoints:
- `POST /api/v1/dashboard/create-key`
- `DELETE /api/v1/dashboard/delete-key`
- `GET /api/v1/dashboard/keys/{email}`
- `GET /api/v1/jobs` (with API key header)
- `GET /api/v1/job/{job_id}` (with API key header)

## 📱 Mobile Responsive

The dashboard is fully responsive with:
- Mobile-first design approach
- Touch-friendly interactions
- Optimized glassmorphism effects
- Collapsible navigation

## 🚀 Performance

- **Lazy Loading**: Components loaded on demand
- **Optimized Builds**: Tree shaking and minification
- **CDN Delivery**: Static assets served via Vercel Edge Network
- **Caching**: Aggressive caching for static resources

## 🔍 Monitoring

Built-in monitoring includes:
- Request logging with Morgan
- Error tracking and reporting
- Performance metrics
- User activity tracking

## 📄 License

Proprietary - Brymix Enterprise

---

**Status**: Production Ready ✅  
**Version**: 1.0.0  
**Domain**: https://brymix.vercel.app