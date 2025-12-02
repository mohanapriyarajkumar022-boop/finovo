// components/TwoFactorVerificationPopup.jsx
import React, { useState, useEffect } from 'react';
import './TwoFactorVerificationPopup.css';

const TwoFactorVerificationPopup = ({ onVerify, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (pin.length !== 6) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('userId');
      
      const response = await fetch('http://localhost:5000/api/two-factor/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Tenant-ID': tenantId
        },
        body: JSON.stringify({ pin })
      });

      const data = await response.json();

      if (data.success) {
        // Store verification timestamp
        localStorage.setItem('last2FAVerification', new Date().toISOString());
        
        if (onVerify) {
          onVerify();
        }
      } else {
        setError(data.message || 'Invalid PIN');
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      setError('Failed to verify PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="twofactor-overlay">
      <div className="twofactor-popup">
        <div className="twofactor-header">
          <div className="twofactor-icon">🔐</div>
          <h2>Security Verification Required</h2>
          <p>Please enter your 6-digit PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="twofactor-form">
          <div className="pin-input-container">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="6"
              value={pin}
              onChange={handlePinChange}
              placeholder="Enter 6-digit PIN"
              className={`pin-input ${error ? 'error' : ''}`}
              autoFocus
              disabled={loading}
            />
            <div className="pin-dots">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="verify-button"
            disabled={pin.length !== 6 || loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Verifying...
              </>
            ) : (
              'Verify PIN'
            )}
          </button>

          <div className="twofactor-note">
            <span className="note-icon">ℹ️</span>
            <p>This verification is required every 15 days for security purposes.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorVerificationPopup;