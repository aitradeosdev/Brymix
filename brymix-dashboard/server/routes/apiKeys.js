const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const axios = require('axios');

const router = express.Router();
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// Get user's API keys
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;
    
    console.log('Fetching API keys for user:', user.email);
    
    // Get full details from FastAPI backend
    try {
      const backendResponse = await axios.get(`${FASTAPI_URL}/api/v1/dashboard/keys/${user.email}`);
      
      console.log('FastAPI response:', backendResponse.data);
      
      res.json({
        keys: backendResponse.data.keys.map(key => ({
          id: key.id, // Full key from FastAPI
          name: key.name,
          maskedKey: `${key.id.slice(0, 8)}...${key.id.slice(-4)}`,
          createdAt: key.created_at,
          company: key.company,
          webhook_secret: key.webhook_secret
        }))
      });
    } catch (backendError) {
      console.error('FastAPI backend error:', backendError.message);
      // Fallback to MongoDB data
      res.json({
        keys: user.apiKeys.filter(key => key.isActive).map(key => ({
          id: key.keyId,
          name: key.name,
          maskedKey: `${key.keyId.slice(0, 8)}...${key.keyId.slice(-4)}`,
          createdAt: key.createdAt,
          lastUsed: key.lastUsed,
          webhook_secret: null // Not available in MongoDB
        }))
      });
    }
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new API key
router.post('/create', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const user = req.user;

    console.log('Creating API key for user:', user.email, 'with name:', name);

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'API key name is required' });
    }

    console.log('Calling FastAPI backend at:', FASTAPI_URL);
    
    // Create API key in FastAPI backend
    const backendResponse = await axios.post(`${FASTAPI_URL}/api/v1/dashboard/create-key`, {
      email: user.email,
      company: user.company,
      name: name.trim()
    }, {
      timeout: 10000 // 10 second timeout
    });

    console.log('FastAPI response:', backendResponse.data);

    const apiKey = backendResponse.data.api_key;
    
    // Save to MongoDB
    const newApiKey = {
      keyId: apiKey,
      name: name.trim(),
      createdAt: new Date(),
      isActive: true
    };

    user.apiKeys.push(newApiKey);
    await user.save();

    console.log('API key saved to MongoDB');

    res.json({
      message: 'API key created successfully',
      apiKey: {
        id: apiKey,
        webhook_secret: backendResponse.data.webhook_secret,
        name: newApiKey.name,
        createdAt: newApiKey.createdAt
      }
    });
  } catch (error) {
    console.error('Create API key error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Backend service unavailable' });
    }
    res.status(500).json({ error: error.response?.data?.detail || error.message || 'Server error' });
  }
});

// Delete API key
router.delete('/:keyId', auth, async (req, res) => {
  try {
    const { keyId } = req.params;
    const user = req.user;

    const keyIndex = user.apiKeys.findIndex(key => key.keyId === keyId && key.isActive);
    
    if (keyIndex === -1) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Delete from FastAPI backend
    await axios.delete(`${FASTAPI_URL}/api/v1/dashboard/delete-key`, {
      data: {
        api_key: keyId,
        owner_email: user.email
      }
    });

    // Delete from MongoDB
    user.apiKeys[keyIndex].isActive = false;
    await user.save();

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: error.response?.data?.detail || 'Server error' });
  }
});

module.exports = router;