// src/components/AppWrapper.jsx
import React, { useEffect, useState } from 'react';
import { useTwoFactor } from '../context/TwoFactorContext';

const AppWrapper = ({ children }) => {
  const { twoFactorStatus, verifyPin, checkVerificationRequired } = useTwoFactor();
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [pin, setPin] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const checkVerification = async () => {
      if (twoFactorStatus.isEnabled) {
        const requiresVerification = await checkVerificationRequired();
        if (requiresVerification) {
          setShowVerificationPopup(true);
        }
      }
    };

    checkVerification();
  }, [twoFactorStatus.isEnabled, checkVerificationRequired]);

  const handleVerifyPin = async () => {
    if (!pin || pin.length !== 6) {
      setErrorMessage('PIN must be exactly 6 digits');
      return;
    }

    setVerificationLoading(true);
    setErrorMessage('');

    try {
      const result = await verifyPin(pin);
      if (result.success) {
        setShowVerificationPopup(false);
        setPin('');
      } else {
        setErrorMessage(result.message || 'Invalid PIN');
      }
    } catch (error) {
      setErrorMessage('Verification failed. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  if (showVerificationPopup) {
    return (
      <div className="verification-popup-overlay">
        <div className="verification-popup">
          <div className="popup-header">
            <h3>🛡️ Security Verification Required</h3>
            <p>Please enter your 6-digit PIN to continue</p>
          </div>
          <div className="popup-body">
            <p className="security-note">
              For security reasons, you need to verify your PIN every 15 days.
            </p>
            <div className="pin-input-container">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="6"
                placeholder="Enter 6-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="verification-pin-input"
                autoFocus
              />
            </div>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </div>
          <div className="popup-footer">
            <button
              className="btn-verify"
              onClick={handleVerifyPin}
              disabled={verificationLoading || pin.length !== 6}
            >
              {verificationLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
        <div className="popup-backdrop">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppWrapper;