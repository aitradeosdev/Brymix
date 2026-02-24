import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import { useNavigate } from 'react-router-dom';
import ApiKeySelector from '../components/ApiKeySelector';
import axios from 'axios';

interface Job {
  id: string;
  user_id: string;
  challenge_id: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const JobsHistory: React.FC = () => {
  const { state } = useAuth();
  const { selectedApiKey } = useApiKey();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = '/api';

  const fetchJobs = useCallback(async (page: number = 1) => {
    if (!selectedApiKey) {
      setJobs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        apiKeyId: selectedApiKey.id
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await axios.get(`${API_URL}/dashboard/jobs?${params}`, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });

      setJobs(response.data.jobs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL, state.accessToken, selectedApiKey, statusFilter, searchTerm, pagination.limit]);

  useEffect(() => {
    fetchJobs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApiKey, statusFilter]);

  const handleSearch = () => {
    fetchJobs(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchJobs(newPage);
  };

  const viewJobDetails = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'processing':
        return <Zap className="w-5 h-5 text-blue-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Jobs History</h1>
          <p className="text-white/70">View and manage all challenge validation jobs</p>
        </div>
        <ApiKeySelector />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search by Job ID, User ID, or Challenge ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 glass rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-white/40" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            className="glass-button px-6 py-3 hover:bg-white/15"
          >
            Search
          </button>
        </div>
      </motion.div>

      {/* Jobs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-dots text-white">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        ) : jobs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-white/70 font-medium">Status</th>
                    <th className="text-left py-4 px-4 text-white/70 font-medium">Job ID</th>
                    <th className="text-left py-4 px-4 text-white/70 font-medium">Challenge ID</th>
                    <th className="text-left py-4 px-4 text-white/70 font-medium">User ID</th>
                    <th className="text-left py-4 px-4 text-white/70 font-medium">Created</th>
                    <th className="text-left py-4 px-4 text-white/70 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, index) => (
                    <motion.tr
                      key={job.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(job.status)}
                          <span className={getStatusClass(job.status)}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white font-mono text-sm">{job.id}</td>
                      <td className="py-4 px-4 text-white">{job.challenge_id}</td>
                      <td className="py-4 px-4 text-white">{job.user_id}</td>
                      <td className="py-4 px-4 text-white/70">
                        {new Date(job.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => viewJobDetails(job.id)}
                          className="glass-button px-3 py-2 hover:bg-white/15 flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
              <div className="text-white/70">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} jobs
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="glass-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/15"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-white px-4">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="glass-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/15"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/60 text-lg">No jobs found</p>
            <p className="text-white/40 text-sm mt-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Jobs will appear here once you start processing challenges'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default JobsHistory;
