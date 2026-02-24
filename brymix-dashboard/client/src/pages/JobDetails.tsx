import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Hash
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface JobDetailsData {
  job_id: string;
  user_id: string;
  challenge_id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  result?: {
    status: string;
    metrics: {
      initial_balance: number;
      current_balance: number;
      current_equity: number;
      profit_percent: number;
      profit_target_percent: number;
      profit_target_met: boolean;
      max_drawdown_percent: number;
      max_drawdown_limit: number;
      total_trades: number;
      trades_under_4min: number;
    };
    violations: Array<{
      rule: string;
      description: string;
      [key: string]: any;
    }>;
  };
}

const JobDetails: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [job, setJob] = useState<JobDetailsData | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = '/api';

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/dashboard/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${state.accessToken}` }
        });
        setJob(response.data);
      } catch (error) {
        console.error('Failed to fetch job details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId, API_URL, state.accessToken]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      case 'failed':
        return <XCircle className="w-8 h-8 text-red-400" />;
      case 'processing':
        return <Zap className="w-8 h-8 text-blue-400" />;
      default:
        return <Clock className="w-8 h-8 text-yellow-400" />;
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
          <p className="text-white/70 mt-4">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Job Not Found</h2>
        <p className="text-white/60 mb-6">The requested job could not be found.</p>
        <button
          onClick={() => navigate('/jobs')}
          className="glass-button px-6 py-3 hover:bg-white/15"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  const metrics = job.result?.metrics;
  const violations = job.result?.violations || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => navigate('/jobs')}
          className="glass-button px-4 py-2 mb-4 hover:bg-white/15 flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Job Details</h1>
            <p className="text-white/70">Challenge validation results</p>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusIcon(job.status)}
            <span className={`${getStatusClass(job.status)} text-lg`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Job Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card"
      >
        <h3 className="text-xl font-semibold text-white mb-4">Job Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Hash className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-white/60 text-sm">Job ID</p>
              <p className="text-white font-mono">{job.job_id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-white/60 text-sm">User ID</p>
              <p className="text-white">{job.user_id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Hash className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-white/60 text-sm">Challenge ID</p>
              <p className="text-white">{job.challenge_id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-white/60 text-sm">Created</p>
              <p className="text-white">{new Date(job.created_at).toLocaleString()}</p>
            </div>
          </div>
          {job.completed_at && (
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-white/60 text-sm">Completed</p>
                <p className="text-white">{new Date(job.completed_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Metrics */}
      {metrics && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="glass-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/70 text-sm">Initial Balance</p>
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">${metrics.initial_balance.toLocaleString()}</p>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/70 text-sm">Current Balance</p>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">${metrics.current_balance.toLocaleString()}</p>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/70 text-sm">Profit</p>
                {metrics.profit_percent >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
              <p className={`text-2xl font-bold ${metrics.profit_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.profit_percent >= 0 ? '+' : ''}{metrics.profit_percent.toFixed(2)}%
              </p>
              <p className="text-white/60 text-sm mt-1">
                Target: {metrics.profit_target_percent}%
              </p>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/70 text-sm">Max Drawdown</p>
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <p className={`text-2xl font-bold ${metrics.max_drawdown_percent > metrics.max_drawdown_limit ? 'text-red-400' : 'text-white'}`}>
                {metrics.max_drawdown_percent.toFixed(2)}%
              </p>
              <p className="text-white/60 text-sm mt-1">
                Limit: {metrics.max_drawdown_limit}%
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Trading Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-white/60 text-sm">Total Trades</p>
                <p className="text-2xl font-bold text-white">{metrics.total_trades}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Trades &lt; 4min</p>
                <p className={`text-2xl font-bold ${metrics.trades_under_4min > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {metrics.trades_under_4min}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Profit Target</p>
                <p className={`text-2xl font-bold ${metrics.profit_target_met ? 'text-green-400' : 'text-red-400'}`}>
                  {metrics.profit_target_met ? 'Met' : 'Not Met'}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Current Equity</p>
                <p className="text-2xl font-bold text-white">${metrics.current_equity.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Violations */}
      {violations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card"
        >
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-semibold text-white">Violations Detected</h3>
          </div>
          <div className="space-y-4">
            {violations.map((violation, index) => (
              <div key={index} className="glass p-4 rounded-xl border-l-4 border-red-400">
                <p className="text-red-400 font-semibold mb-2">{violation.rule}</p>
                <p className="text-white/80">{violation.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Challenge Result */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`glass-card border-l-4 ${job.result?.status === 'passed' ? 'border-green-400' : 'border-red-400'}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Challenge Result</h3>
            <p className="text-white/70">
              {job.result?.status === 'passed' 
                ? 'Congratulations! The challenge has been passed.' 
                : 'The challenge was not passed due to rule violations.'}
            </p>
          </div>
          <div className={`text-4xl font-bold ${job.result?.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>
            {job.result?.status === 'passed' ? 'PASSED' : 'FAILED'}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default JobDetails;
