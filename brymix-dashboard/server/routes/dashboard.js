const express = require('express');
const axios = require('axios');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// Get dashboard overview
router.get('/overview', auth, async (req, res) => {
  try {
    const { apiKeyId } = req.query;
    const user = await User.findById(req.user._id);
    const activeApiKeys = user.apiKeys.filter(key => key.isActive);
    
    if (activeApiKeys.length === 0) {
      return res.json({
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        pendingJobs: 0,
        processingJobs: 0,
        totalApiKeys: 0,
        recentJobs: []
      });
    }

    // Filter to specific API key if provided
    const keysToQuery = apiKeyId 
      ? activeApiKeys.filter(key => key._id.toString() === apiKeyId || key.keyId === apiKeyId)
      : activeApiKeys;

    if (keysToQuery.length === 0) {
      return res.status(404).json({ error: 'API key not found or inactive' });
    }

    // Get jobs for selected API key(s)
    let allJobs = [];
    for (const apiKey of keysToQuery) {
      try {
        const response = await axios.get(`${FASTAPI_URL}/api/v1/jobs?limit=100`, {
          headers: { 'X-API-Key': apiKey.keyId }
        });
        allJobs = [...allJobs, ...response.data.jobs];
      } catch (error) {
        console.error(`Error fetching jobs for key ${apiKey.name}:`, error.message);
      }
    }

    // Sort by creation date (newest first)
    allJobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const stats = {
      totalJobs: allJobs.length,
      completedJobs: allJobs.filter(job => job.status === 'completed').length,
      failedJobs: allJobs.filter(job => job.status === 'failed').length,
      pendingJobs: allJobs.filter(job => job.status === 'pending').length,
      processingJobs: allJobs.filter(job => job.status === 'processing').length,
      totalApiKeys: activeApiKeys.length,
      recentJobs: allJobs.slice(0, 10) // Last 10 jobs
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// Get job details
router.get('/jobs/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const user = await User.findById(req.user._id);
    const activeApiKeys = user.apiKeys.filter(key => key.isActive);
    
    // Try to find the job with any of the user's API keys
    for (const apiKey of activeApiKeys) {
      try {
        const response = await axios.get(`${FASTAPI_URL}/api/v1/job/${jobId}`, {
          headers: { 'X-API-Key': apiKey.keyId }
        });
        
        return res.json(response.data);
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error(`Error fetching job ${jobId} with key ${apiKey.name}:`, error.message);
        }
      }
    }

    res.status(404).json({ error: 'Job not found' });
  } catch (error) {
    console.error('Get job details error:', error);
    res.status(500).json({ error: 'Failed to fetch job details' });
  }
});

// Get jobs with pagination and filtering
router.get('/jobs', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, apiKeyId } = req.query;
    const user = await User.findById(req.user._id);
    const activeApiKeys = user.apiKeys.filter(key => key.isActive);
    
    if (activeApiKeys.length === 0) {
      return res.json({
        jobs: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      });
    }

    // Filter to specific API key if provided
    const keysToQuery = apiKeyId 
      ? activeApiKeys.filter(key => key._id.toString() === apiKeyId || key.keyId === apiKeyId)
      : activeApiKeys;

    if (keysToQuery.length === 0) {
      return res.status(404).json({ error: 'API key not found or inactive' });
    }

    // Get jobs for selected API key(s)
    let allJobs = [];
    for (const apiKey of keysToQuery) {
      try {
        const response = await axios.get(`${FASTAPI_URL}/api/v1/jobs?limit=1000`, {
          headers: { 'X-API-Key': apiKey.keyId }
        });
        allJobs = [...allJobs, ...response.data.jobs];
      } catch (error) {
        console.error(`Error fetching jobs for key ${apiKey.name}:`, error.message);
      }
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      allJobs = allJobs.filter(job => job.status === status);
    }

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allJobs = allJobs.filter(job => 
        job.user_id.toLowerCase().includes(searchLower) ||
        job.challenge_id.toLowerCase().includes(searchLower) ||
        job.id.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    allJobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedJobs = allJobs.slice(startIndex, endIndex);

    res.json({
      jobs: paginatedJobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allJobs.length,
        pages: Math.ceil(allJobs.length / limit)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get analytics data
router.get('/analytics', auth, async (req, res) => {
  try {
    const { period = '7d', apiKeyId } = req.query;
    const user = await User.findById(req.user._id);
    const activeApiKeys = user.apiKeys.filter(key => key.isActive);
    
    if (activeApiKeys.length === 0) {
      return res.json({
        jobsOverTime: [],
        statusDistribution: {},
        successRate: 0,
        averageProcessingTime: 0
      });
    }

    // Filter to specific API key if provided
    const keysToQuery = apiKeyId 
      ? activeApiKeys.filter(key => key._id.toString() === apiKeyId || key.keyId === apiKeyId)
      : activeApiKeys;

    if (keysToQuery.length === 0) {
      return res.status(404).json({ error: 'API key not found or inactive' });
    }

    // Get jobs for selected API key(s)
    let allJobs = [];
    for (const apiKey of keysToQuery) {
      try {
        const response = await axios.get(`${FASTAPI_URL}/api/v1/jobs?limit=1000`, {
          headers: { 'X-API-Key': apiKey.keyId }
        });
        allJobs = [...allJobs, ...response.data.jobs];
      } catch (error) {
        console.error(`Error fetching jobs for key ${apiKey.name}:`, error.message);
      }
    }

    // Filter by period
    const now = new Date();
    const periodMs = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    
    const cutoffDate = new Date(now.getTime() - (periodMs[period] || periodMs['7d']));
    const filteredJobs = allJobs.filter(job => new Date(job.created_at) >= cutoffDate);

    // Jobs over time (daily buckets)
    const jobsOverTime = {};
    filteredJobs.forEach(job => {
      const date = new Date(job.created_at).toISOString().split('T')[0];
      jobsOverTime[date] = (jobsOverTime[date] || 0) + 1;
    });

    // Status distribution
    const statusDistribution = {};
    filteredJobs.forEach(job => {
      statusDistribution[job.status] = (statusDistribution[job.status] || 0) + 1;
    });

    // Success rate
    const completedJobs = filteredJobs.filter(job => job.status === 'completed').length;
    const totalFinishedJobs = filteredJobs.filter(job => 
      job.status === 'completed' || job.status === 'failed'
    ).length;
    const successRate = totalFinishedJobs > 0 ? (completedJobs / totalFinishedJobs) * 100 : 0;

    // Average processing time
    const jobsWithTimes = filteredJobs.filter(job => job.completed_at && job.created_at);
    const averageProcessingTime = jobsWithTimes.length > 0 
      ? jobsWithTimes.reduce((sum, job) => {
          const processingTime = new Date(job.completed_at) - new Date(job.created_at);
          return sum + processingTime;
        }, 0) / jobsWithTimes.length / 1000 // Convert to seconds
      : 0;

    res.json({
      jobsOverTime: Object.entries(jobsOverTime).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date)),
      statusDistribution,
      successRate: Math.round(successRate * 100) / 100,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Test FastAPI connection
router.get('/test-connection', auth, async (req, res) => {
  try {
    const response = await axios.get(`${FASTAPI_URL}/health`);
    res.json({
      status: 'connected',
      fastapi: response.data
    });
  } catch (error) {
    console.error('FastAPI connection test failed:', error.message);
    res.status(503).json({
      status: 'disconnected',
      error: 'Cannot connect to FastAPI backend'
    });
  }
});

module.exports = router;