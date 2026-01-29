# Propfirm Integration Guide

This guide shows how your propfirm platform integrates with the Brymix Challenge Checker.

## Architecture

```
[Your Propfirm Platform] 
    ↓ (1) Submit check request
[Brymix API] → [Redis Queue] → [Celery Worker] → [MT5]
    ↓ (2) Webhook callback with results
[Your Propfirm Platform]
```

## Integration Steps

### 1. Get Your API Key

Contact Brymix admin or generate via:
```bash
python manage_keys.py create "your_propfirm_name"
```

Save the generated key securely.

### 2. Submit Challenge Check

When a trader completes a challenge, your platform calls:

**Endpoint**: `POST http://localhost:8000/api/v1/check`

**Example (Python)**:
```python
import requests

def submit_challenge_check(user_id, challenge_id, mt5_credentials):
    url = "http://localhost:8000/api/v1/check"
    
    headers = {
        "X-API-Key": "your_brymix_api_key",
        "Content-Type": "application/json"
    }
    
    payload = {
        "user_id": user_id,
        "challenge_id": challenge_id,
        "mt5_login": mt5_credentials["login"],
        "mt5_password": mt5_credentials["password"],
        "mt5_server": mt5_credentials["server"],
        "initial_balance": 100000.0,
        "rules": {
            "max_drawdown_percent": 10.0,
            "profit_target_percent": 10.0
        },
        "callback_url": "https://yourpropfirm.com/api/webhook/challenge-result"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        job_id = result["job_id"]
        
        # Store job_id in your database linked to the challenge
        save_job_id(challenge_id, job_id)
        
        return job_id
    else:
        raise Exception(f"Failed to submit check: {response.text}")
```

**Example (Node.js)**:
```javascript
const axios = require('axios');

async function submitChallengeCheck(userId, challengeId, mt5Credentials) {
    const url = 'http://localhost:8000/api/v1/check';
    
    const response = await axios.post(url, {
        user_id: userId,
        challenge_id: challengeId,
        mt5_login: mt5Credentials.login,
        mt5_password: mt5Credentials.password,
        mt5_server: mt5Credentials.server,
        initial_balance: 100000.0,
        rules: {
            max_drawdown_percent: 10.0,
            profit_target_percent: 10.0
        },
        callback_url: 'http://localhost:8000/api/webhook/challenge-result'
    }, {
        headers: {
            'X-API-Key': 'your_brymix_api_key',
            'Content-Type': 'application/json'
        }
    });
    
    const jobId = response.data.job_id;
    
    // Store job_id in your database
    await saveJobId(challengeId, jobId);
    
    return jobId;
}
```

**Example (PHP)**:
```php
<?php
function submitChallengeCheck($userId, $challengeId, $mt5Credentials) {
    $url = 'http://localhost:8000/api/v1/check';
    
    $payload = [
        'user_id' => $userId,
        'challenge_id' => $challengeId,
        'mt5_login' => $mt5Credentials['login'],
        'mt5_password' => $mt5Credentials['password'],
        'mt5_server' => $mt5Credentials['server'],
        'initial_balance' => 100000.0,
        'rules' => [
            'max_drawdown_percent' => 10.0,
            'profit_target_percent' => 10.0
        ],
        'callback_url' => 'https://yourpropfirm.com/api/webhook/challenge-result'
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-Key: your_brymix_api_key',
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $result = json_decode($response, true);
    
    $jobId = $result['job_id'];
    
    // Store job_id in your database
    saveJobId($challengeId, $jobId);
    
    return $jobId;
}
?>
```

### 3. Receive Webhook Results

Create an endpoint in your propfirm platform to receive results:

**Your Endpoint**: `POST /api/webhook/challenge-result`

**Example (Python/Flask)**:
```python
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)
WEBHOOK_SECRET = "your_webhook_secret"  # Same as Brymix config

def verify_signature(payload, signature):
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

@app.route('/api/webhook/challenge-result', methods=['POST'])
def handle_challenge_result():
    # Verify signature
    signature = request.headers.get('X-Signature')
    payload = request.get_data(as_text=True)
    
    if not verify_signature(payload, signature):
        return jsonify({"error": "Invalid signature"}), 401
    
    # Process result
    result = request.json
    
    challenge_id = result['challenge_id']
    status = result['status']  # 'passed' or 'failed'
    violations = result['violations']
    metrics = result['metrics']
    
    # Update challenge in your database
    update_challenge_status(
        challenge_id=challenge_id,
        status=status,
        violations=violations,
        metrics=metrics
    )
    
    # Notify trader
    if status == 'passed':
        send_email_passed(challenge_id)
    else:
        send_email_failed(challenge_id, violations)
    
    return jsonify({"status": "received"}), 200
```

