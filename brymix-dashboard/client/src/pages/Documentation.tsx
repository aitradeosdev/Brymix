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
          Integration Overview
        </h2>
        <div className="space-y-4">
          <p className="text-white/70">Brymix provides automated propfirm challenge validation through a simple REST API. Here's how it works:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass p-4 rounded-xl">
              <div className="text-2xl font-bold text-blue-400 mb-2">1</div>
              <h3 className="text-white font-medium mb-2">Submit Challenge</h3>
              <p className="text-white/60 text-sm">Send MT5 credentials and challenge rules to our API</p>
            </div>
            <div className="glass p-4 rounded-xl">
              <div className="text-2xl font-bold text-purple-400 mb-2">2</div>
              <h3 className="text-white font-medium mb-2">We Validate</h3>
              <p className="text-white/60 text-sm">Our system checks trade duration, drawdown, and profit targets</p>
            </div>
            <div className="glass p-4 rounded-xl">
              <div className="text-2xl font-bold text-green-400 mb-2">3</div>
              <h3 className="text-white font-medium mb-2">Get Results</h3>
              <p className="text-white/60 text-sm">Receive webhook callback with pass/fail status and violations</p>
            </div>
          </div>

          <div className="glass p-4 rounded-xl bg-blue-500/10 border-blue-500/30">
            <h3 className="text-white font-medium mb-2">Setup Steps</h3>
            <ol className="text-white/70 text-sm space-y-2 ml-4">
              <li>1. Register an account on the dashboard</li>
              <li>2. Create an API key from the API Keys page</li>
              <li>3. Save your API Key and Webhook Secret securely</li>
              <li>4. Implement the API endpoints in your propfirm platform</li>
              <li>5. Set up webhook endpoint to receive results</li>
            </ol>
          </div>
        </div>
      </motion.div>

      {/* Base URL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">Base URL</h2>
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
          <div className="glass p-4 rounded-xl bg-purple-500/10 border-purple-500/30">
            <h3 className="text-white font-medium mb-2">When to Use</h3>
            <p className="text-white/70 text-sm mb-3">Call this endpoint when:</p>
            <ul className="text-white/60 text-sm space-y-1 ml-4">
              <li>• A trader completes their challenge period</li>
              <li>• You need to validate if challenge rules were followed</li>
              <li>• Before issuing a funded account</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Endpoint</h3>
            <CodeBlock language="http">
{`POST /api/v1/check`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Request Headers</h3>
            <CodeBlock language="http">
{`Content-Type: application/json
X-API-Key: your_api_key_here`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Request Body Parameters</h3>
            <div className="glass p-4 rounded-xl space-y-3">
              <div>
                <p className="text-white font-mono text-sm">user_id <span className="text-red-400">*</span></p>
                <p className="text-white/60 text-xs">Your internal user/trader identifier</p>
              </div>
              <div>
                <p className="text-white font-mono text-sm">challenge_id <span className="text-red-400">*</span></p>
                <p className="text-white/60 text-xs">Your internal challenge identifier</p>
              </div>
              <div>
                <p className="text-white font-mono text-sm">mt5_login <span className="text-red-400">*</span></p>
                <p className="text-white/60 text-xs">MT5 account login number</p>
              </div>
              <div>
                <p className="text-white font-mono text-sm">mt5_password <span className="text-red-400">*</span></p>
                <p className="text-white/60 text-xs">MT5 account password (investor password works)</p>
              </div>
              <div>
                <p className="text-white font-mono text-sm">mt5_server <span className="text-red-400">*</span></p>
                <p className="text-white/60 text-xs">MT5 broker server name (e.g., "Broker-Live")</p>
              </div>
              <div>
                <p className="text-white font-mono text-sm">initial_balance <span className="text-red-400">*</span></p>
                <p className="text-white/60 text-xs">Starting balance of the challenge account</p>
              </div>
              <div>
                <p className="text-white font-mono text-sm">rules.max_drawdown_percent <span className="text-red-400">*</span></p>
                <p className="text-white/60 text-xs">Maximum allowed drawdown (e.g., 10.0 for 10%)</p>
              </div>
              <div>
                <p className="text-white font-mono text-sm">rules.profit_target_percent <span className="text-red-400">*</span></p>
                <p className="text-white/60 text-xs">Required profit target (e.g., 10.0 for 10%)</p>
              </div>
              <div>
                <p className="text-white font-mono text-sm">callback_url <span className="text-red-400">*</span></p>
                <p className="text-white/60 text-xs">Your webhook URL to receive results</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Request Example</h3>
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
            <p className="text-white/60 text-sm mt-2">Save the job_id to query status or wait for webhook callback</p>
          </div>

          <div className="glass p-4 rounded-xl bg-yellow-500/10 border-yellow-500/30">
            <h3 className="text-white font-medium mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mr-2" />
              Important Notes
            </h3>
            <ul className="text-white/60 text-sm space-y-2 ml-4">
              <li>• Processing typically takes 5-30 seconds depending on trade history size</li>
              <li>• MT5 credentials are never stored, only used for validation</li>
              <li>• Investor (read-only) passwords are recommended for security</li>
              <li>• Ensure MT5 account has complete trade history available</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">cURL Example</h3>
            <CodeBlock language="bash">
{showBaseUrl ? `curl -X POST http://69.10.56.66:8000/api/v1/check \\
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
  }'` : `curl -X POST http://example.com/api/v1/check \\
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
          Webhook Integration (Recommended)
        </h2>
        
        <div className="space-y-6">
          <div className="glass p-4 rounded-xl bg-green-500/10 border-green-500/30">
            <h3 className="text-white font-medium mb-2">Why Use Webhooks?</h3>
            <ul className="text-white/60 text-sm space-y-1 ml-4">
              <li>• Real-time notifications when validation completes</li>
              <li>• No need to poll the status endpoint repeatedly</li>
              <li>• Automatic retry on delivery failure</li>
              <li>• Secure HMAC signature verification</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Setting Up Your Webhook Endpoint</h3>
            <p className="text-white/70 text-sm mb-3">Your webhook endpoint should:</p>
            <ol className="text-white/60 text-sm space-y-2 ml-4">
              <li>1. Accept POST requests with JSON body</li>
              <li>2. Verify the X-Signature header (see below)</li>
              <li>3. Return 200 status code within 5 seconds</li>
              <li>4. Process the result asynchronously if needed</li>
            </ol>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Webhook Headers</h3>
            <CodeBlock language="http">
{`Content-Type: application/json
X-Signature: hmac_sha256_signature_here
User-Agent: Brymix-Webhook/1.0`}
            </CodeBlock>
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