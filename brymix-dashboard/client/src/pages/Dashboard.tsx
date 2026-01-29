import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Key,
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import ApiKeySelector from '../components/ApiKeySelector';
import axios from 'axios';

interface DashboardStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  processingJobs: number;
  totalApiKeys: number;
  recentJobs: any[];
}

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const { selectedApiKey } = useApiKey();
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    pendingJobs: 0,
    processingJobs: 0,
    totalApiKeys: 0,
    recentJobs: []
  });
  const [loading, setLoading] = useState(true);

  const API_URL = '/api';

  const fetchDashboardData = useCallback(async () => {
    if (!selectedApiKey) {
      setStats({
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        pendingJobs: 0,
        processingJobs: 0,
        totalApiKeys: 0,
        recentJobs: []
      });
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (selectedApiKey) {
        params.append('apiKeyId', selectedApiKey.id); // Use the full API key ID
      }
      
      const response = await axios.get(`${API_URL}/dashboard/overview?${params}`, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL, state.accessToken, selectedApiKey]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'processing':
        return <Zap className="w-4 h-4 text-blue-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-failed';
      case 'processing':
        return 'status-processing';
      default:
        return 'status-pending';
    }
  };

  const successRate = stats.totalJobs > 0 
    ? ((stats.completedJobs / (stats.completedJobs + stats.failedJobs)) * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass-card p-8">
          <div className="loading-dots text-white">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="text-white/70 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with API Key Selector */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {state.user?.name}
          </h1>
          <p className="text-white/70">
            {state.user?.company} • Challenge Validation Dashboard
          </p>
        </div>
        <ApiKeySelector />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Total Jobs</p>
              <p className="text-2xl font-bold text-white">{stats.totalJobs}</p>
            </div>
            <div className="p-3 glass rounded-xl">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-white">{successRate}%</p>
            </div>
            <div className="p-3 glass rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">API Keys</p>
              <p className="text-2xl font-bold text-white">{stats.totalApiKeys}</p>
            </div>
            <div className="p-3 glass rounded-xl">
              <Key className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Processing</p>
              <p className="text-2xl font-bold text-white">{stats.processingJobs + stats.pendingJobs}</p>
            </div>
            <div className="p-3 glass rounded-xl">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Job Status Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white">Completed</span>
              </div>
              <span className="text-white font-medium">{stats.completedJobs}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-white">Failed</span>
              </div>
              <span className="text-white font-medium">{stats.failedJobs}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-blue-400" />
                <span className="text-white">Processing</span>
              </div>
              <span className="text-white font-medium">{stats.processingJobs}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-white">Pending</span>
              </div>
              <span className="text-white font-medium">{stats.pendingJobs}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="glass-button w-full text-left flex items-center space-x-3 hover:bg-white/15">
              <Key className="w-5 h-5 text-blue-400" />
              <span className="text-white">Manage API Keys</span>
            </button>
            <button className="glass-button w-full text-left flex items-center space-x-3 hover:bg-white/15">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <span className="text-white">View Analytics</span>
            </button>
            <button className="glass-button w-full text-left flex items-center space-x-3 hover:bg-white/15">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-white">Account Settings</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Recent Jobs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Recent Jobs</h3>
        {stats.recentJobs.length > 0 ? (
          <div className="space-y-4">
            {stats.recentJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="glass p-4 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(job.status)}
                  <div>
                    <p className="text-white font-medium">{job.challenge_id}</p>
                    <p className="text-white/60 text-sm">User: {job.user_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={getStatusClass(job.status)}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                  <p className="text-white/60 text-sm mt-1">
                    {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No jobs yet</p>
            <p className="text-white/40 text-sm">Jobs will appear here once you start processing challenges</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;