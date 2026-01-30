const app = require('../../server/index.js');

export default async function handler(req, res) {
  try {
    // Reconstruct the full API path
    const path = req.query.slug ? req.query.slug.join('/') : '';
    req.url = `/api/${path}`;
    
    // Debug logging
    console.log('Vercel API Request:', {
      method: req.method,
      originalUrl: req.url,
      slug: req.query.slug,
      path: path
    });
    
    // Call Express app
    return app(req, res);
  } catch (error) {
    console.error('Vercel API Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}