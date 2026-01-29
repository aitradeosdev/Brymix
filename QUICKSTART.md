# Propfirm Integration - What To Do

## 🎯 Complete Setup in 5 Steps

### Step 1: Get Your API Credentials (2 minutes)

1. Open: **http://localhost:8000/register**
2. Fill in your company details
3. Copy and save:
   - **API Key** (for authentication)
   - **Webhook Secret** (for signature verification)

### Step 2: Add Client Library to Your Code (5 minutes)

Copy `propfirm_client_example.py` into your project:

```python
from brymix_client import BrymixClient

client = BrymixClient(
    api_url="http://localhost:8000",  # Change to your production URL
    api_key="your_api_key_here",
    webhook_secret="your_webhook_secret_here"
)
```

### Step 3: Submit Challenges (10 minutes)

When a trader completes a challenge, call:

```python
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

# Save job_id in your database
challenge.brymix_job_id = result["job_id"]
challenge.save()
```

### Step 4: Create Webhook Endpoint (15 minutes)

Add this endpoint to your platform to receive results:

```python
@app.route('/api/webhook/result', methods=['POST'])
def handle_brymix_webhook():
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
    
    return {"status": "received"}, 200
```

### Step 5: Test & Go Live (10 minutes)

1. Test with a demo MT5 account
2. Verify webhook receives results
3. Check signature verification works
4. Deploy to production
5. Start validating challenges!

## 📚 Resources

- **Documentation**: http://localhost:8000/docs
- **Dashboard**: http://localhost:8000
- **Example Code**: `propfirm_client_example.py`
- **Webhook Test**: `test_webhook_receiver.py`

## 🔄 Complete Flow

```
Trader completes challenge
    ↓
Your Platform calls Brymix API
    ↓
Brymix queues job (returns job_id immediately)
    ↓
Brymix connects to MT5 and checks rules
    ↓
Brymix sends webhook to your platform
    ↓
Your platform receives results
    ↓
Update challenge status
    ↓
Notify trader (pass/fail)
```

## ⚡ Quick Test

Run this to test the complete flow:

```bash
# Terminal 1: Start webhook receiver
python test_webhook_receiver.py

# Terminal 2: Submit test challenge
python test_webhook_flow.py
```

## 🎯 That's It!

Your propfirm is now integrated with Brymix Challenge Checker!

**Total Setup Time**: ~30-45 minutes
**Processing Time**: ~0.1 seconds per challenge
**Concurrent Checks**: 3 simultaneous (configurable)

## 📞 Need Help?

- Check `/docs` for complete API reference
- Review `INTEGRATION.md` for detailed examples
- Test with `propfirm_client_example.py`

---

**Ready to start?** Visit http://localhost:8000/register now!
