const app = require('../server/index.js');

export default async function handler(req, res) {
  try {
    // Debug the incoming request
    console.log('Raw Vercel Request:', {
      method: req.method,
      url: req.url,
      query: req.query,
      slug: req.query.slug
    });
    
    // Reconstruct the full API path from the original URL
    // Vercel passes the full path in req.url, we just need to use it
    const originalUrl = req.url;
    
    // Set proper headers for CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    console.log('Processing request for:', originalUrl);
    
    // Call Express app with proper async handling
    return new Promise((resolve, reject) => {
      app(req, res, (err) => {
        if (err) {
          console.error('Express app error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Vercel API Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}