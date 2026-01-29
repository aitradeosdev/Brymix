import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  createdAt: string;
  lastUsed?: string;
}

interface ApiKeyContextType {
  apiKeys: ApiKey[];
  selectedApiKey: ApiKey | null;
  setSelectedApiKey: (apiKey: ApiKey | null) => void;
  loading: boolean;
  refreshApiKeys: () => Promise<void>;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};

interface ApiKeyProviderProps {
  children: ReactNode;
}

export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = ({ children }) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const { state } = useAuth();

  const API_URL = '/api';

  const refreshApiKeys = useCallback(async () => {
    if (!state.accessToken) return;
    
    try {
      const response = await axios.get(`${API_URL}/keys`, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      
      const keys = response.data.keys;
      setApiKeys(keys);
      
      // Auto-select first key if none selected and keys exist
      if (!selectedApiKey && keys.length > 0) {
        setSelectedApiKey(keys[0]);
      }
      
      // Clear selection if selected key no longer exists
      if (selectedApiKey && !keys.find((k: ApiKey) => k.id === selectedApiKey.id)) {
        setSelectedApiKey(keys.length > 0 ? keys[0] : null);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL, state.accessToken, selectedApiKey]);

  useEffect(() => {
    if (state.accessToken) {
      refreshApiKeys();
    }
  }, [state.accessToken, refreshApiKeys]);

  const value = {
    apiKeys,
    selectedApiKey,
    setSelectedApiKey,
    loading,
    refreshApiKeys
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
};