// src/context/TwoFactorContext.jsx - FIXED VERSION
import React, { createContext, useState, useContext, useEffect } from 'react';

const TwoFactorContext = createContext();

export const useTwoFactor = () => {
  const context = useContext(TwoFactorContext);
  if (!context) {
    throw new Error('useTwoFactor must be used within a TwoFactorProvider');
  }
  return context;
};

export const TwoFactorProvider = ({ children }) => {
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    hasPin: false,
    isEnabled: false,
    requiresPin: false,
    isLoading: false
  });

  // Get authentication headers with proper token handling
  const getAuthHeaders = () => {
    const token = localStorage.getItem('sessionToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('authToken');
    
    // Get tenantId from localStorage - use consistent source
    let tenantId = localStorage.getItem('tenantId') || 
                   localStorage.getItem('userId');
    
    // If no tenantId exists, try to get it from user info
    if (!tenantId) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const userData = JSON.parse(userInfo);
          tenantId = userData.tenantId || userData.id || userData._id;
        } catch (error) {
          console.log('Could not parse userInfo from localStorage');
        }
      }
    }
    
    // If still no tenantId, use a default
    if (!tenantId) {
      tenantId = 'default-tenant';
      localStorage.setItem('tenantId', tenantId);
    }
    
    const userId = localStorage.getItem('userId') || '';
    
    const headers = {
      'Content-Type': 'application/json',
      'Tenant-ID': tenantId,
      'X-Tenant-ID': tenantId,
      'X-User-ID': userId
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // Check 2FA status
  const checkStatus = async () => {
    try {
      const token = localStorage.getItem('sessionToken') || 
                    localStorage.getItem('token') || 
                    localStorage.getItem('authToken');
      
      if (!token) {
        setTwoFactorStatus({
          hasPin: false,
          isEnabled: false,
          requiresPin: false,
          isLoading: false
        });
        return { success: true, data: { hasPin: false, isEnabled: false, requiresPin: false } };
      }

      const headers = getAuthHeaders();
      
      const response = await fetch('http://localhost:5000/api/two-factor/status', {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle both response formats
        let statusData = data;
        if (data.data) {
          statusData = data.data;
        }
        
        const newStatus = {
          hasPin: statusData.hasPin || false,
          isEnabled: statusData.isEnabled || false,
          requiresPin: statusData.requiresPin || false,
          isLoading: false
        };
        
        setTwoFactorStatus(newStatus);
        return { success: true, data: newStatus };
      } else if (response.status === 401) {
        // Session expired
        const defaultStatus = {
          hasPin: false,
          isEnabled: false,
          requiresPin: false,
          isLoading: false
        };
        setTwoFactorStatus(defaultStatus);
        return { success: false, error: 'Session expired', data: defaultStatus };
      } else {
        const defaultStatus = {
          hasPin: false,
          isEnabled: false,
          requiresPin: false,
          isLoading: false
        };
        setTwoFactorStatus(defaultStatus);
        return { success: false, error: `HTTP error! status: ${response.status}`, data: defaultStatus };
      }
      
    } catch (error) {
      console.error('2FA status check failed:', error);
      const defaultStatus = {
        hasPin: false,
        isEnabled: false,
        requiresPin: false,
        isLoading: false
      };
      setTwoFactorStatus(defaultStatus);
      return { success: false, error: error.message, data: defaultStatus };
    }
  };

  // Setup 2FA with PIN
  const setupTwoFactor = async (pin) => {
    try {
      if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
        return { success: false, message: 'PIN must be exactly 6 digits' };
      }

      const headers = getAuthHeaders();
      
      // Get tenantId from headers or localStorage
      const tenantId = headers['Tenant-ID'] || localStorage.getItem('tenantId') || localStorage.getItem('userId');
      
      // Create request body with only required fields
      const requestBody = {
        pin: pin
      };
      
      // Only add tenantId if it exists and is not the default
      if (tenantId && tenantId !== 'default-tenant') {
        requestBody.tenantId = tenantId;
      }
      
      console.log('🔐 Setting up 2FA with headers:', headers);
      console.log('🔐 Request body:', requestBody);

      const response = await fetch('http://localhost:5000/api/two-factor/setup', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        throw new Error(`Invalid response from server: ${responseText}`);
      }

      console.log('🔐 Setup response:', { status: response.status, data });

      if (!response.ok) {
        let errorMessage = data.message || `HTTP error! status: ${response.status}`;
        
        // Handle specific error cases
        if (response.status === 400) {
          errorMessage = data.message || 'Invalid request. Please check your input.';
        } else if (response.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
          // Clear invalid tokens
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
        }
        
        throw new Error(errorMessage);
      }

      if (data.success) {
        await checkStatus();
        return { 
          success: true, 
          message: data.message || '2FA setup successfully',
          data: data
        };
      } else {
        return { 
          success: false, 
          message: data.message || '2FA setup failed' 
        };
      }
    } catch (error) {
      console.error('2FA setup failed:', error);
      return { 
        success: false, 
        message: error.message || '2FA setup failed',
        error: error.message
      };
    }
  };

  // Verify PIN
  const verifyPin = async (pin) => {
    try {
      if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
        return { success: false, message: 'PIN must be exactly 6 digits' };
      }

      const headers = getAuthHeaders();
      const tenantId = headers['Tenant-ID'] || localStorage.getItem('tenantId') || localStorage.getItem('userId');
      
      // Create request body with only required fields
      const requestBody = {
        pin: pin
      };
      
      // Only add tenantId if it exists and is not the default
      if (tenantId && tenantId !== 'default-tenant') {
        requestBody.tenantId = tenantId;
      }
      
      console.log('🔐 Verifying PIN with headers:', headers);
      console.log('🔐 Request body:', requestBody);

      const response = await fetch('http://localhost:5000/api/two-factor/verify', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        throw new Error(`Invalid response from server: ${responseText}`);
      }

      console.log('🔐 Verify response:', { status: response.status, data });

      if (!response.ok) {
        let errorMessage = data.message || `HTTP error! status: ${response.status}`;
        
        if (response.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
        }
        
        throw new Error(errorMessage);
      }

      if (data.success) {
        await checkStatus();
        return { 
          success: true, 
          message: data.message || 'PIN verified successfully',
          data: data
        };
      } else {
        return { 
          success: false, 
          message: data.message || 'Invalid PIN' 
        };
      }
    } catch (error) {
      console.error('PIN verification failed:', error);
      return { 
        success: false, 
        message: error.message || 'PIN verification failed' 
      };
    }
  };

  // Disable 2FA
  const disableTwoFactor = async () => {
    try {
      const headers = getAuthHeaders();
      const tenantId = headers['Tenant-ID'] || localStorage.getItem('tenantId') || localStorage.getItem('userId');
      
      // Create request body with only tenantId if it exists
      const requestBody = {};
      if (tenantId && tenantId !== 'default-tenant') {
        requestBody.tenantId = tenantId;
      }
      
      console.log('🔐 Disabling 2FA with headers:', headers);
      console.log('🔐 Request body:', requestBody);

      const response = await fetch('http://localhost:5000/api/two-factor/disable', {
        method: 'POST',
        headers: headers,
        body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
        credentials: 'include'
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        throw new Error(`Invalid response from server: ${responseText}`);
      }

      console.log('🔐 Disable response:', { status: response.status, data });

      if (!response.ok) {
        let errorMessage = data.message || `HTTP error! status: ${response.status}`;
        
        if (response.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
        }
        
        throw new Error(errorMessage);
      }

      if (data.success) {
        await checkStatus();
        return { 
          success: true, 
          message: data.message || '2FA disabled successfully',
          data: data
        };
      } else {
        return { 
          success: false, 
          message: data.message || 'Failed to disable 2FA' 
        };
      }
    } catch (error) {
      console.error('2FA disable failed:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to disable 2FA' 
      };
    }
  };

  // Check if verification is required
  const checkVerificationRequired = async () => {
    try {
      const headers = getAuthHeaders();
      const token = localStorage.getItem('sessionToken') || 
                    localStorage.getItem('token') || 
                    localStorage.getItem('authToken');
      
      if (!token) {
        return false;
      }

      console.log('🔐 Checking verification required with headers:', headers);

      const response = await fetch('http://localhost:5000/api/two-factor/verification-required', {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.verificationRequired || false;
      } else if (response.status === 401) {
        console.log('Session expired during 2FA verification check');
        return false;
      }
      return false;
    } catch (error) {
      console.log('Error checking 2FA verification:', error.message);
      return false;
    }
  };

  // Manual refresh of 2FA status
  const refreshStatus = async () => {
    return await checkStatus();
  };

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const value = {
    twoFactorStatus,
    checkStatus,
    setupTwoFactor,
    verifyPin,
    disableTwoFactor,
    checkVerificationRequired,
    refreshStatus
  };

  return (
    <TwoFactorContext.Provider value={value}>
      {children}
    </TwoFactorContext.Provider>
  );
};