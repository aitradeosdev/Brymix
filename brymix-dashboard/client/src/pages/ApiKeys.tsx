import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Plus, Trash2, Copy, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import axios from 'axios';

const ApiKeys: React.FC = () => {
  const { apiKeys, loading, refreshApiKeys } = useApiKey();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<{id: string, webhook_secret: string} | null>(null);
  const [error, setError] = useState('');
  const { state } = useAuth();

  const API_URL = '/api';

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('API key name is required');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/keys/create`, 
        { name: newKeyName.trim() },
        { headers: { Authorization: `Bearer ${state.accessToken}` } }
      );
      
      setCreatedKey({
        id: response.data.apiKey.id,
        webhook_secret: response.data.apiKey.webhook_secret
      });
      setNewKeyName('');
      setError('');
      await refreshApiKeys(); // Refresh the context
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create API key');
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/keys/${keyId}`, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      await refreshApiKeys(); // Refresh the context
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
          <p className="text-white/70 mt-4">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">API Keys</h1>
        <p className="text-white/70">Manage your API keys for accessing the Brymix Challenge Checker</p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass bg-red-500/20 border-red-500/30 rounded-xl p-4 flex items-center space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-200 text-sm">{error}</span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Your API Keys</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="glass-button bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Key</span>
          </button>
        </div>

        {apiKeys.length > 0 ? (
          <div className="space-y-4">
            {apiKeys.map((key, index) => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="glass p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setSelectedKey(key)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 glass rounded-lg">
                      <Key className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{key.name}</h3>
                      <p className="text-white/60 text-sm font-mono">{key.maskedKey}</p>
                      <p className="text-white/40 text-xs">
                        Created: {new Date(key.createdAt).toLocaleDateString()}
                        {key.lastUsed && ` • Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteApiKey(key.id);
                      }}
                      className="p-2 glass rounded-lg hover:bg-red-500/20 transition-colors"
                      title="Delete API Key"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Key className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No API keys yet</p>
            <p className="text-white/40 text-sm">Create your first API key to start using the Brymix API</p>
          </div>
        )}
      </motion.div>

      {/* API Key Details Modal */}
      {selectedKey && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">{selectedKey.name}</h3>
              <button
                onClick={() => setSelectedKey(null)}
                className="p-2 glass rounded-lg hover:bg-white/20"
              >
                <span className="text-white/70 text-xl">×</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="glass p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-white/80 text-sm font-medium">API Key</label>
                  <button
                    onClick={() => copyToClipboard(selectedKey.id)}
                    className="p-2 glass rounded-lg hover:bg-white/20"
                    title="Copy API Key"
                  >
                    <Copy className="w-4 h-4 text-white/70" />
                  </button>
                </div>
                <code className="text-green-400 text-sm break-all block">{selectedKey.id}</code>
              </div>
              
              <div className="glass p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-white/80 text-sm font-medium">Webhook Secret</label>
                  <button
                    onClick={() => copyToClipboard(selectedKey.webhook_secret || 'Not available')}
                    className="p-2 glass rounded-lg hover:bg-white/20"
                    title="Copy Webhook Secret"
                  >
                    <Copy className="w-4 h-4 text-white/70" />
                  </button>
                </div>
                <code className="text-blue-400 text-sm break-all block">
                  {selectedKey.webhook_secret || 'Not available'}
                </code>
              </div>
              
              <div className="glass p-4 rounded-xl">
                <h4 className="text-white font-medium mb-2">Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Company:</span>
                    <span className="text-white">{selectedKey.company || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Created:</span>
                    <span className="text-white">{new Date(selectedKey.createdAt).toLocaleDateString()}</span>
                  </div>
                  {selectedKey.lastUsed && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Last Used:</span>
                      <span className="text-white">{new Date(selectedKey.lastUsed).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-md"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Create New API Key</h3>
            
            {createdKey ? (
              <div>
                <p className="text-white/70 mb-4">Your new API key has been created. Copy both values now - you won't be able to see them again!</p>
                <div className="space-y-4 mb-4">
                  <div className="glass p-4 rounded-xl">
                    <label className="block text-white/80 text-sm font-medium mb-2">API Key</label>
                    <div className="flex items-center justify-between">
                      <code className="text-green-400 text-sm break-all">{createdKey.id}</code>
                      <button
                        onClick={() => copyToClipboard(createdKey.id)}
                        className="ml-2 p-2 glass rounded-lg hover:bg-white/20"
                      >
                        <Copy className="w-4 h-4 text-white/70" />
                      </button>
                    </div>
                  </div>
                  <div className="glass p-4 rounded-xl">
                    <label className="block text-white/80 text-sm font-medium mb-2">Webhook Secret</label>
                    <div className="flex items-center justify-between">
                      <code className="text-blue-400 text-sm break-all">{createdKey.webhook_secret}</code>
                      <button
                        onClick={() => copyToClipboard(createdKey.webhook_secret)}
                        className="ml-2 p-2 glass rounded-lg hover:bg-white/20"
                      >
                        <Copy className="w-4 h-4 text-white/70" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedKey(null);
                    }}
                    className="glass-button flex-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    API Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="glass-input w-full"
                    placeholder="e.g., Production API Key"
                    maxLength={50}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewKeyName('');
                      setError('');
                    }}
                    className="glass-button flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createApiKey}
                    className="glass-button flex-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                  >
                    Create Key
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ApiKeys;