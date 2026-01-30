const app = require('../server/index.js');

// Export the Express app as a Vercel serverless function
module.exports = (req, res) => {
  return app(req, res);
};