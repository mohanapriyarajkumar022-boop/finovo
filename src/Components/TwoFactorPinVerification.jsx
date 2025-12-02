// Frontend/src/components/TwoFactorPinVerification.jsx
import React, { useState, useRef, useEffect } from 'react';
import './TwoFactorVerificationPopup.css'; // Reuse the same CSS

const TwoFactorPinVerification = ({ onVerified, isPeriodicVerification = false, verificationData = {} }) => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('verify'); // 'verify' or 'backup'
  const [backupCode, setBackupCode] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(null);
  
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  const getEnvVariable = (key, defaultValue = '') => {
    if (typeof import.meta.env !== 'undefined' && import.meta.env[key] !== undefined) {
      return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
      return process.env[key];
    }
    return defaultValue;
  };

  const API_URL = getEnvVariable('VITE_API_URL', 'http://localhost:5000');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('userId');
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Tenant-ID': tenantId,
      'X-Tenant-ID': tenantId
    };
  };

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, []);

  const handlePinChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newPin.every(digit => digit !== '') && index === 5) {
      setTimeout(() => handleVerify(newPin.join('')), 100);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setPin(digits);
      inputRefs[5].current?.focus();
      
      // Auto-verify pasted PIN
      setTimeout(() => handleVerify(pastedData), 100);
    }
  };

  const handleVerify = async (pinValue = null) => {
    const fullPin = pinValue || pin.join('');
    
    if (fullPin.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (isLocked) {
      setError('Account is temporarily locked. Please try again later.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/two-factor/verify-pin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ pin: fullPin })
      });

      const data = await response.json();

      if (data.success && data.verified) {
        // Call success callback
        if (onVerified) onVerified();
        
        setError('');
        
        if (isPeriodicVerification) {
          console.log('✅ Periodic verification successful');
        }
      } else {
        if (data.isLocked) {
          setIsLocked(true);
          setLockedUntil(data.lockedUntil);
          setError('Account locked due to too many failed attempts. Please try again later.');
        } else {
          setFailedAttempts(data.failedAttempts || 0);
          const remainingAttempts = data.remainingAttempts ?? 5;
          setError(data.message || `Incorrect PIN. ${remainingAttempts} attempts remaining.`);
        }
        // Clear PIN on error
        setPin(['', '', '', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify PIN. Please check your connection.');
      // Clear PIN on error
      setPin(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCode = async () => {
    if (!backupCode || backupCode.length < 8) {
      setError('Please enter a valid backup code');
      return;
    }

    if (isLocked) {
      setError('Account is temporarily locked. Please try again later.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/two-factor/verify-backup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ backupCode })
      });

      const data = await response.json();

      if (data.success) {
        // Call success callback
        if (onVerified) onVerified();
        
        if (isPeriodicVerification) {
          console.log('✅ Periodic backup verification successful');
        }
      } else {
        if (data.isLocked) {
          setIsLocked(true);
          setLockedUntil(data.lockedUntil);
          setError('Account locked. Please try again later.');
        } else {
          setError(data.message || 'Invalid backup code. Please try again.');
        }
      }
    } catch (error) {
      console.error('Backup verification error:', error);
      setError('Failed to verify backup code. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = () => {
    if (!lockedUntil) return '';
    
    const now = new Date();
    const locked = new Date(lockedUntil);
    const diff = locked - now;
    
    if (diff <= 0) return 'Account unlocked';
    
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  };

  return (
    <div className="two-factor-overlay">
      <div className="two-factor-popup compact">
        <div className="two-factor-header">
          <div className="lock-icon">🔐</div>
          <h2>
            {isPeriodicVerification 
              ? 'Security Check Required' 
              : 'Enter Your PIN'
            }
          </h2>
          <p className="subtitle">
            {isPeriodicVerification 
              ? 'For your security, we verify your identity every 30 days (WhatsApp-style)'
              : step === 'verify' 
                ? 'Please enter your 6-digit PIN to continue'
                : 'Enter your backup code to verify'
            }
          </p>
        </div>

        <div className="two-factor-body">
          {step === 'verify' ? (
            <>
              <div className="verification-info">
                <div className="info-icon">🛡️</div>
                <p>
                  {isPeriodicVerification
                    ? 'Like WhatsApp, we verify your identity every 30 days for enhanced security.'
                    : 'For your security, enter your 6-digit PIN.'
                  }
                </p>
                {verificationData?.daysSinceVerification !== undefined && (
                  <p className="info-detail">
                    Last verified: {verificationData.daysSinceVerification} days ago
                  </p>
                )}
                {isPeriodicVerification && (
                  <div className="whatsapp-style-notice">
                    <span className="notice-icon">💡</span>
                    <span>This 30-day verification keeps your account secure, just like WhatsApp</span>
                  </div>
                )}
              </div>

              <div className="pin-input-container" onPaste={handlePaste}>
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="pin-digit-input"
                    disabled={loading || isLocked}
                    autoComplete="off"
                  />
                ))}
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                  {isLocked && lockedUntil && (
                    <div className="lock-info">{formatTimeRemaining()}</div>
                  )}
                </div>
              )}

              {failedAttempts > 0 && !isLocked && (
                <div className="warning-message">
                  ⚠️ {5 - failedAttempts} attempts remaining before account is locked
                </div>
              )}

              {loading && (
                <div className="loading-indicator">
                  <span className="spinner"></span>
                  <span>Verifying PIN...</span>
                </div>
              )}

              <div className="backup-option">
                <button
                  className="backup-link"
                  onClick={() => {
                    setStep('backup');
                    setError('');
                  }}
                  disabled={loading}
                >
                  Forgot your PIN? Use backup code
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="verification-info">
                <div className="info-icon">🔑</div>
                <p>Enter one of your backup codes to verify your identity.</p>
                <p className="info-detail">Each backup code can only be used once.</p>
              </div>

              <div className="verification-input-group">
                <label>Enter Backup Code</label>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="Enter 8-digit backup code"
                  className="code-input"
                  disabled={loading || isLocked}
                  autoFocus
                />
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                  {isLocked && lockedUntil && (
                    <div className="lock-info">{formatTimeRemaining()}</div>
                  )}
                </div>
              )}

              <button
                className="verify-button"
                onClick={handleBackupCode}
                disabled={loading || !backupCode || isLocked}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Verifying...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Verify Backup Code
                  </>
                )}
              </button>

              <div className="backup-option">
                <button
                  className="backup-link"
                  onClick={() => {
                    setStep('verify');
                    setBackupCode('');
                    setError('');
                  }}
                  disabled={loading}
                >
                  ← Back to PIN
                </button>
              </div>
            </>
          )}
        </div>

        <div className="two-factor-footer">
          <div className="security-note">
            <span className="shield-icon">🛡️</span>
            <span>
              {isPeriodicVerification
                ? '30-day verification keeps your account secure (WhatsApp-style)'
                : 'This verification helps keep your account secure'
              }
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pin-input-container {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin: 20px 0;
        }

        .pin-digit-input {
          width: 50px;
          height: 60px;
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s;
        }

        .pin-digit-input:focus {
          border-color: #25D366;
          box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
        }

        .pin-digit-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin: 15px 0;
          color: #666;
          font-size: 14px;
        }

        .warning-message {
          background: #fff3cd;
          border: 1px solid #ffc107;
          color: #856404;
          padding: 10px;
          border-radius: 6px;
          margin: 10px 0;
          font-size: 13px;
          text-align: center;
        }

        .lock-info {
          margin-top: 5px;
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default TwoFactorPinVerification;