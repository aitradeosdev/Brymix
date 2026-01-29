import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, Building, Mail, Lock, Save, AlertCircle, CheckCircle, Shield, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorSetup from '../components/TwoFactorSetup';
import axios from 'axios';

const Settings: React.FC = () => {
  const { state } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState({ enabled: false, backupCodesCount: 0 });

  const [profileData, setProfileData] = useState({
    name: state.user?.name || '',
    company: state.user?.company || '',
    email: state.user?.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchTwoFactorStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/2fa/status`, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      setTwoFactorStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch 2FA status');
    }
  }, [API_URL, state.accessToken]);

  useEffect(() => {
    fetchTwoFactorStatus();
  }, [fetchTwoFactorStatus]);

  const handleDisableTwoFactor = async () => {
    const password = prompt('Enter your password to disable 2FA:');
    if (!password) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/2fa/disable`, { password }, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      setMessage('Two-factor authentication disabled');
      fetchTwoFactorStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.put(`${API_URL}/auth/profile`, {
        name: profileData.name,
        company: profileData.company
      }, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });

      setMessage('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await axios.put(`${API_URL}/auth/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });

      setMessage('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'twofactor', label: 'Two-Factor Auth', icon: Shield }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-white/70">Manage your account settings and preferences</p>
      </motion.div>

      {(message || error) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`glass rounded-xl p-4 flex items-center space-x-3 ${
            error ? 'bg-red-500/20 border-red-500/30' : 'bg-green-500/20 border-green-500/30'
          }`}
        >
          {error ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
          <span className={`text-sm ${error ? 'text-red-200' : 'text-green-200'}`}>
            {error || message}
          </span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card"
        >
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'glass bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
            >
              <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
              
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="glass-input w-full pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Company
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type="text"
                        value={profileData.company}
                        onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                        className="glass-input w-full pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="email"
                      value={profileData.email}
                      className="glass-input w-full pl-10 opacity-50 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <p className="text-white/40 text-xs mt-1">Email cannot be changed</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="glass-button bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
            >
              <h2 className="text-xl font-semibold text-white mb-6">Change Password</h2>
              
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="glass-input w-full pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="glass-input w-full pl-10"
                      minLength={8}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="glass-input w-full pl-10"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="glass-button bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Changing...' : 'Change Password'}</span>
                </button>
              </form>
            </motion.div>
          )}
          {activeTab === 'twofactor' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
            >
              <h2 className="text-xl font-semibold text-white mb-6">Two-Factor Authentication</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 glass rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-6 h-6 text-blue-400" />
                    <div>
                      <h3 className="text-white font-medium">Authenticator App</h3>
                      <p className="text-white/70 text-sm">
                        {twoFactorStatus.enabled 
                          ? 'Two-factor authentication is enabled'
                          : 'Add an extra layer of security to your account'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      twoFactorStatus.enabled 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    }`}>
                      {twoFactorStatus.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {twoFactorStatus.enabled ? (
                      <button
                        onClick={handleDisableTwoFactor}
                        disabled={loading}
                        className="glass-button bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30 disabled:opacity-50"
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowTwoFactorSetup(true)}
                        className="glass-button bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30"
                      >
                        Enable
                      </button>
                    )}
                  </div>
                </div>

                {twoFactorStatus.enabled && (
                  <div className="p-4 glass rounded-xl">
                    <h4 className="text-white font-medium mb-2">Backup Codes</h4>
                    <p className="text-white/70 text-sm mb-3">
                      You have {twoFactorStatus.backupCodesCount} backup codes remaining.
                    </p>
                    <p className="text-white/50 text-xs">
                      Backup codes can be used to access your account if you lose your authenticator device.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {showTwoFactorSetup && (
        <TwoFactorSetup
          onComplete={() => {
            setShowTwoFactorSetup(false);
            setMessage('Two-factor authentication enabled successfully');
            fetchTwoFactorStatus();
          }}
          onCancel={() => setShowTwoFactorSetup(false)}
        />
      )}
    </div>
  );
};

export default Settings;