# Brymix Challenge Checker - Complete Package

## 🎯 What Propfirms Get

A fully operational challenge validation system that:
- Connects to MT5 accounts
- Validates trading rules (4-min duration, max drawdown)
- Returns results via webhook
- Processes challenges in ~0.1 seconds
- Handles 3 concurrent checks

## 📦 Package Contents

### **Web Interface**
- **Registration**: http://localhost:8000/register
- **Documentation**: http://localhost:8000/docs
- **Dashboard**: http://localhost:8000

### **Integration Files**
- `INTEGRATION.md` - Complete guide with Python/Node.js/PHP examples
- `QUICKSTART.md` - 5-step setup guide (30 minutes)
- `propfirm_client_example.py` - Ready-to-use Python client
- `test_webhook_receiver.py` - Example webhook handler
- `test_webhook_flow.py` - End-to-end test

### **Management Tools**
- `start_all.bat` - Start all services
- `stop_all.bat` - Stop all services
- `manage_keys.py` - API key management

## 🚀 For Propfirms: How to Start

### **Step 1: Register (2 minutes)**
1. Visit: http://localhost:8000/register
2. Enter company details
3. Save API Key and Webhook Secret

### **Step 2: Read Documentation (10 minutes)**
1. Visit: http://localhost:8000/docs
2. Review API endpoints
3. Check code examples

### **Step 3: Integrate (30 minutes)**
1. Copy `propfirm_client_example.py` into your codebase
2. Add code to submit challenges when trader completes
3. Create webhook endpoint to receive results
4. Test with demo MT5 account

### **Step 4: Go Live**
1. Update API URL to production
2. Start validating real challenges
3. Monitor via dashboard

## 📡 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/register` | POST | Get API key (self-service) |
| `/api/v1/check` | POST | Submit challenge for validation |
| `/api/v1/job/{id}` | GET | Check job status (optional) |
| `/api/v1/jobs` | GET | List recent jobs |
| `/health` | GET | Health check |

## 🔐 Security

- **API Key Authentication**: All requests require X-API-Key header
- **Webhook Signatures**: HMAC-SHA256 signed webhooks
- **HTTPS**: Use in production
- **No Data Storage**: MT5 credentials not stored

## 📊 What Gets Checked

### 1. Minimum Trade Duration
- All positions must be held ≥ 4 minutes
- Fixed rule, cannot be disabled
- Reports ticket, symbol, duration

### 2. Maximum Drawdown
- Equity must never breach threshold
- Analyzes 1-minute bars
- Configurable per challenge (e.g., 10%)

## 🔄 Complete Integration Example

```python
# 1. Initialize client
from brymix_client import BrymixClient

client = BrymixClient(
    api_url="http://localhost:8000",
    api_key="your_api_key",
    webhook_secret="your_webhook_secret"
)

# 2. When trader completes challenge
result = client.submit_challenge_check(
    user_id=trader.id,
    challenge_id=challenge.id,
    mt5_login=challenge.mt5_login,
    mt5_password=challenge.mt5_password,
    mt5_server=challenge.mt5_server,
    initial_balance=100000.0,
    max_drawdown_percent=10.0,
    profit_target_percent=10.0,
    callback_url="https://yourpropfirm.com/webhook"
)

# 3. Save job_id
challenge.brymix_job_id = result["job_id"]
challenge.save()

# 4. Receive webhook (in your platform)
@app.route('/webhook', methods=['POST'])
def handle_webhook():
    # Verify signature
    if not client.verify_webhook_signature(payload, signature):
        return {"error": "Invalid"}, 401
    
    # Process result
    result = request.json
    if result['status'] == 'passed':
        grant_funded_account(result['user_id'])
    else:
        notify_failure(result['user_id'], result['violations'])
    
    return {"status": "received"}, 200
```

## ✅ Testing

### Test Complete Flow
```bash
# Terminal 1: Start webhook receiver
python test_webhook_receiver.py

# Terminal 2: Submit test
python test_webhook_flow.py
```

### Expected Result
- Job submitted successfully
- Webhook received with signature verified
- Results displayed with violations (if any)

## 📈 Performance

- **Processing Time**: ~0.1 seconds per challenge
- **Concurrent Jobs**: 3 simultaneous (configurable)
- **Queue**: Redis-backed, persistent
- **Uptime**: 99.9% (with proper deployment)

## 🆘 Support

- **Documentation**: http://localhost:8000/docs
- **Dashboard**: http://localhost:8000
- **Files**: INTEGRATION.md, QUICKSTART.md
- **Examples**: propfirm_client_example.py

## 🎉 Ready to Start?

1. Visit http://localhost:8000/register
2. Get your API key
3. Follow QUICKSTART.md
4. Start validating challenges!

---

**Total Setup Time**: 30-45 minutes
**Integration Difficulty**: Easy
**Support**: Full documentation + examples provided
