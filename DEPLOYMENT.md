# Brymix Challenge Checker - Deployment Summary

## What This System Does

Brymix Challenge Checker is a **standalone service** that validates propfirm trading challenges by:
1. Connecting to trader's MT5 account
2. Checking trading rules (4-min duration, max drawdown)
3. Returning pass/fail results to your propfirm platform

## Architecture

```
┌─────────────────────────┐
│  Your Propfirm Platform │  (Your existing system)
│  - Trader management    │
│  - Challenge creation   │
│  - Payment processing   │
└───────────┬─────────────┘
            │
            │ (1) API Call: Submit challenge check
            ↓
┌─────────────────────────┐
│   Brymix API Server     │  (This system - runs on VPS)
│   - Receives requests   │
│   - Queues jobs         │
│   - Returns job_id      │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│   Redis + Celery        │
│   - Job queue           │
│   - Background workers  │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│   MT5 Terminal Pool     │
│   - Connects to MT5     │
│   - Fetches trade data  │
│   - Checks rules        │
└───────────┬─────────────┘
            │
            │ (2) Webhook: Send results back
            ↓
┌─────────────────────────┐
│  Your Propfirm Platform │
│  - Receives results     │
│  - Updates challenge    │
│  - Notifies trader      │
└─────────────────────────┘
```

## Deployment Options

### Option 1: Brymix Hosted (Recommended)
- We host and maintain the system
- You just integrate via API
- Monthly subscription based on volume
- Contact: sales@brymix.com

### Option 2: Self-Hosted
- You deploy on your own VPS
- Full control and customization
- One-time license fee
- See deployment guide below

## Self-Hosted Deployment

### Requirements
- Windows VPS (for MT5)
- 4GB RAM minimum
- Python 3.9+
- Redis server
- Domain with SSL certificate

### Quick Deploy

1. **Setup VPS**
```bash
# Install Python, Redis, MT5
# Clone repository
git clone https://github.com/brymix/challenge-checker.git
cd challenge-checker
```

2. **Configure**
```bash
# Edit .env file
MT5_PATH=C:\Program Files\MetaTrader 5\terminal64.exe
API_SECRET_KEY=your_secure_random_key
WEBHOOK_SECRET=your_webhook_secret
```

3. **Start Services**
```bash
call start_all.bat
```

4. **Setup Reverse Proxy (Nginx)**
```nginx
server {
    listen 443 ssl;
    server_name api.yourpropfirm.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Integration in Your Propfirm

### Step 1: Get API Key
```bash
python manage_keys.py create "your_propfirm_name"
# Save the generated key
```

### Step 2: Add to Your Code

**When trader completes challenge:**
```python
from propfirm_client_example import BrymixClient

client = BrymixClient(
    api_url="https://api.yourpropfirm.com",
    api_key="your_api_key",
    webhook_secret="your_webhook_secret"
)

# Submit check
result = client.submit_challenge_check(
    user_id=trader.id,
    challenge_id=challenge.id,
    mt5_login=challenge.mt5_login,
    mt5_password=challenge.mt5_password,
    mt5_server=challenge.mt5_server,
    initial_balance=challenge.initial_balance,
    max_drawdown_percent=10.0,
    profit_target_percent=10.0,
    callback_url="https://yourpropfirm.com/api/webhook/result"
)

# Save job_id
challenge.brymix_job_id = result["job_id"]
challenge.save()
```

**Receive results via webhook:**
```python
@app.route('/api/webhook/result', methods=['POST'])
def handle_result():
    # Verify signature
    signature = request.headers.get('X-Signature')
    payload = request.get_data(as_text=True)
    
    if not client.verify_webhook_signature(payload, signature):
        return {"error": "Invalid signature"}, 401
    
    # Process result
    result = request.json
    challenge = Challenge.get(result['challenge_id'])
    
    if result['status'] == 'passed':
        challenge.status = 'PASSED'
        grant_funded_account(challenge.user_id)
    else:
        challenge.status = 'FAILED'
        challenge.violations = result['violations']
    
    challenge.save()
    notify_trader(challenge)
    
    return {"status": "received"}
```

## Files Provided

1. **INTEGRATION.md** - Complete integration guide with examples in Python, Node.js, PHP
2. **propfirm_client_example.py** - Ready-to-use Python client
3. **README.md** - System documentation
4. **start_all.bat** - Start all services
5. **stop_all.bat** - Stop all services
6. **manage_keys.py** - API key management

## Testing

Use the test script to verify integration:
```bash
python propfirm_client_example.py
```

## Support

- Documentation: See INTEGRATION.md
- Example Code: propfirm_client_example.py
- Technical Support: support@brymix.com
- API Status: Check dashboard at http://your-server:8000

## Pricing (Self-Hosted License)

- Single Server: $2,999 one-time
- Multi-Server: $4,999 one-time
- Enterprise: Contact sales

Includes:
- Full source code
- Deployment support
- 1 year updates
- Technical support

## Next Steps

1. Review INTEGRATION.md
2. Test with propfirm_client_example.py
3. Deploy to VPS or contact for hosted solution
4. Integrate into your propfirm platform
5. Go live!

---

**Questions?** Contact: sales@brymix.com
