const app = require('../../server/index.js');

export default async function handler(req, res) {
  try {
    // Reconstruct the full API path
    const path = req.query.slug ? req.query.slug.join('/') : '';
    req.url = `/api/${path}`;
    
    // Set proper headers for CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Debug logging
    console.log('Vercel API Request:', {
      method: req.method,
      originalUrl: req.url,
      slug: req.query.slug,
      path: path,
      body: req.body
    });
    
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