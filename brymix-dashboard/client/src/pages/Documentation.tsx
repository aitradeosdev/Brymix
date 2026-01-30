import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Key, Webhook, CheckCircle, AlertTriangle, Copy, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Documentation: React.FC = () => {
  const { state } = useAuth();
  const [showBaseUrl, setShowBaseUrl] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify password against user's actual password
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.accessToken}`
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setShowBaseUrl(true);
        setError('');
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Error verifying password');
    } finally {
      setLoading(false);
    }
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const CodeBlock: React.FC<{ children: string; language?: string }> = ({ children, language = 'bash' }) => (
    <div className="relative">
      <div className="glass p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-xs uppercase">{language}</span>
          <button
            onClick={() => copyToClipboard(children)}
            className="p-1 glass rounded hover:bg-white/20"
          >
            <Copy className="w-3 h-3 text-white/70" />
          </button>
        </div>
        <pre className="text-green-400 text-sm overflow-x-auto">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">API Documentation</h1>
        <p className="text-white/70">Complete integration guide for propfirm challenge validation</p>
      </motion.div>

      {/* Quick Start */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card"
      >
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
          <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
          Quick Start
        </h2>
        <div className="space-y-4">
          <div className="glass p-4 rounded-xl">
            <h3 className="text-white font-medium mb-2">1. Get Your API Credentials</h3>
            <p className="text-white/70 text-sm mb-3">Create an API key from your dashboard to get:</p>
            <ul className="text-white/60 text-sm space-y-1 ml-4">
              <li>• API Key (for authentication)</li>
              <li>• Webhook Secret (for signature verification)</li>
            </ul>
          </div>
          <div className="glass p-4 rounded-xl">
            <h3 className="text-white font-medium mb-2">2. Base URL</h3>
            {!showBaseUrl ? (
              <div className="space-y-3">
                <div className="glass bg-yellow-500/20 border-yellow-500/30 p-3 rounded-xl flex items-center">
                  <Lock className="w-4 h-4 text-yellow-400 mr-2" />
                  <span className="text-yellow-200 text-sm">Base URL is password protected</span>
                </div>
                <form onSubmit={handlePasswordSubmit} className="flex gap-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="glass-input flex-1 text-sm"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="glass-button bg-blue-500/20 hover:bg-blue-500/30 px-3 py-1 text-sm flex items-center disabled:opacity-50"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    {loading ? 'Verifying...' : 'Show'}
                  </button>
                </form>
                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <CodeBlock language="text">http://69.10.56.66:8000</CodeBlock>
                <button
                  onClick={() => setShowBaseUrl(false)}
                  className="glass-button bg-gray-500/20 hover:bg-gray-500/30 px-2 py-1 text-xs flex items-center"
                >
                  <EyeOff className="w-3 h-3 mr-1" />
                  Hide
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Authentication */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
      >
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
          <Key className="w-6 h-6 text-blue-400 mr-2" />
          Authentication
        </h2>
        <p className="text-white/70 mb-4">Include your API key in the request headers:</p>
        <CodeBlock language="http">
{`X-API-Key: your_api_key_here`}
        </CodeBlock>
      </motion.div>

      {/* Submit Challenge Check */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card"
      >
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
          <Code className="w-6 h-6 text-purple-400 mr-2" />
          Submit Challenge Check
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-white font-medium mb-2">Endpoint</h3>
            <CodeBlock language="http">
{`POST /api/v1/check`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Request Body</h3>
            <CodeBlock language="json">
{`{
  "user_id": "user_123",
  "challenge_id": "challenge_456", 
  "mt5_login": "12345678",
  "mt5_password": "password123",
  "mt5_server": "Broker-Server",
  "initial_balance": 100000.0,
  "rules": {
    "max_drawdown_percent": 10.0,
    "profit_target_percent": 10.0
  },
  "callback_url": "https://yourapp.com/webhook"
}`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Response</h3>
            <CodeBlock language="json">
{`{
  "job_id": "job_abc123def456",
  "status": "pending",
  "message": "Check queued successfully"
}`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">cURL Example</h3>
            <CodeBlock language="bash">
{`curl -X POST http://69.10.56.66:8000/api/v1/check \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{
    "user_id": "user_123",
    "challenge_id": "challenge_456",
    "mt5_login": "12345678", 
    "mt5_password": "password123",
    "mt5_server": "Broker-Server",
    "initial_balance": 100000.0,
    "rules": {
      "max_drawdown_percent": 10.0,
      "profit_target_percent": 10.0
    },
    "callback_url": "https://yourapp.com/webhook"
  }'`}
            </CodeBlock>
          </div>
        </div>
      </motion.div>

      {/* Check Job Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">Check Job Status</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-white font-medium mb-2">Endpoint</h3>
            <CodeBlock language="http">
{`GET /api/v1/job/{job_id}`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Response</h3>
            <CodeBlock language="json">
{`{
  "job_id": "job_abc123def456",
  "status": "completed",
  "created_at": "2026-01-29T10:30:00Z",
  "completed_at": "2026-01-29T10:31:15Z",
  "result": {
    "passed": false,
    "violations": [
      {
        "rule": "minimum_trade_duration",
        "message": "Trade held for less than 4 minutes",
        "details": {
          "ticket": "123456789",
          "symbol": "EURUSD",
          "duration_seconds": 180
        }
      }
    ]
  }
}`}
            </CodeBlock>
          </div>
        </div>
      </motion.div>

      {/* Webhook Integration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card"
      >
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
          <Webhook className="w-6 h-6 text-yellow-400 mr-2" />
          Webhook Integration
        </h2>
        
        <div className="space-y-6">
          <div>
            <p className="text-white/70 mb-4">
              When a challenge check completes, we'll send a POST request to your callback_url with the results.
            </p>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Webhook Payload</h3>
            <CodeBlock language="json">
{`{
  "job_id": "job_abc123def456",
  "status": "completed",
  "user_id": "user_123",
  "challenge_id": "challenge_456",
  "result": {
    "passed": true,
    "violations": [],
    "summary": {
      "total_trades": 25,
      "duration_violations": 0,
      "drawdown_violations": 0,
      "max_drawdown_reached": 5.2
    }
  },
  "completed_at": "2026-01-29T10:31:15Z"
}`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Signature Verification</h3>
            <p className="text-white/70 mb-3">
              All webhooks include an X-Signature header with HMAC-SHA256 signature:
            </p>
            <CodeBlock language="python">
{`import hmac
import hashlib

def verify_signature(payload: str, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload.encode(), 
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

# Usage
webhook_secret = "your_webhook_secret_here"
payload = request.body  # Raw request body
signature = request.headers.get("X-Signature")

if verify_signature(payload, signature, webhook_secret):
    # Process webhook
    pass
else:
    # Invalid signature
    return 401`}
            </CodeBlock>
          </div>
        </div>
      </motion.div>

      {/* Rules Checked */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">Rules Checked</h2>
        
        <div className="space-y-4">
          <div className="glass p-4 rounded-xl">
            <h3 className="text-white font-medium mb-2 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              Minimum Trade Duration
            </h3>
            <p className="text-white/70 text-sm">
              All positions must be held for at least 4 minutes (240 seconds). 
              Checks complete account history for violations.
            </p>
          </div>

          <div className="glass p-4 rounded-xl">
            <h3 className="text-white font-medium mb-2 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              Maximum Drawdown
            </h3>
            <p className="text-white/70 text-sm">
              Account equity must never breach the maximum drawdown threshold. 
              Analyzes 1-minute bars for floating P&L calculations.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Error Handling */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card"
      >
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
          <AlertTriangle className="w-6 h-6 text-red-400 mr-2" />
          Error Handling
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-white font-medium mb-2">HTTP Status Codes</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center glass p-3 rounded-lg">
                <span className="text-green-400 font-mono">200</span>
                <span className="text-white/70">Success</span>
              </div>
              <div className="flex justify-between items-center glass p-3 rounded-lg">
                <span className="text-yellow-400 font-mono">401</span>
                <span className="text-white/70">Invalid API Key</span>
              </div>
              <div className="flex justify-between items-center glass p-3 rounded-lg">
                <span className="text-red-400 font-mono">404</span>
                <span className="text-white/70">Job not found</span>
              </div>
              <div className="flex justify-between items-center glass p-3 rounded-lg">
                <span className="text-red-400 font-mono">500</span>
                <span className="text-white/70">Server error</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Error Response Format</h3>
            <CodeBlock language="json">
{`{
  "error": "Invalid API key",
  "code": "INVALID_API_KEY",
  "timestamp": "2026-01-29T10:30:00Z"
}`}
            </CodeBlock>
          </div>
        </div>
      </motion.div>

      {/* Rate Limits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-card"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">Rate Limits</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass p-4 rounded-xl">
            <h3 className="text-white font-medium mb-2">Challenge Checks</h3>
            <p className="text-white/70 text-sm">100 requests per hour</p>
          </div>
          <div className="glass p-4 rounded-xl">
            <h3 className="text-white font-medium mb-2">Status Queries</h3>
            <p className="text-white/70 text-sm">1000 requests per hour</p>
          </div>
        </div>
      </motion.div>

      {/* Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="glass-card"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">Support</h2>
        
        <div className="space-y-4">
          <p className="text-white/70">
            Need help integrating? Contact our support team:
          </p>
          <div className="glass p-4 rounded-xl">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60">Email:</span>
                <span className="text-white">support@brymix.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Response Time:</span>
                <span className="text-white">&lt; 24 hours</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Documentation;