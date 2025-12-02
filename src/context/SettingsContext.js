// frontend/src/contexts/SettingsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Import settingsService
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

  // Check if user is authenticated
  const checkAuthentication = () => {
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      let tenantId = localStorage.getItem('tenantId');
      
      // Ensure tenantId exists
      if (!tenantId) {
        tenantId = 'dev-tenant-default';
        localStorage.setItem('tenantId', tenantId);
      }
      
      const authenticated = !!token;
      setIsAuthenticated(authenticated);
      console.log('🔐 Authentication check:', { authenticated, hasToken: !!token, tenantId });
      return authenticated;
    } catch (err) {
      console.error('Error checking authentication:', err);
      return false;
    }
  };

  // Get default settings for local storage - ENHANCED WITH PROPER DEFAULTS
  const getDefaultSettings = () => ({
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
  });

  // Load settings from localStorage
  const loadLocalSettings = () => {
    try {
      const localSettings = localStorage.getItem('appSettings');
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        console.log('📁 Loaded settings from localStorage');
        // Ensure all fields have proper values
        return ensureSettingsStructure(parsed);
      }
      return getDefaultSettings();
    } catch (error) {
      console.error('Error loading local settings:', error);
      return getDefaultSettings();
    }
  };

  // Ensure settings have proper structure and no undefined values
  const ensureSettingsStructure = (settingsData) => {
    const defaultSettings = getDefaultSettings();
    
    // Deep merge to ensure all fields exist
    const ensuredSettings = JSON.parse(JSON.stringify(defaultSettings));
    
    // Recursively merge settings
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
    
    return mergeDeep(ensuredSettings, settingsData);
  };

  // Save settings to localStorage
  const saveLocalSettings = (settingsData) => {
    try {
      const ensuredSettings = ensureSettingsStructure(settingsData);
      localStorage.setItem('appSettings', JSON.stringify(ensuredSettings));
      setSettings(ensuredSettings);
      console.log('💾 Saved sucessfully database');
      return { success: true, data: ensuredSettings };
    } catch (error) {
      console.error('Error saving local settings:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if backend is available
  const checkBackendAvailability = async () => {
    try {
      console.log('🔍 Checking backend availability...');
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const isAvailable = response.ok;
      setBackendAvailable(isAvailable);
      console.log('🔍 Backend availability:', isAvailable);
      return isAvailable;
    } catch (error) {
      console.warn('⚠️ Backend is not available:', error.message);
      setBackendAvailable(false);
      return false;
    }
  };

  // Safe settings merge function
  const mergeSettings = (currentSettings, section, sectionData) => {
    const safeCurrentSettings = currentSettings || getDefaultSettings();
    const currentSection = safeCurrentSettings[section] || {};
    
    // Clean section data to remove undefined values
    const cleanSectionData = Object.fromEntries(
      Object.entries(sectionData).filter(([_, value]) => value !== undefined && value !== null)
    );
    
    return {
      ...safeCurrentSettings,
      [section]: {
        ...currentSection,
        ...cleanSectionData
      }
    };
  };

  // Fetch settings from backend or localStorage
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const authenticated = checkAuthentication();
      const backendAvailable = await checkBackendAvailability();

      console.log('🔄 Fetch settings conditions:', {
        authenticated,
        backendAvailable
      });

      if (authenticated && backendAvailable) {
        // Try to fetch from backend
        try {
          console.log('🔄 Fetching settings from backend...');
          const response = await settingsService.getSettings();
          
          if (response && response.success) {
            const ensuredSettings = ensureSettingsStructure(response.data);
            setSettings(ensuredSettings);
            console.log('✅ Settings loaded from backend:', ensuredSettings);
            
            // Also save to localStorage as backup
            saveLocalSettings(ensuredSettings);
          } else {
            throw new Error(response?.message || 'Invalid response from backend');
          }
        } catch (backendError) {
          console.warn('⚠️ Backend fetch failed, using local settings:', backendError.message);
          const localSettings = loadLocalSettings();
          setSettings(localSettings);
        }
      } else {
        // Use local settings
        console.log('🔐 Using local settings - backend not available or not authenticated');
        const localSettings = loadLocalSettings();
        setSettings(localSettings);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.message);
      
      // Fallback to local settings
      const localSettings = loadLocalSettings();
      setSettings(localSettings);
    } finally {
      setLoading(false);
    }
  };

  // Update settings (backend or local) - FIXED VERSION
  const updateSettings = async (section, sectionData) => {
    try {
      setError(null);
      const authenticated = checkAuthentication();
      const backendAvailable = await checkBackendAvailability();

      console.log('🔄 Update settings conditions:', {
        section,
        sectionData,
        authenticated,
        backendAvailable
      });

      let updatedSettings;

      if (authenticated && backendAvailable) {
        // Try to update backend
        try {
          console.log(`🔄 Updating section '${section}' in backend...`, sectionData);
          const response = await settingsService.updateSection(section, sectionData);
          
          if (response && response.success) {
            updatedSettings = response.data;
            const ensuredSettings = ensureSettingsStructure(updatedSettings);
            setSettings(ensuredSettings);
            console.log('✅ Settings updated in backend:', ensuredSettings);
            
            // Also update localStorage
            saveLocalSettings(ensuredSettings);
            return { success: true, data: ensuredSettings, source: 'backend' };
          } else {
            throw new Error(response?.message || 'Backend update failed');
          }
        } catch (backendError) {
          console.warn('⚠️ Backend update failed, saving locally:', backendError.message);
          // Fallback to local storage
          const currentSettings = settings || loadLocalSettings();
          updatedSettings = mergeSettings(currentSettings, section, sectionData);
          const result = saveLocalSettings(updatedSettings);
          return { ...result, source: 'local' };
        }
      } else {
        // Update local storage only
        console.log('🔐 Saving to local storage only - backend not available');
        const currentSettings = settings || loadLocalSettings();
        updatedSettings = mergeSettings(currentSettings, section, sectionData);
        const result = saveLocalSettings(updatedSettings);
        return { ...result, source: 'local' };
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to update settings';
      console.error('Update settings error:', err);
      setError(errorMsg);
      return { success: false, error: errorMsg, source: 'error' };
    }
  };

  // Reset settings
  const resetSettings = async () => {
    try {
      setError(null);
      const authenticated = checkAuthentication();
      const backendAvailable = await checkBackendAvailability();
      const defaultSettings = getDefaultSettings();

      if (authenticated && backendAvailable) {
        try {
          console.log('🔄 Resetting settings in backend...');
          const response = await settingsService.resetSettings();
          
          if (response && response.success) {
            const ensuredSettings = ensureSettingsStructure(response.data);
            setSettings(ensuredSettings);
            console.log('✅ Settings reset in backend');
            
            // Also update localStorage
            saveLocalSettings(ensuredSettings);
            return { success: true, data: ensuredSettings, source: 'backend' };
          } else {
            throw new Error(response?.message || 'Backend reset failed');
          }
        } catch (backendError) {
          console.warn('⚠️ Backend reset failed, resetting locally:', backendError.message);
          return { ...saveLocalSettings(defaultSettings), source: 'local' };
        }
      } else {
        console.log('🔐 Resetting local settings');
        return { ...saveLocalSettings(defaultSettings), source: 'local' };
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to reset settings';
      console.error('Reset settings error:', err);
      setError(errorMsg);
      return { success: false, error: errorMsg, source: 'error' };
    }
  };

  // Update entire settings object
  const updateAllSettings = async (newSettings) => {
    try {
      setError(null);
      const authenticated = checkAuthentication();
      const backendAvailable = await checkBackendAvailability();

      if (authenticated && backendAvailable) {
        try {
          console.log('🔄 Updating all settings in backend...');
          const response = await settingsService.updateSettings(newSettings);
          
          if (response && response.success) {
            const ensuredSettings = ensureSettingsStructure(response.data);
            setSettings(ensuredSettings);
            console.log('✅ All settings updated in backend');
            
            // Also update localStorage
            saveLocalSettings(ensuredSettings);
            return { success: true, data: ensuredSettings, source: 'backend' };
          } else {
            throw new Error(response?.message || 'Backend update failed');
          }
        } catch (backendError) {
          console.warn('⚠️ Backend update failed, saving locally:', backendError.message);
          const ensuredSettings = ensureSettingsStructure(newSettings);
          return { ...saveLocalSettings(ensuredSettings), source: 'local' };
        }
      } else {
        console.log('🔐 Saving all settings to local storage');
        const ensuredSettings = ensureSettingsStructure(newSettings);
        return { ...saveLocalSettings(ensuredSettings), source: 'local' };
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to update all settings';
      console.error('Update all settings error:', err);
      setError(errorMsg);
      return { success: false, error: errorMsg, source: 'error' };
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  // Initial settings load
  useEffect(() => {
    fetchSettings();
  }, []);

  const value = {
    settings: settings || getDefaultSettings(), // Always return proper settings object
    loading,
    error,
    isAuthenticated,
    backendAvailable,
    updateSettings,
    updateAllSettings,
    resetSettings,
    refetchSettings: fetchSettings,
    checkAuthentication,
    clearError
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};