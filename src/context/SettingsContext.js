// frontend/src/contexts/SettingsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import settingsService from '../services/settingsService';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);

  const getCurrentUserEmail = () => {
    return localStorage.getItem('userEmail') || '';
  };

  const getCurrentUserName = () => {
    return localStorage.getItem('userName') || '';
  };

  const getCurrentUserId = () => {
    return localStorage.getItem('userId') || '';
  };

  const checkAuthentication = () => {
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const userId = getCurrentUserId();
      const isAuthenticated = !!token && !!userId;
      
      console.log('🔐 Authentication check:', { 
        isAuthenticated, 
        hasToken: !!token, 
        hasUserId: !!userId,
        userId: userId,
        email: getCurrentUserEmail()
      });
      
      setIsAuthenticated(isAuthenticated);
      return isAuthenticated;
    } catch (err) {
      console.error('Error checking authentication:', err);
      return false;
    }
  };

  const getDefaultSettings = () => {
    const currentEmail = getCurrentUserEmail();
    const currentName = getCurrentUserName();
    
    return {
      profile: {
        name: currentName,
        email: currentEmail,
        phone: '',
        bio: '',
        profilePhoto: '',
        profilePhotoUrl: ''
      },
      account: {
        type: 'individual',
        status: 'active'
      },
      theme: {
        mode: 'light',
        primaryColor: '#8B5CF6',
        fontSize: 'medium',
        fontFamily: 'Inter'
      },
      notifications: {
        email: true,
        push: true,
        transactionAlerts: true,
        weeklyReports: true,
        budgetAlerts: true,
        securityAlerts: true
      },
      privacy: {
        profileVisibility: 'private',
        showEmail: false,
        twoFactorAuth: false,
        loginAlerts: true
      },
      appearance: {
        compactMode: false,
        showAnimations: true,
        currencySymbol: '$',
        dateFormat: 'MM/DD/YYYY'
      },
      language: {
        appLanguage: 'en',
        locale: 'en-US',
        currency: 'USD',
        timezone: 'UTC'
      },
      performance: {
        enableCache: true,
        autoSave: true,
        lowDataMode: false
      },
      accessibility: {
        highContrast: false,
        reduceMotion: false,
        screenReader: false,
        keyboardNavigation: false
      }
    };
  };

  const ensureSettingsStructure = (settingsData) => {
    const defaultSettings = getDefaultSettings();
    const currentEmail = getCurrentUserEmail();
    const currentName = getCurrentUserName();
    
    const mergeDeep = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          mergeDeep(target[key], source[key]);
        } else if (source[key] !== undefined && source[key] !== null) {
          target[key] = source[key];
        }
      }
      return target;
    };
    
    const merged = mergeDeep(JSON.parse(JSON.stringify(defaultSettings)), settingsData);
    
    // Always ensure email and name are from current session
    merged.profile.email = currentEmail;
    merged.profile.name = currentName;
    
    return merged;
  };

  const checkBackendAvailability = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const isAvailable = response.ok;
      setBackendAvailable(isAvailable);
      return isAvailable;
    } catch (error) {
      console.warn('⚠️ Backend is not available:', error.message);
      setBackendAvailable(false);
      return false;
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const authenticated = checkAuthentication();
      const backendAvailable = await checkBackendAvailability();

      console.log('🔄 Fetch settings:', {
        authenticated,
        backendAvailable,
        currentEmail: getCurrentUserEmail()
      });

      if (authenticated && backendAvailable) {
        try {
          const response = await settingsService.getSettings();
          
          if (response && response.success && response.data) {
            let backendSettings = response.data;
            
            // Ensure current user info
            if (backendSettings.profile) {
              backendSettings.profile.email = getCurrentUserEmail();
              backendSettings.profile.name = getCurrentUserName();
            }
            
            const ensuredSettings = ensureSettingsStructure(backendSettings);
            setSettings(ensuredSettings);
            console.log('✅ Settings loaded from backend');
          } else {
            throw new Error('Invalid response from backend');
          }
        } catch (backendError) {
          console.warn('⚠️ Backend fetch failed:', backendError.message);
          const defaultSettings = getDefaultSettings();
          setSettings(defaultSettings);
        }
      } else {
        console.log('🔐 Using default settings');
        const defaultSettings = getDefaultSettings();
        setSettings(defaultSettings);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.message);
      const defaultSettings = getDefaultSettings();
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (section, sectionData) => {
    try {
      setError(null);
      const authenticated = checkAuthentication();
      const backendAvailable = await checkBackendAvailability();

      if (authenticated && backendAvailable) {
        try {
          // If updating profile and the client included a base64 `profilePhoto`,
          // upload it first and replace with `profilePhotoUrl` to avoid large
          // payloads in the settings API.
          const profilePayload = (section === 'profile' && sectionData) ? { ...sectionData } : null;
          if (profilePayload && profilePayload.profilePhoto) {
            const photo = profilePayload.profilePhoto;
            const looksLikeBase64 = (typeof photo === 'string') && (photo.startsWith('data:image') || photo.length > 1000);
            if (looksLikeBase64) {
              try {
                const uploadResp = await fetch('http://localhost:5000/api/upload/profile-photo', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ imageBase64: photo })
                });

                const uploadJson = await uploadResp.json();
                if (uploadResp.ok && uploadJson && uploadJson.success && uploadJson.url) {
                  // Replace with URL and remove raw base64
                  sectionData = { ...sectionData, profilePhotoUrl: uploadJson.url };
                  delete sectionData.profilePhoto;
                } else {
                  console.warn('Image upload failed:', uploadJson);
                  return { success: false, error: uploadJson.message || 'Image upload failed' };
                }
              } catch (uploadErr) {
                console.error('Image upload error:', uploadErr);
                return { success: false, error: 'Image upload error' };
              }
            }
          }

          const response = await settingsService.updateSection(section, sectionData);
          
          if (response && response.success) {
            let updatedSettings = response.data;
            
            if (updatedSettings.profile) {
              updatedSettings.profile.email = getCurrentUserEmail();
              updatedSettings.profile.name = getCurrentUserName();
            }
            
            const ensuredSettings = ensureSettingsStructure(updatedSettings);
            setSettings(ensuredSettings);
            console.log('✅ Settings updated in backend');
            return { success: true, data: ensuredSettings };
          } else {
            throw new Error('Backend update failed');
          }
        } catch (backendError) {
          console.warn('⚠️ Backend update failed:', backendError.message);
          return { success: false, error: backendError.message };
        }
      } else {
        return { success: false, error: 'Not authenticated or backend unavailable' };
      }
    } catch (err) {
      console.error('Update settings error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const resetSettings = async (tenantId) => {
    try {
      setError(null);
      const authenticated = checkAuthentication();
      const backendAvailable = await checkBackendAvailability();

      if (authenticated && backendAvailable) {
        try {
          const response = await settingsService.resetSettings(tenantId);
          
          if (response && response.success) {
            const ensuredSettings = ensureSettingsStructure(response.data);
            setSettings(ensuredSettings);
            return { success: true, data: ensuredSettings };
          } else {
            throw new Error('Backend reset failed');
          }
        } catch (backendError) {
          console.warn('⚠️ Backend reset failed:', backendError.message);
          return { success: false, error: backendError.message };
        }
      } else {
        return { success: false, error: 'Not authenticated or backend unavailable' };
      }
    } catch (err) {
      console.error('Reset settings error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchSettings();
    
    const handleLogin = () => {
      console.log('🔔 Login event detected, refreshing settings');
      fetchSettings();
    };
    
    window.addEventListener('userLoggedIn', handleLogin);
    
    return () => {
      window.removeEventListener('userLoggedIn', handleLogin);
    };
  }, []);

  const value = {
    settings: settings || getDefaultSettings(),
    loading,
    error,
    isAuthenticated,
    backendAvailable,
    updateSettings,
    resetSettings,
    refetchSettings: fetchSettings,
    checkAuthentication,
    clearError: () => setError(null)
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};