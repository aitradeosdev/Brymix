const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate 2FA setup
router.post('/setup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    const secret = speakeasy.generateSecret({
      name: `Brymix (${user.email})`,
      issuer: 'Brymix Dashboard'
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store temp secret (not enabled yet)
    user.twoFactorSecret = secret.base32;
    await user.save();

    res.json({
      qrCode: qrCodeUrl,
      secret: secret.base32
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Enable 2FA
router.post('/enable', auth, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id).select('+twoFactorSecret');

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: 'No 2FA setup found' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = backupCodes;
    await user.save();

    res.json({ 
      message: '2FA enabled successfully',
      backupCodes 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Disable 2FA
router.post('/disable', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify 2FA token
router.post('/verify', async (req, res) => {
  try {
    const { email, token, isBackupCode } = req.body;
    const user = await User.findOne({ email }).select('+twoFactorSecret +twoFactorBackupCodes');

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    let verified = false;

    if (isBackupCode) {
      const codeIndex = user.twoFactorBackupCodes.indexOf(token.toUpperCase());
      if (codeIndex !== -1) {
        user.twoFactorBackupCodes.splice(codeIndex, 1);
        await user.save();
        verified = true;
      }
    } else {
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 2
      });
    }

    res.json({ verified });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get 2FA status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ 
      enabled: user.twoFactorEnabled,
      backupCodesCount: user.twoFactorBackupCodes?.length || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;