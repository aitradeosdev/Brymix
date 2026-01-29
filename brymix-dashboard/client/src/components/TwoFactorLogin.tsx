import React, { useState } from 'react';

interface TwoFactorLoginProps {
  onVerify: (token: string, isBackupCode?: boolean) => void;
  loading: boolean;
  error: string;
}

const TwoFactorLogin: React.FC<TwoFactorLoginProps> = ({ onVerify, loading, error }) => {
  const [token, setToken] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onVerify(token.trim(), useBackupCode);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">
          Two-Factor Authentication
        </h3>
        <p className="text-white/70 text-sm">
          {useBackupCode 
            ? 'Enter one of your backup codes'
            : 'Enter the 6-digit code from your authenticator app'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={token}
            onChange={(e) => {
              const value = useBackupCode 
                ? e.target.value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 8)
                : e.target.value.replace(/\D/g, '').slice(0, 6);
              setToken(value);
            }}
            placeholder={useBackupCode ? 'ABCD1234' : '123456'}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 text-center text-lg font-mono"
            maxLength={useBackupCode ? 8 : 6}
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token.trim() || (!useBackupCode && token.length !== 6) || (useBackupCode && token.length !== 8)}
          className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-3 rounded-lg border border-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setToken('');
            }}
            className="text-white/70 hover:text-white text-sm underline"
          >
            {useBackupCode ? 'Use authenticator code' : 'Use backup code'}
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default TwoFactorLogin;