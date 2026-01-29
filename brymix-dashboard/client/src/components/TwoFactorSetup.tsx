import React, { useState } from 'react';
import { api } from '../services/api';

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/2fa/setup');
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token || token.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/2fa/enable', { token });
      setBackupCodes(response.data.backupCodes);
      setStep('backup');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 max-w-md w-full">
        {step === 'setup' && (
          <>
            <h3 className="text-xl font-semibold text-white mb-4">Enable Two-Factor Authentication</h3>
            <p className="text-white/70 mb-6">
              Two-factor authentication adds an extra layer of security to your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSetup}
                disabled={loading}
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg border border-blue-500/30 transition-colors disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Get Started'}
              </button>
              <button
                onClick={onCancel}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          </>
        )}

        {step === 'verify' && (
          <>
            <h3 className="text-xl font-semibold text-white mb-4">Scan QR Code</h3>
            <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <p className="text-white/70 text-sm mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            <div className="bg-black/20 rounded-lg p-3 mb-4">
              <p className="text-white/70 text-xs mb-1">Or enter this code manually:</p>
              <p className="text-white font-mono text-sm break-all">{secret}</p>
            </div>
            <div className="mb-4">
              <label className="block text-white/70 text-sm mb-2">Enter verification code:</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                maxLength={6}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleVerify}
                disabled={loading || token.length !== 6}
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg border border-blue-500/30 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                onClick={onCancel}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          </>
        )}

        {step === 'backup' && (
          <>
            <h3 className="text-xl font-semibold text-white mb-4">Save Backup Codes</h3>
            <p className="text-white/70 text-sm mb-4">
              Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </p>
            <div className="bg-black/20 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div key={index} className="text-white font-mono text-sm bg-white/10 px-2 py-1 rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onComplete}
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg border border-green-500/30 transition-colors"
              >
                I've Saved These Codes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;