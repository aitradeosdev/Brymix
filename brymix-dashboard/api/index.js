// Simple test to see if Vercel API is working
export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.json({ message: 'API is working', method: req.method, url: req.url });
  }
  
  if (req.method === 'POST' && req.url === '/api/auth/register') {
    return res.json({ message: 'Register endpoint reached', body: req.body });
  }
  
  // Try to use the Express app
  const app = require('../server/index.js');
  return app(req, res);
}