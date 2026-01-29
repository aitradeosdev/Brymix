import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Key, Check } from 'lucide-react';
import { useApiKey } from '../contexts/ApiKeyContext';

const ApiKeySelector: React.FC = () => {
  const { apiKeys, selectedApiKey, setSelectedApiKey, loading } = useApiKey();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="glass-card p-3 w-64">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white/20 rounded animate-pulse"></div>
          <div className="w-32 h-4 bg-white/20 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (apiKeys.length === 0) {
    return (
      <div className="glass-card p-3 w-64">
        <div className="flex items-center space-x-2 text-white/60">
          <Key className="w-4 h-4" />
          <span className="text-sm">No API keys</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-64">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-card p-3 w-full flex items-center justify-between hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Key className="w-4 h-4 text-blue-400" />
          <span className="text-white text-sm truncate">
            {selectedApiKey ? selectedApiKey.name : 'Select API Key'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 max-h-64 overflow-y-auto"
          >
            {apiKeys.map((apiKey) => (
              <button
                key={apiKey.id}
                onClick={() => {
                  setSelectedApiKey(apiKey);
                  setIsOpen(false);
                }}
                className="w-full p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-blue-400" />
                  <div className="text-left">
                    <div className="text-white text-sm">{apiKey.name}</div>
                    <div className="text-white/60 text-xs font-mono">{apiKey.maskedKey}</div>
                  </div>
                </div>
                {selectedApiKey?.id === apiKey.id && (
                  <Check className="w-4 h-4 text-green-400" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApiKeySelector;