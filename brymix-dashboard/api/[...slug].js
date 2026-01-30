const app = require('../../server/index.js');

export default function handler(req, res) {
  // Set the original URL for Express routing
  req.url = `/api/${req.query.slug.join('/')}`;
  
  // Let Express handle the request
  return app(req, res);
}