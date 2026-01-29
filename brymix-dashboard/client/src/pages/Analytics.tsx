import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import ApiKeySelector from '../components/ApiKeySelector';
import axios from 'axios';

interface AnalyticsData {
  jobsOverTime: { date: string; count: number }[];
  statusDistribution: { [key: string]: number };
  successRate: number;
  averageProcessingTime: number;
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    jobsOverTime: [],
    statusDistribution: {},
    successRate: 0,
    averageProcessingTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const { state } = useAuth();
  const { selectedApiKey } = useApiKey();

  const API_URL = '/api';

  const fetchAnalytics = useCallback(async () => {
    if (!selectedApiKey) {
      setAnalytics({
        jobsOverTime: [],
        statusDistribution: {},
        successRate: 0,
        averageProcessingTime: 0
      });
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (selectedApiKey) {
        params.append('apiKeyId', selectedApiKey.id); // Use the full API key ID
      }
      
      const response = await axios.get(`${API_URL}/dashboard/analytics?${params}`, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL, state.accessToken, period, selectedApiKey]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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
          <p className="text-white/70 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-white/70">
            {selectedApiKey ? `Data for: ${selectedApiKey.name}` : 'Select an API key to view analytics'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <ApiKeySelector />
          <div className="flex space-x-2">
            {['1d', '7d', '30d', '90d'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`glass-button px-4 py-2 ${
                  period === p ? 'bg-blue-500/30' : 'hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-white">{analytics.successRate}%</p>
            </div>
            <div className="p-3 glass rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-400" />
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
              <p className="text-white/70 text-sm">Avg Processing Time</p>
              <p className="text-2xl font-bold text-white">{analytics.averageProcessingTime}s</p>
            </div>
            <div className="p-3 glass rounded-xl">
              <Clock className="w-6 h-6 text-blue-400" />
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
              <p className="text-white/70 text-sm">Total Jobs</p>
              <p className="text-2xl font-bold text-white">
                {Object.values(analytics.statusDistribution).reduce((a, b) => a + b, 0)}
              </p>
            </div>
            <div className="p-3 glass rounded-xl">
              <Activity className="w-6 h-6 text-purple-400" />
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
              <p className="text-white/70 text-sm">Completed Jobs</p>
              <p className="text-2xl font-bold text-white">
                {analytics.statusDistribution.completed || 0}
              </p>
            </div>
            <div className="p-3 glass rounded-xl">
              <BarChart3 className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Status Distribution</h3>
        {Object.keys(analytics.statusDistribution).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(analytics.statusDistribution).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'completed' ? 'bg-green-400' :
                    status === 'failed' ? 'bg-red-400' :
                    status === 'processing' ? 'bg-blue-400' : 'bg-yellow-400'
                  }`}></div>
                  <span className="text-white capitalize">{status}</span>
                </div>
                <span className="text-white font-medium">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No data available</p>
            <p className="text-white/40 text-sm">Process some challenges to see analytics</p>
          </div>
        )}
      </motion.div>

      {/* Jobs Over Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Jobs Over Time</h3>
        {analytics.jobsOverTime.length > 0 ? (
          <div className="space-y-2">
            {analytics.jobsOverTime.map((item, index) => (
              <div key={item.date} className="flex items-center justify-between p-3 glass rounded-lg">
                <span className="text-white/70">{new Date(item.date).toLocaleDateString()}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-white/20 rounded-full h-2">
                    <div 
                      className="h-2 bg-blue-400 rounded-full"
                      style={{ 
                        width: `${(item.count / Math.max(...analytics.jobsOverTime.map(j => j.count))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-white font-medium w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No timeline data</p>
            <p className="text-white/40 text-sm">Job timeline will appear as you process challenges</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Analytics;