**Example (Node.js/Express)**:
```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
const WEBHOOK_SECRET = 'your_webhook_secret';

function verifySignature(payload, signature) {
    const expected = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
    );
}

app.post('/api/webhook/challenge-result', express.raw({type: 'application/json'}), async (req, res) => {
    const signature = req.headers['x-signature'];
    const payload = req.body.toString();
    
    if (!verifySignature(payload, signature)) {
        return res.status(401).json({error: 'Invalid signature'});
    }
    
    const result = JSON.parse(payload);
    
    // Update challenge
    await updateChallengeStatus({
        challengeId: result.challenge_id,
        status: result.status,
        violations: result.violations,
        metrics: result.metrics
    });
    
    // Notify trader
    if (result.status === 'passed') {
        await sendEmailPassed(result.challenge_id);
    } else {
        await sendEmailFailed(result.challenge_id, result.violations);
    }
    
    res.json({status: 'received'});
});
```

### 4. Optional: Poll for Status

If webhook fails, you can poll for results:

```python
def check_job_status(job_id):
    url = f"http://localhost:8000/api/v1/job/{job_id}"
    
    headers = {
        "X-API-Key": "your_brymix_api_key"
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to get status: {response.text}")
```

## Response Format

### Success Response
```json
{
  "job_id": "job_abc123",
  "user_id": "user_123",
  "challenge_id": "challenge_456",
  "status": "passed",
  "metrics": {
    "initial_balance": 100000.0,
    "current_balance": 110000.0,
    "current_equity": 110500.0,
    "profit_percent": 10.0,
    "profit_target_percent": 10.0,
    "profit_target_met": true,
    "max_drawdown_percent": 5.2,
    "max_drawdown_limit": 10.0,
    "total_trades": 45,
    "trades_under_4min": 0
  },
  "violations": [],
  "timestamp": "2026-01-16T10:00:00Z"
}
```

### Failed Response
```json
{
  "job_id": "job_abc123",
  "user_id": "user_123",
  "challenge_id": "challenge_456",
  "status": "failed",
  "metrics": {
    "initial_balance": 100000.0,
    "current_balance": 95000.0,
    "current_equity": 95200.0,
    "profit_percent": -5.0,
    "profit_target_percent": 10.0,
    "profit_target_met": false,
    "max_drawdown_percent": 11.5,
    "max_drawdown_limit": 10.0,
    "total_trades": 45,
    "trades_under_4min": 3
  },
  "violations": [
    {
      "rule": "minimum_trade_duration",
      "description": "Position held for 3m 45s (minimum: 4m)",
      "ticket": 12345,
      "symbol": "EURUSD",
      "open_time": "2026-01-16T08:00:00",
      "close_time": "2026-01-16T08:03:45",
      "duration_seconds": 225
    },
    {
      "rule": "maximum_drawdown",
      "description": "Drawdown reached 11.5% (max: 10%)",
      "timestamp": "2026-01-16T09:15:00",
      "equity": 88500.0,
      "drawdown_percent": 11.5,
      "max_allowed_percent": 10.0
    }
  ],
  "timestamp": "2026-01-16T10:00:00Z"
}
```

## Troubleshooting

### Webhook 401 "Invalid signature"

**Symptom**: Celery logs show `Webhook failed: 401 - {"error":"Invalid signature"}`

**Cause**: The `WEBHOOK_SECRET` in your propfirm doesn't match Brymix's `.env`

**Solution**:
1. Check Brymix `.env` file:
   ```bash
   # In Brymix folder
   type .env | findstr WEBHOOK_SECRET
   ```
   Output: `WEBHOOK_SECRET=brymix_webhook_secret_key_2024_secure_random_string_xyz789`

2. Update your propfirm code to use EXACT same value:
   ```python
   WEBHOOK_SECRET = "brymix_webhook_secret_key_2024_secure_random_string_xyz789"
   ```

3. Restart your propfirm webhook receiver

4. Test again - should return 200 OK

### Webhook 404 "Cannot POST"

**Cause**: Endpoint path mismatch between `callback_url` and your receiver

**Solution**: Ensure `callback_url` in step 2 matches your endpoint in step 3

## Deployment

### Your Propfirm Platform
- Runs on your servers
- Manages traders, challenges, payments
- Calls Brymix API when challenge completes

### Brymix System
- Runs on separate VPS (recommended)
- Handles MT5 connections and validationections and rule checking
- Sends results back via webhook

### Network Flow
```
Trader completes challenge
    ↓
Your Platform → Brymix API (HTTPS)
    ↓
Brymix checks MT5 account
    ↓
Brymix → Your Platform webhook (HTTPS)
    ↓
Your Platform updates challenge status
    ↓
Trader sees result
```

## Security

1. **API Key**: Keep secure, rotate periodically
2. **Webhook Secret**: Verify all incoming webhooks
3. **HTTPS**: Always use HTTPS in production
4. **MT5 Credentials**: Transmitted securely, not stored by Brymix

## Support

Contact: support@brymix.com

Please note, use the exact localhost url  for the api calls will be replaced later when you need production access
