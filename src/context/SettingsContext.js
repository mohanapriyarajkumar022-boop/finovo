// src/context/SettingsContext.js - UPDATED WITH PRIVACY SETTINGS SUPPORT
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

  // Helper to safely get defaults
  const getDefaultSettings = () => {
    return {
      profile: { 
        name: '', 
        email: '', 
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
        twoFactorPIN: '',
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

  // ✅ Apply privacy settings globally
  const applyPrivacySettings = (privacySettings) => {
    if (!privacySettings) return;
    
    // Store login alerts preference
    if (privacySettings.loginAlerts !== undefined) {
      localStorage.setItem('loginAlertsEnabled', privacySettings.loginAlerts.toString());
    }
    
    // Store 2FA preference
    if (privacySettings.twoFactorAuth !== undefined) {
      localStorage.setItem('twoFactorEnabled', privacySettings.twoFactorAuth.toString());
    }
    
    // Store profile visibility
    if (privacySettings.profileVisibility) {
      localStorage.setItem('profileVisibility', privacySettings.profileVisibility);
    }
    
    // Store email visibility
    if (privacySettings.showEmail !== undefined) {
      localStorage.setItem('showEmail', privacySettings.showEmail.toString());
    }
  };

  // ✅ Apply accessibility settings globally
  const applyAccessibilitySettings = (accessibilitySettings) => {
    const root = document.documentElement;
    const body = document.body;
    
    if (accessibilitySettings) {
      // Apply High Contrast
      if (accessibilitySettings.highContrast) {
        body.classList.add('high-contrast');
        root.classList.add('high-contrast');
      } else {
        body.classList.remove('high-contrast');
        root.classList.remove('high-contrast');
      }
      
      // Apply Reduce Motion
      if (accessibilitySettings.reduceMotion) {
        body.classList.add('reduce-motion');
        root.classList.add('reduce-motion');
      } else {
        body.classList.remove('reduce-motion');
        root.classList.remove('reduce-motion');
      }
      
      // Apply Screen Reader settings (add aria attributes)
      if (accessibilitySettings.screenReader) {
        body.setAttribute('aria-live', 'polite');
        body.setAttribute('aria-atomic', 'true');
        body.classList.add('screen-reader-optimized');
      } else {
        body.removeAttribute('aria-live');
        body.removeAttribute('aria-atomic');
        body.classList.remove('screen-reader-optimized');
      }
      
      // Apply Keyboard Navigation
      if (accessibilitySettings.keyboardNavigation) {
        body.classList.add('keyboard-navigation');
        root.classList.add('keyboard-navigation');
      } else {
        body.classList.remove('keyboard-navigation');
        root.classList.remove('keyboard-navigation');
      }
    }
  };

  const checkAuthentication = useCallback(() => {
    const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const isAuth = !!token && !!userId;
    setIsAuthenticated(isAuth);
    return isAuth;
  }, []);

  const checkBackendAvailability = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings/health');
      const isAvailable = response.ok;
      setBackendAvailable(isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('🌐 Backend check failed:', error);
      setBackendAvailable(false);
      return false;
    }
  };

  // ✅ NEW: Dedicated Logout Function
  const logoutUser = useCallback(async () => {
    console.log('🚪 Executing Logout Procedure...');
    
    // 1. Attempt Backend Logout (Optional, don't let it block)
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (e) {
      console.warn('⚠️ Backend logout notification failed, proceeding with client cleanup', e);
    }

    // 2. Clear Context State
    setSettings(getDefaultSettings());
    setIsAuthenticated(false);
    setError(null);

    // 3. Clear Storage Mechanisms
    localStorage.clear();
    sessionStorage.clear();

    // 4. Clear Cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    console.log('✅ Local session destroyed');
    return true;
  }, []);

  // ✅ MAIN FETCH FUNCTION
  const fetchSettings = useCallback(async (forceRefresh = false) => {
    const isAuth = checkAuthentication();
    
    if (!isAuth) {
      const defaultSettings = getDefaultSettings();
      setSettings(defaultSettings);
      // Apply default accessibility settings
      applyAccessibilitySettings(defaultSettings.accessibility);
      // Apply default privacy settings
      applyPrivacySettings(defaultSettings.privacy);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        throw new Error('Authentication tokens missing');
      }

      const isBackendAvailable = await checkBackendAvailability();
      if (!isBackendAvailable) {
        throw new Error('Backend server not available');
      }

      const response = await fetch('http://localhost:5000/api/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        // Token expired or invalid - Auto logout
        logoutUser();
        throw new Error('Session expired');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.success && data.settings) {
        let backendData = data.settings;
        
        if (data.user) {
          if (!backendData.profile) backendData.profile = {};
          backendData.profile.email = data.user.email;
          backendData.profile.name = data.user.name || backendData.profile.name || '';
          
          localStorage.setItem('userEmail', data.user.email);
          localStorage.setItem('userName', data.user.name || '');
          localStorage.setItem('userId', data.user.id || userId);
        }

        const defaultSettings = getDefaultSettings();
        const mergedSettings = { ...defaultSettings, ...backendData };
        
        // Merge deep objects
        Object.keys(defaultSettings).forEach(key => {
          if (!mergedSettings[key]) {
            mergedSettings[key] = defaultSettings[key];
          } else if (typeof defaultSettings[key] === 'object' && mergedSettings[key]) {
            mergedSettings[key] = { ...defaultSettings[key], ...mergedSettings[key] };
          }
        });

        setSettings(mergedSettings);
        
        // ✅ Apply privacy settings globally
        if (mergedSettings.privacy) {
          applyPrivacySettings(mergedSettings.privacy);
        }
        
        // ✅ Apply accessibility settings globally
        if (mergedSettings.accessibility) {
          applyAccessibilitySettings(mergedSettings.accessibility);
        }
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.message);
      // If authentication error, force clear
      if (err.message === 'Session expired') {
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, [checkAuthentication, logoutUser]);

  // Update Settings
  const updateSettings = async (section, sectionData) => {
    try {
      setError(null);
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      
      if (!token) throw new Error('Authentication required');

      let endpoint = 'http://localhost:5000/api/settings/update-section';
      if (section === 'profile') endpoint = 'http://localhost:5000/api/settings/profile';

      const response = await fetch(endpoint, {
        method: section === 'profile' ? 'PUT' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...(section !== 'profile' && { section }),
          ...sectionData
        })
      });

      const result = await response.json();

      if (result && result.success) {
        let updatedData = result.settings || result.data;
        
        if (result.user) {
           if (!updatedData.profile) updatedData.profile = {};
           updatedData.profile.email = result.user.email;
           updatedData.profile.name = result.user.name || updatedData.profile?.name || '';
        }

        setSettings(prev => {
          const newSettings = {
            ...prev,
            ...updatedData,
            [section]: { ...prev?.[section], ...updatedData[section] }
          };
          if (section === 'profile' && updatedData.profile) {
            newSettings.profile = { ...prev?.profile, ...updatedData.profile };
          }
          return newSettings;
        });
        
        // ✅ Apply privacy settings immediately if updated
        if (section === 'privacy' && updatedData.privacy) {
          applyPrivacySettings(updatedData.privacy);
        }
        
        // ✅ Apply accessibility settings immediately if updated
        if (section === 'accessibility' && updatedData.accessibility) {
          applyAccessibilitySettings(updatedData.accessibility);
        }
        
        return { success: true, data: updatedData, user: result.user };
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const resetSettings = async () => {
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/settings/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        const newSettings = result.settings || result.data;
        setSettings(newSettings);
        // ✅ Apply privacy settings after reset
        if (newSettings.privacy) {
          applyPrivacySettings(newSettings.privacy);
        }
        // ✅ Apply accessibility settings after reset
        if (newSettings.accessibility) {
          applyAccessibilitySettings(newSettings.accessibility);
        }
        return { success: true };
      }
      throw new Error(result.message);
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const getCurrentUserEmail = () => {
    if (settings?.profile?.email) return settings.profile.email;
    return localStorage.getItem('userEmail') || '';
  };
  
  const getCurrentUserName = () => {
    if (settings?.profile?.name) return settings.profile.name;
    return localStorage.getItem('userName') || '';
  };

  const getCurrentTenantId = () => {
    if (settings?.tenantId) return settings.tenantId;
    const stored = localStorage.getItem('tenantId');
    return (stored && /^\d{6}$/.test(stored)) ? stored : '';
  };

  // Initialize
  useEffect(() => {
    fetchSettings();
    
    const handleStorageChange = (e) => {
      if (['sessionToken', 'token', 'userId'].includes(e.key)) {
        if (!localStorage.getItem('sessionToken') && !localStorage.getItem('token')) {
          logoutUser(); // Logout if token removed from storage
        } else {
          fetchSettings(true);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchSettings, logoutUser]);

  return (
    <SettingsContext.Provider value={{
      settings: settings || getDefaultSettings(),
      loading,
      error,
      isAuthenticated,
      backendAvailable,
      updateSettings,
      resetSettings,
      refetchSettings: () => fetchSettings(true),
      checkAuthentication,
      getCurrentUserEmail,
      getCurrentUserName,
      getCurrentTenantId,
      logoutUser // ✅ Exported here
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
