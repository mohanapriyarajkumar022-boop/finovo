// src/pages/settings.jsx - UPDATED VERSION WITH GLOBAL PROFILE IMAGE
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import './Settings.css';

const Settings = () => {
  const { 
    settings, 
    updateSettings, 
    resetSettings, 
    loading, 
    error, 
    refetchSettings, 
    checkAuthentication, 
    isAuthenticated,
    getCurrentUserEmail: getEmailFromContext,
    getCurrentUserName: getNameFromContext,
    getAppVersion: getVersionFromContext
  } = useSettings();
  
  const { t, language, updateLanguage } = useLanguage();
  const { theme, updateTheme, updateThemeSettings } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [saveStatus, setSaveStatus] = useState('');
  const [localSettings, setLocalSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showTenantIdModal, setShowTenantIdModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [tenantIdData, setTenantIdData] = useState({
    currentTenantId: '',
    newTenantId: '',
    confirmTenantId: ''
  });
  const [twoFactorData, setTwoFactorData] = useState({
    step: 'pin-setup',
    pin: '',
    confirmPin: ''
  });
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [requires2FAVerification, setRequires2FAVerification] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    isEnabled: false,
    needsVerification: false,
    nextVerificationDate: null,
    lastVerification: null
  });
  const [isChecking2FA, setIsChecking2FA] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentTenantId, setCurrentTenantId] = useState('');
  const [isGeneratingTenantId, setIsGeneratingTenantId] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userTenantId, setUserTenantId] = useState('');
  const [twoFactorPIN, setTwoFactorPIN] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [appVersion, setAppVersion] = useState('3.2.0');
  const [databaseStatus, setDatabaseStatus] = useState('Connected');

  // ✅ Define valid font sizes that match backend enum
  const VALID_FONT_SIZES = {
    'small': '14px',
    'medium': '16px',
    'large': '18px',
    'xlarge': '20px'
  };

  // ✅ Get current user email from localStorage (set during login)
  const getCurrentUserEmail = () => {
    const storedEmail = localStorage.getItem('userEmail');
    
    if (!storedEmail) {
      const emailFromContext = getEmailFromContext();
      if (emailFromContext) {
        localStorage.setItem('userEmail', emailFromContext);
        return emailFromContext;
      }
      return '';
    }
    
    return storedEmail;
  };

  // ✅ Get current user name
  const getCurrentUserName = () => {
    const storedName = localStorage.getItem('userName');
    
    if (!storedName) {
      const nameFromContext = getNameFromContext();
      if (nameFromContext) {
        localStorage.setItem('userName', nameFromContext);
        return nameFromContext;
      }
      return '';
    }
    
    return storedName;
  };

  // ✅ Get current tenant ID
  const getCurrentTenantId = () => {
    console.log('🔍 Checking for tenant ID...');
    
    const storedTenantId = localStorage.getItem('tenantId');
    console.log('📦 localStorage tenantId:', storedTenantId);
    
    if (storedTenantId && /^\d{6}$/.test(storedTenantId)) {
      console.log('✅ Found valid 6-digit tenant ID in localStorage:', storedTenantId);
      return storedTenantId;
    }
    
    if (storedTenantId === 'default-tenant') {
      console.log('⚠️ Found default-tenant, checking backend...');
      
      if (settings && settings.tenantId) {
        const backendTenantId = settings.tenantId;
        console.log('🔗 Backend tenantId:', backendTenantId);
        
        if (/^\d{6}$/.test(backendTenantId)) {
          localStorage.setItem('tenantId', backendTenantId);
          console.log('✅ Using backend 6-digit tenant ID:', backendTenantId);
          return backendTenantId;
        }
      }
      
      return '';
    }
    
    if (settings && settings.tenantId) {
      const backendTenantId = settings.tenantId;
      console.log('🔗 Backend tenantId from settings:', backendTenantId);
      
      if (/^\d{6}$/.test(backendTenantId)) {
        localStorage.setItem('tenantId', backendTenantId);
        console.log('✅ Using 6-digit tenant ID from settings:', backendTenantId);
        return backendTenantId;
      }
      
      if (backendTenantId === 'default-tenant') {
        return '';
      }
    }
    
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        if (parsedUserData.tenantId && /^\d{6}$/.test(parsedUserData.tenantId)) {
          localStorage.setItem('tenantId', parsedUserData.tenantId);
          console.log('✅ Using tenant ID from userData:', parsedUserData.tenantId);
          return parsedUserData.tenantId;
        }
      } catch (e) {
        console.error('Error parsing userData:', e);
      }
    }
    
    console.log('❌ No valid 6-digit tenant ID found');
    return '';
  };

  // ✅ Get last updated date from settings
  const getLastUpdatedDate = () => {
    if (settings && settings.updatedAt) {
      try {
        const date = new Date(settings.updatedAt);
        return date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
      } catch (e) {
        console.error('Error parsing updatedAt:', e);
      }
    }
    
    // Fallback to localStorage or current date
    const lastUpdate = localStorage.getItem('lastSettingsUpdate');
    if (lastUpdate) {
      try {
        const date = new Date(lastUpdate);
        return date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
      } catch (e) {
        console.error('Error parsing lastSettingsUpdate:', e);
      }
    }
    
    // If no data available, use current month/year
    const currentDate = new Date();
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  // ✅ Get app version from context or package.json
  const getAppVersion = () => {
    if (getVersionFromContext) {
      const versionFromContext = getVersionFromContext();
      if (versionFromContext) {
        return versionFromContext;
      }
    }
    
    // Check localStorage for version
    const storedVersion = localStorage.getItem('appVersion');
    if (storedVersion) {
      return storedVersion;
    }
    
    // Fallback to default
    return '3.2.0';
  };

  // ✅ Check database status
  const checkDatabaseStatus = () => {
    const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
    const isConnected = !!token && isAuthenticated;
    
    return isConnected ? '✅ Connected' : '❌ Not Connected';
  };

  // ✅ Check authentication status
  const checkAuth = () => {
    const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const isAuth = !!token && !!userId;
    
    return isAuth;
  };

  // ✅ Validate password strength
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  };

  // ✅ Initialize user data from localStorage
  useEffect(() => {
    const loadUserData = () => {
      const email = getCurrentUserEmail();
      const tenantId = getCurrentTenantId();
      
      console.log('👤 Loading user data:', { email, tenantId });
      
      if (email) {
        setUserEmail(email);
        setCurrentUserEmail(email);
      }
      
      if (tenantId) {
        setUserTenantId(tenantId);
        setCurrentTenantId(tenantId);
      }
    };
    
    loadUserData();
  }, []);

  // ✅ NEW FUNCTION: Apply profile image globally across the app
  const applyGlobalProfileImage = (imageUrl) => {
    console.log('🌍 Applying profile image globally:', imageUrl);
    
    // Store in localStorage for persistence across sessions
    if (imageUrl) {
      localStorage.setItem('globalProfileImage', imageUrl);
      sessionStorage.setItem('globalProfileImage', imageUrl);
    } else {
      localStorage.removeItem('globalProfileImage');
      sessionStorage.removeItem('globalProfileImage');
    }
    
    // Dispatch a custom event so other components can react to profile image changes
    const profileImageEvent = new CustomEvent('profile-image-updated', {
      detail: { imageUrl }
    });
    window.dispatchEvent(profileImageEvent);
    
    // Also set as CSS variable for easy access in CSS
    const root = document.documentElement;
    if (imageUrl) {
      root.style.setProperty('--global-profile-image', `url(${imageUrl})`);
    } else {
      root.style.removeProperty('--global-profile-image');
    }
    
    console.log('✅ Global profile image applied');
  };

  // ✅ FIXED: Initialize local settings and apply global theme and accessibility
  useEffect(() => {
    const initializeSettings = async () => {
      if (settings) {
        console.log('🔧 Initializing settings from database:', settings);
        console.log('🔐 2FA Status from database:', settings.privacy?.twoFactorAuth);
        console.log('🔐 2FA PIN from database:', settings.privacy?.twoFactorPIN);
        
        const userEmail = getCurrentUserEmail();
        const userName = getCurrentUserName();
        const tenantId = getCurrentTenantId();
        
        console.log('📊 User info:', { userEmail, userName, tenantId });
        
        setCurrentUserEmail(userEmail);
        setCurrentUserName(userName);
        setCurrentTenantId(tenantId);
        setUserEmail(userEmail);
        setUserTenantId(tenantId);
        
        if (settings.tenantId && /^\d{6}$/.test(settings.tenantId)) {
          localStorage.setItem('tenantId', settings.tenantId);
          setUserTenantId(settings.tenantId);
          setCurrentTenantId(settings.tenantId);
          console.log('✅ Updated tenant ID from database:', settings.tenantId);
        }
        
        const initialSettings = JSON.parse(JSON.stringify(settings));
        
        if (initialSettings.profile) {
          initialSettings.profile.email = userEmail;
          initialSettings.profile.name = userName || initialSettings.profile.name || '';
          initialSettings.profile.phone = initialSettings.profile.phone || '';
          initialSettings.profile.bio = initialSettings.profile.bio || '';
          initialSettings.profile.profilePhoto = initialSettings.profile.profilePhoto || '';
          initialSettings.profile.profilePhotoUrl = initialSettings.profile.profilePhotoUrl || '';
        }
        
        // ✅ CRITICAL FIX: Initialize and apply global profile image
        let profileImageUrl = '';
        if (initialSettings.profile?.profilePhotoUrl) {
          profileImageUrl = initialSettings.profile.profilePhotoUrl;
          setImagePreview(profileImageUrl);
        } else if (initialSettings.profile?.profilePhoto) {
          const photo = initialSettings.profile.profilePhoto;
          if (typeof photo === 'string' && photo.length < 50000) {
            profileImageUrl = photo;
            setImagePreview(photo);
          } else if (typeof photo === 'string' && photo.length > 50000) {
            console.warn('⚠️ Profile photo too large, using placeholder');
            setImagePreview('');
          }
        }
        
        // ✅ Apply the profile image globally
        if (profileImageUrl) {
          applyGlobalProfileImage(profileImageUrl);
        }
        
        // ✅ CRITICAL FIX: Initialize 2FA status from database FIRST
        const twoFactorEnabled = initialSettings.privacy?.twoFactorAuth || false;
        const twoFactorPIN = initialSettings.privacy?.twoFactorPIN || '';
        
        console.log('🔐 Initializing 2FA from database:', { 
          enabled: twoFactorEnabled, 
          hasPIN: !!twoFactorPIN 
        });
        
        setTwoFactorStatus({
          isEnabled: twoFactorEnabled,
          needsVerification: false,
          nextVerificationDate: twoFactorEnabled ? 
            new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) : null,
          lastVerification: twoFactorEnabled ? new Date() : null
        });
        
        setTwoFactorPIN(twoFactorPIN);
        
        // Ensure the local settings reflect the correct 2FA state
        if (initialSettings.privacy) {
          initialSettings.privacy.twoFactorAuth = twoFactorEnabled;
          initialSettings.privacy.twoFactorPIN = twoFactorPIN;
        }
        
        // ✅ Initialize accessibility settings from database
        if (initialSettings.accessibility) {
          console.log('♿ Initializing accessibility settings:', initialSettings.accessibility);
          applyAccessibilitySettings(initialSettings.accessibility);
        }
        
        setLocalSettings(initialSettings);
        
        // ✅ Initialize About section data
        setAppVersion(getAppVersion());
        setLastUpdated(getLastUpdatedDate());
        setDatabaseStatus(checkDatabaseStatus());
        
        if (initialSettings.theme) {
          console.log('🎨 Applying global theme from database:', initialSettings.theme);
          applyGlobalThemeWithSettings(initialSettings.theme);
        }
        
        // Apply performance settings
        if (initialSettings.performance) {
          console.log('⚡ Applying global performance settings:', initialSettings.performance);
          applyPerformanceSettings(initialSettings.performance);
        }
        
        setIsChecking2FA(false);
      }
    };

    initializeSettings();
  }, [settings, isAuthenticated]);

  // ✅ Apply global theme with settings
  const applyGlobalThemeWithSettings = (themeSettings) => {
    console.log('🎨 Applying global theme settings:', themeSettings);
    
    const root = document.documentElement;
    const body = document.body;
    const appRoot = document.getElementById('root') || document.querySelector('.app') || body;
    
    if (themeSettings.mode) {
      const mode = themeSettings.mode === 'auto' ? 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
        themeSettings.mode;
      
      root.setAttribute('data-theme', mode);
      body.setAttribute('data-theme', mode);
      body.classList.toggle('dark-mode', mode === 'dark');
      body.classList.toggle('light-mode', mode === 'light');
      
      document.querySelectorAll('[data-theme]').forEach(el => {
        if (el !== root && el !== body) {
          el.setAttribute('data-theme', mode);
        }
      });
    }
    
    if (themeSettings.primaryColor) {
      const primaryColor = themeSettings.primaryColor;
      
      root.style.setProperty('--primary-color', primaryColor);
      root.style.setProperty('--primary-color-light', lightenColor(primaryColor, 30));
      root.style.setProperty('--primary-color-dark', darkenColor(primaryColor, 20));
      root.style.setProperty('--primary-color-hover', lightenColor(primaryColor, 15));
      root.style.setProperty('--primary-color-active', darkenColor(primaryColor, 10));
      
      body.style.setProperty('--primary-color', primaryColor);
      body.style.setProperty('--primary-color-light', lightenColor(primaryColor, 30));
      body.style.setProperty('--primary-color-dark', darkenColor(primaryColor, 20));
      body.style.setProperty('--primary-color-hover', lightenColor(primaryColor, 15));
      body.style.setProperty('--primary-color-active', darkenColor(primaryColor, 10));
      
      document.querySelectorAll('button, a, .btn, input[type="button"], input[type="submit"]').forEach(el => {
        el.style.setProperty('--primary-color', primaryColor, 'important');
      });
    }
    
    if (themeSettings.fontSize) {
      const fontSizeMap = VALID_FONT_SIZES;
      const fontSizeKey = themeSettings.fontSize.toLowerCase();
      const baseFontSize = fontSizeMap[fontSizeKey] || '16px';
      
      console.log(`📏 Applying font size: ${fontSizeKey} = ${baseFontSize}`);
      
      root.style.setProperty('--font-size-base', baseFontSize);
      root.style.setProperty('--font-size', baseFontSize);
      root.style.setProperty('--base-font-size', baseFontSize);
      root.style.setProperty('--text-base', baseFontSize);
      
      root.style.setProperty('--font-size-sm', `calc(${baseFontSize} * 0.875)`);
      root.style.setProperty('--font-size-lg', `calc(${baseFontSize} * 1.125)`);
      root.style.setProperty('--font-size-xl', `calc(${baseFontSize} * 1.25)`);
      root.style.setProperty('--font-size-xs', `calc(${baseFontSize} * 0.75)`);
      root.style.setProperty('--font-size-2xl', `calc(${baseFontSize} * 1.5)`);
      root.style.setProperty('--font-size-3xl', `calc(${baseFontSize} * 1.875)`);
      root.style.setProperty('--font-size-4xl', `calc(${baseFontSize} * 2.25)`);
      
      root.style.setProperty('--font-size-h1', `calc(${baseFontSize} * 2.5)`);
      root.style.setProperty('--font-size-h2', `calc(${baseFontSize} * 2)`);
      root.style.setProperty('--font-size-h3', `calc(${baseFontSize} * 1.75)`);
      root.style.setProperty('--font-size-h4', `calc(${baseFontSize} * 1.5)`);
      root.style.setProperty('--font-size-h5', `calc(${baseFontSize} * 1.25)`);
      root.style.setProperty('--font-size-h6', baseFontSize);
      
      document.documentElement.style.fontSize = baseFontSize;
      document.body.style.fontSize = baseFontSize;
      
      if (appRoot) {
        appRoot.style.fontSize = baseFontSize;
      }
      
      setTimeout(() => {
        const textElements = document.querySelectorAll(
          'body, div, span, p, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, label, li, td, th, small, strong, em, b, i'
        );
        
        textElements.forEach(el => {
          if (el.tagName.match(/^(INPUT|TEXTAREA|SELECT|BUTTON)$/i)) {
            if (el.parentElement) {
              el.parentElement.style.fontSize = baseFontSize;
            }
          } else {
            el.style.fontSize = baseFontSize;
          }
        });
      }, 100);
    }
    
    if (themeSettings.fontFamily) {
      let fontFamily = themeSettings.fontFamily;
      
      console.log(`🔤 Applying font family: ${fontFamily}`);
      
      if (fontFamily.includes('Serif') || ['Georgia', 'Times New Roman'].includes(fontFamily)) {
        fontFamily = `${fontFamily}, Georgia, Times, 'Times New Roman', serif`;
      } else if (fontFamily.includes('Mono') || ['Courier New', 'monospace'].includes(fontFamily)) {
        fontFamily = `${fontFamily}, 'Courier New', Courier, monospace`;
      } else if (fontFamily === 'SF Pro Display' || fontFamily.includes('Apple')) {
        fontFamily = `${fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif`;
      } else if (fontFamily === 'Segoe UI') {
        fontFamily = `${fontFamily}, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
      } else {
        fontFamily = `${fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`;
      }
      
      root.style.setProperty('--font-family', fontFamily);
      root.style.setProperty('--font-family-base', fontFamily);
      root.style.setProperty('--font-family-sans', fontFamily);
      root.style.setProperty('--font-family-serif', "'Georgia', 'Times New Roman', serif");
      root.style.setProperty('--font-family-mono', "'Courier New', Courier, monospace");
      
      document.documentElement.style.fontFamily = fontFamily;
      document.body.style.fontFamily = fontFamily;
      
      if (appRoot) {
        appRoot.style.fontFamily = fontFamily;
      }
      
      setTimeout(() => {
        const textElements = document.querySelectorAll(
          'body, div, span, p, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, label, li, td, th, small, strong, em, b, i'
        );
        
        textElements.forEach(el => {
          if (!el.tagName.match(/^(INPUT|TEXTAREA|SELECT|BUTTON)$/i)) {
            el.style.fontFamily = fontFamily;
          }
        });
      }, 100);
    }
    
    localStorage.setItem('appTheme', JSON.stringify(themeSettings));
    
    const themeChangeEvent = new CustomEvent('theme-change', { 
      detail: themeSettings 
    });
    window.dispatchEvent(themeChangeEvent);
    
    if (themeSettings.fontSize) {
      const fontSizeEvent = new CustomEvent('fontsize-change', {
        detail: { fontSize: themeSettings.fontSize }
      });
      window.dispatchEvent(fontSizeEvent);
    }
    
    if (themeSettings.fontFamily) {
      const fontFamilyEvent = new CustomEvent('fontfamily-change', {
        detail: { fontFamily: themeSettings.fontFamily }
      });
      window.dispatchEvent(fontFamilyEvent);
    }
    
    console.log('✅ Global theme applied:', themeSettings);
  };

  // ✅ Apply performance settings globally
  const applyPerformanceSettings = (performanceSettings) => {
    console.log('⚡ Applying global performance settings:', performanceSettings);
    
    const root = document.documentElement;
    const body = document.body;
    
    if (performanceSettings) {
      // Apply Cache settings
      if (performanceSettings.enableCache) {
        // Enable aggressive caching
        localStorage.setItem('enableCache', 'true');
        sessionStorage.setItem('enableCache', 'true');
        body.classList.add('cache-enabled');
        root.classList.add('cache-enabled');
        
        // Set cache headers for API calls
        window.enableAPICache = true;
      } else {
        localStorage.setItem('enableCache', 'false');
        sessionStorage.setItem('enableCache', 'false');
        body.classList.remove('cache-enabled');
        root.classList.remove('cache-enabled');
        window.enableAPICache = false;
      }
      
      // Apply Auto Save settings
      if (performanceSettings.autoSave) {
        localStorage.setItem('autoSave', 'true');
        sessionStorage.setItem('autoSave', 'true');
        body.classList.add('auto-save-enabled');
        root.classList.add('auto-save-enabled');
        
        // Enable auto-save functionality globally
        window.enableAutoSave = true;
      } else {
        localStorage.setItem('autoSave', 'false');
        sessionStorage.setItem('autoSave', 'false');
        body.classList.remove('auto-save-enabled');
        root.classList.remove('auto-save-enabled');
        window.enableAutoSave = false;
      }
      
      // Apply Low Data Mode
      if (performanceSettings.lowDataMode) {
        localStorage.setItem('lowDataMode', 'true');
        sessionStorage.setItem('lowDataMode', 'true');
        body.classList.add('low-data-mode');
        root.classList.add('low-data-mode');
        
        // Reduce image quality
        document.querySelectorAll('img').forEach(img => {
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
        });
        
        // Disable heavy animations
        document.querySelectorAll('video, .video-container, .lottie-animation').forEach(el => {
          el.style.display = 'none';
        });
        
        // Enable low data mode globally
        window.lowDataMode = true;
      } else {
        localStorage.setItem('lowDataMode', 'false');
        sessionStorage.setItem('lowDataMode', 'false');
        body.classList.remove('low-data-mode');
        root.classList.remove('low-data-mode');
        window.lowDataMode = false;
      }
    }
    
    // Dispatch performance settings change event
    const performanceChangeEvent = new CustomEvent('performance-change', {
      detail: performanceSettings
    });
    window.dispatchEvent(performanceChangeEvent);
    
    console.log('✅ Global performance settings applied:', performanceSettings);
  };

  // ✅ Apply accessibility settings immediately - FIXED COMPLETE VERSION
  const applyAccessibilitySettings = (accessibilitySettings) => {
    console.log('♿ Applying accessibility settings:', accessibilitySettings);
    
    const root = document.documentElement;
    const body = document.body;
    const appRoot = document.getElementById('root') || document.querySelector('.app') || body;
    
    if (!accessibilitySettings) {
      console.log('⚠️ No accessibility settings provided, using defaults');
      accessibilitySettings = {
        highContrast: false,
        reduceMotion: false,
        screenReader: false,
        keyboardNavigation: false
      };
    }
    
    // ✅ Apply High Contrast
    if (accessibilitySettings.highContrast) {
      console.log('🎨 Applying high contrast mode');
      
      // Add high contrast classes
      body.classList.add('high-contrast');
      root.classList.add('high-contrast');
      if (appRoot) appRoot.classList.add('high-contrast');
      
      // Set high contrast CSS variables
      root.style.setProperty('--high-contrast-bg', '#000000');
      root.style.setProperty('--high-contrast-text', '#ffffff');
      root.style.setProperty('--high-contrast-border', '#ffff00');
      root.style.setProperty('--high-contrast-primary', '#00ffff');
      root.style.setProperty('--high-contrast-secondary', '#ff00ff');
      
      body.style.setProperty('--high-contrast-bg', '#000000');
      body.style.setProperty('--high-contrast-text', '#ffffff');
      body.style.setProperty('--high-contrast-border', '#ffff00');
      body.style.setProperty('--high-contrast-primary', '#00ffff');
      body.style.setProperty('--high-contrast-secondary', '#ff00ff');
      
      // Apply high contrast styles to all elements
      setTimeout(() => {
        document.querySelectorAll('*').forEach(el => {
          el.style.backgroundColor = el.tagName === 'BODY' ? '#000000' : 'inherit';
          el.style.color = '#ffffff';
          el.style.borderColor = el.tagName.match(/^(BUTTON|INPUT|TEXTAREA|SELECT|A)$/i) ? '#ffff00' : 'inherit';
        });
      }, 50);
      
      // Store in localStorage for persistence
      localStorage.setItem('highContrastEnabled', 'true');
    } else {
      console.log('🎨 Removing high contrast mode');
      
      // Remove high contrast classes
      body.classList.remove('high-contrast');
      root.classList.remove('high-contrast');
      if (appRoot) appRoot.classList.remove('high-contrast');
      
      // Remove high contrast CSS variables
      root.style.removeProperty('--high-contrast-bg');
      root.style.removeProperty('--high-contrast-text');
      root.style.removeProperty('--high-contrast-border');
      root.style.removeProperty('--high-contrast-primary');
      root.style.removeProperty('--high-contrast-secondary');
      
      body.style.removeProperty('--high-contrast-bg');
      body.style.removeProperty('--high-contrast-text');
      body.style.removeProperty('--high-contrast-border');
      body.style.removeProperty('--high-contrast-primary');
      body.style.removeProperty('--high-contrast-secondary');
      
      // Remove from localStorage
      localStorage.removeItem('highContrastEnabled');
    }
    
    // ✅ Apply Reduce Motion
    if (accessibilitySettings.reduceMotion) {
      console.log('🎬 Applying reduced motion');
      
      // Add reduce motion classes
      body.classList.add('reduce-motion');
      root.classList.add('reduce-motion');
      if (appRoot) appRoot.classList.add('reduce-motion');
      
      // Set CSS variable for reduced motion
      root.style.setProperty('--animation-duration', '0.01s');
      root.style.setProperty('--transition-duration', '0.01s');
      
      // Disable all CSS animations and transitions
      const style = document.createElement('style');
      style.id = 'reduce-motion-styles';
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01s !important;
          scroll-behavior: auto !important;
        }
        
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01s !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01s !important;
            scroll-behavior: auto !important;
          }
        }
      `;
      
      // Remove existing style if present
      const existingStyle = document.getElementById('reduce-motion-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      document.head.appendChild(style);
      
      // Store in localStorage for persistence
      localStorage.setItem('reduceMotionEnabled', 'true');
    } else {
      console.log('🎬 Removing reduced motion');
      
      // Remove reduce motion classes
      body.classList.remove('reduce-motion');
      root.classList.remove('reduce-motion');
      if (appRoot) appRoot.classList.remove('reduce-motion');
      
      // Remove CSS variable
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
      
      // Remove the style element
      const style = document.getElementById('reduce-motion-styles');
      if (style) {
        style.remove();
      }
      
      // Remove from localStorage
      localStorage.removeItem('reduceMotionEnabled');
    }
    
    // ✅ Apply Screen Reader Support
    if (accessibilitySettings.screenReader) {
      console.log('📢 Enhancing screen reader support');
      
      // Add screen reader optimized classes
      body.classList.add('screen-reader-optimized');
      root.classList.add('screen-reader-optimized');
      if (appRoot) appRoot.classList.add('screen-reader-optimized');
      
      // Set ARIA attributes
      body.setAttribute('aria-live', 'polite');
      body.setAttribute('aria-atomic', 'true');
      body.setAttribute('aria-relevant', 'additions text');
      
      // Add screen reader only styles for hidden content
      const style = document.createElement('style');
      style.id = 'screen-reader-styles';
      style.textContent = `
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        
        [role="button"], button, a, input, select, textarea {
          outline: 2px solid transparent;
          outline-offset: 2px;
        }
        
        :focus {
          outline: 3px solid #3b82f6 !important;
          outline-offset: 2px !important;
        }
        
        .screen-reader-optimized * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `;
      
      // Remove existing style if present
      const existingStyle = document.getElementById('screen-reader-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      document.head.appendChild(style);
      
      // Add skip to content link
      let skipLink = document.getElementById('skip-to-content');
      if (!skipLink) {
        skipLink = document.createElement('a');
        skipLink.id = 'skip-to-content';
        skipLink.href = '#main-content';
        skipLink.className = 'sr-only';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);
      }
      
      // Ensure all interactive elements have proper ARIA labels
      setTimeout(() => {
        document.querySelectorAll('button:not([aria-label]), a:not([aria-label])').forEach(el => {
          if (!el.getAttribute('aria-label') && el.textContent.trim()) {
            el.setAttribute('aria-label', el.textContent.trim());
          }
        });
        
        document.querySelectorAll('img:not([alt])').forEach(el => {
          el.setAttribute('alt', '');
        });
      }, 100);
      
      // Store in localStorage for persistence
      localStorage.setItem('screenReaderOptimized', 'true');
    } else {
      console.log('📢 Removing screen reader optimizations');
      
      // Remove screen reader classes
      body.classList.remove('screen-reader-optimized');
      root.classList.remove('screen-reader-optimized');
      if (appRoot) appRoot.classList.remove('screen-reader-optimized');
      
      // Remove ARIA attributes
      body.removeAttribute('aria-live');
      body.removeAttribute('aria-atomic');
      body.removeAttribute('aria-relevant');
      
      // Remove the style element
      const style = document.getElementById('screen-reader-styles');
      if (style) {
        style.remove();
      }
      
      // Remove skip link
      const skipLink = document.getElementById('skip-to-content');
      if (skipLink) {
        skipLink.remove();
      }
      
      // Remove from localStorage
      localStorage.removeItem('screenReaderOptimized');
    }
    
    // ✅ Apply Keyboard Navigation
    if (accessibilitySettings.keyboardNavigation) {
      console.log('⌨️ Enhancing keyboard navigation');
      
      // Add keyboard navigation classes
      body.classList.add('keyboard-navigation');
      root.classList.add('keyboard-navigation');
      if (appRoot) appRoot.classList.add('keyboard-navigation');
      
      // Set CSS variables for focus styles
      root.style.setProperty('--focus-ring-color', '#3b82f6');
      root.style.setProperty('--focus-ring-width', '3px');
      root.style.setProperty('--focus-ring-offset', '2px');
      
      // Add keyboard navigation styles
      const style = document.createElement('style');
      style.id = 'keyboard-navigation-styles';
      style.textContent = `
        .keyboard-navigation *:focus {
          outline: var(--focus-ring-width, 3px) solid var(--focus-ring-color, #3b82f6) !important;
          outline-offset: var(--focus-ring-offset, 2px) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5) !important;
        }
        
        .keyboard-navigation button:focus,
        .keyboard-navigation a:focus,
        .keyboard-navigation input:focus,
        .keyboard-navigation select:focus,
        .keyboard-navigation textarea:focus {
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        
        .keyboard-navigation [tabindex]:focus {
          position: relative;
          z-index: 9999;
        }
        
        .keyboard-navigation .focus-visible {
          outline: 3px solid #3b82f6 !important;
          outline-offset: 2px !important;
        }
      `;
      
      // Remove existing style if present
      const existingStyle = document.getElementById('keyboard-navigation-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      document.head.appendChild(style);
      
      // Add event listener for keyboard navigation
      const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
          body.classList.add('keyboard-user');
        }
      };
      
      const handleMouseDown = () => {
        body.classList.remove('keyboard-user');
      };
      
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleMouseDown);
      
      // Store event listeners for cleanup
      window.keyboardNavHandlers = {
        keydown: handleKeyDown,
        mousedown: handleMouseDown
      };
      
      // Store in localStorage for persistence
      localStorage.setItem('keyboardNavigationEnabled', 'true');
    } else {
      console.log('⌨️ Removing keyboard navigation enhancements');
      
      // Remove keyboard navigation classes
      body.classList.remove('keyboard-navigation');
      root.classList.remove('keyboard-navigation');
      if (appRoot) appRoot.classList.remove('keyboard-navigation');
      
      // Remove CSS variables
      root.style.removeProperty('--focus-ring-color');
      root.style.removeProperty('--focus-ring-width');
      root.style.removeProperty('--focus-ring-offset');
      
      // Remove the style element
      const style = document.getElementById('keyboard-navigation-styles');
      if (style) {
        style.remove();
      }
      
      // Remove event listeners
      if (window.keyboardNavHandlers) {
        document.removeEventListener('keydown', window.keyboardNavHandlers.keydown);
        document.removeEventListener('mousedown', window.keyboardNavHandlers.mousedown);
        delete window.keyboardNavHandlers;
      }
      
      // Remove keyboard-user class
      body.classList.remove('keyboard-user');
      
      // Remove from localStorage
      localStorage.removeItem('keyboardNavigationEnabled');
    }
    
    // Dispatch accessibility settings change event
    const accessibilityChangeEvent = new CustomEvent('accessibility-change', {
      detail: accessibilitySettings
    });
    window.dispatchEvent(accessibilityChangeEvent);
    
    console.log('✅ Accessibility settings applied globally:', accessibilitySettings);
  };

  // ✅ Update local setting - FIXED: Ensure accessibility sync
  const updateLocalSetting = (section, key, value) => {
    setLocalSettings(prev => {
      if (!prev) return prev;
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      };
      
      // Apply performance settings immediately when changed
      if (section === 'performance') {
        console.log('⚡ Performance setting changed:', key, value);
        applyPerformanceSettings(newSettings.performance);
      }
      
      // ✅ Apply accessibility settings immediately when changed
      if (section === 'accessibility') {
        console.log('♿ Accessibility setting changed:', key, value);
        applyAccessibilitySettings(newSettings.accessibility);
      }
      
      // ✅ FIXED: Update 2FA status when privacy.twoFactorAuth changes
      if (section === 'privacy' && key === 'twoFactorAuth') {
        console.log('🔐 2FA setting changed in UI:', value);
        setTwoFactorStatus(prevStatus => ({
          ...prevStatus,
          isEnabled: value
        }));
        
        // Also update localStorage for persistence
        if (value) {
          localStorage.setItem('twoFactorEnabled', 'true');
          localStorage.setItem('last2FAVerification', new Date().toISOString());
        } else {
          localStorage.removeItem('twoFactorEnabled');
          localStorage.removeItem('last2FAVerification');
        }
      }
      
      // ✅ Apply global profile image when profile photo changes
      if (section === 'profile' && key === 'profilePhoto') {
        console.log('🌍 Profile photo updated, applying globally:', value);
        applyGlobalProfileImage(value);
      }
      
      if (section === 'profile' && key === 'profilePhotoUrl') {
        console.log('🌍 Profile photo URL updated, applying globally:', value);
        applyGlobalProfileImage(value);
      }
      
      return newSettings;
    });
  };

  // ✅ Compress image function
  const compressImage = (file, maxWidth = 200, maxHeight = 200, quality = 0.6) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          if (compressedBase64.length > 100000) {
            const furtherCompressed = canvas.toDataURL('image/jpeg', 0.4);
            resolve(furtherCompressed);
          } else {
            resolve(compressedBase64);
          }
        };
        
        img.onerror = reject;
      };
      
      reader.onerror = reject;
    });
  };

  // ✅ Handle save settings to database - FIXED: Ensure accessibility is saved
  const handleSave = async (section) => {
    if (!localSettings || !localSettings[section]) {
      setSaveStatus('❌ No settings to save');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    const isAuth = checkAuth();
    
    if (!isAuth) {
      setSaveStatus('❌ Please log in to save settings to database');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    setSaving(true);
    
    let settingsData = { ...localSettings[section] };
    
    if (section === 'profile' && settingsData.profilePhoto) {
      const photo = settingsData.profilePhoto;
      
      if (typeof photo === 'string' && photo.length > 100000) {
        delete settingsData.profilePhoto;
        delete settingsData.profilePhotoUrl;
      }
    }
    
    if (section === 'theme' && settingsData.fontSize) {
      const validFontSizes = Object.keys(VALID_FONT_SIZES);
      if (!validFontSizes.includes(settingsData.fontSize)) {
        const fontSizeMapping = {
          'x-large': 'xlarge',
          'extra-large': 'xlarge',
          'extra large': 'xlarge',
          'xl': 'xlarge',
          'small': 'small',
          'medium': 'medium',
          'large': 'large'
        };
        
        const normalizedSize = fontSizeMapping[settingsData.fontSize.toLowerCase()] || 'medium';
        settingsData.fontSize = normalizedSize;
        console.log(`🔄 Normalized fontSize from "${settingsData.fontSize}" to "${normalizedSize}"`);
      }
    }
    
    // ✅ FIXED: For privacy section, ensure 2FA status is saved
    if (section === 'privacy') {
      console.log('💾 Saving privacy settings with 2FA:', settingsData.twoFactorAuth);
      
      // Ensure twoFactorAuth is explicitly included in the data
      if (typeof settingsData.twoFactorAuth === 'undefined') {
        settingsData.twoFactorAuth = localSettings.privacy?.twoFactorAuth || false;
      }
      
      // Include PIN if it exists
      if (twoFactorPIN) {
        settingsData.twoFactorPIN = twoFactorPIN;
      }
    }
    
    // ✅ FIXED: For accessibility section, ensure all settings are included
    if (section === 'accessibility') {
      console.log('💾 Saving accessibility settings:', settingsData);
      
      // Ensure all accessibility settings are present
      const defaultAccessibility = {
        highContrast: false,
        reduceMotion: false,
        screenReader: false,
        keyboardNavigation: false
      };
      
      settingsData = { ...defaultAccessibility, ...settingsData };
    }
    
    console.log('💾 Saving to Database - Section:', section, 'Data:', settingsData);
    
    try {
      const result = await updateSettings(section, settingsData);
      
      if (result.success) {
        setSaveStatus('✅ Settings saved successfully to database!');
        
        // ✅ Update last updated date
        localStorage.setItem('lastSettingsUpdate', new Date().toISOString());
        setLastUpdated(getLastUpdatedDate());
        
        if (result.data) {
          setLocalSettings(prev => ({
            ...prev,
            [section]: { ...prev?.[section], ...result.data[section] }
          }));
          
          // ✅ Apply global profile image when profile is saved
          if (section === 'profile' && result.data.profile) {
            const profileImageUrl = result.data.profile.profilePhotoUrl || result.data.profile.profilePhoto;
            if (profileImageUrl) {
              console.log('🌍 Applying saved profile image globally:', profileImageUrl);
              applyGlobalProfileImage(profileImageUrl);
              setImagePreview(profileImageUrl);
            }
          }
          
          // ✅ FIXED: Update 2FA status from backend response
          if (section === 'privacy' && result.data.privacy) {
            const twoFactorEnabled = result.data.privacy.twoFactorAuth || false;
            const savedPIN = result.data.privacy.twoFactorPIN || '';
            console.log('🔐 Updated 2FA status from backend:', { 
              enabled: twoFactorEnabled, 
              hasPIN: !!savedPIN 
            });
            
            setTwoFactorStatus(prev => ({
              ...prev,
              isEnabled: twoFactorEnabled
            }));
            
            if (savedPIN) {
              setTwoFactorPIN(savedPIN);
            }
            
            // Update localStorage for persistence
            if (twoFactorEnabled) {
              localStorage.setItem('twoFactorEnabled', 'true');
              localStorage.setItem('last2FAVerification', new Date().toISOString());
            } else {
              localStorage.removeItem('twoFactorEnabled');
              localStorage.removeItem('last2FAVerification');
            }
          }
          
          if (section === 'profile' && result.data.profile?.name) {
            setCurrentUserName(result.data.profile.name);
          }
          
          if (section === 'theme' && result.data.theme) {
            applyGlobalThemeWithSettings(result.data.theme);
          }
          
          // ✅ Apply accessibility settings immediately after save
          if (section === 'accessibility' && result.data.accessibility) {
            applyAccessibilitySettings(result.data.accessibility);
          }
          
          // ✅ Apply performance settings immediately after save
          if (section === 'performance' && result.data.performance) {
            applyPerformanceSettings(result.data.performance);
          }
        }
        
        await refetchSettings();
      } else {
        setSaveStatus(`❌ Database Error: ${result.error || 'Failed to save'}`);
      }
    } catch (error) {
      setSaveStatus(`❌ Connection Error: ${error.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  // ✅ Handle generate tenant ID
  const handleGenerateTenantId = async () => {
    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to generate tenant ID');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    setIsGeneratingTenantId(true);
    
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/settings/generate-tenant-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate tenant ID');
      }

      const data = await response.json();
      
      if (data.success) {
        const generatedTenantId = data.tenantId;
        setTenantIdData(prev => ({
          ...prev,
          newTenantId: generatedTenantId,
          confirmTenantId: generatedTenantId
        }));
        setSaveStatus('✅ Tenant ID generated! Please save it.');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        throw new Error(data.message || 'Failed to generate tenant ID');
      }
    } catch (error) {
      console.error('Generate tenant ID error:', error);
      setSaveStatus(`❌ ${error.message}`);
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsGeneratingTenantId(false);
    }
  };

  // ✅ Handle update tenant ID
  const handleUpdateTenantId = async () => {
    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to update tenant ID');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    const newTenantId = tenantIdData.newTenantId.trim();
    
    if (!newTenantId) {
      setSaveStatus('❌ Please enter a tenant ID');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (!/^\d{6}$/.test(newTenantId)) {
      setSaveStatus('❌ Tenant ID must be a 6-digit number (e.g., 123456)');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (newTenantId !== tenantIdData.confirmTenantId) {
      setSaveStatus('❌ Tenant IDs do not match');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    setSaving(true);
    
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/settings/tenant-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tenantId: newTenantId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSaveStatus('✅ Tenant ID updated successfully!');
        
        setCurrentTenantId(newTenantId);
        setUserTenantId(newTenantId);
        localStorage.setItem('tenantId', newTenantId);
        
        setTenantIdData({
          currentTenantId: newTenantId,
          newTenantId: '',
          confirmTenantId: ''
        });
        
        setShowTenantIdModal(false);
        
        await refetchSettings();
        
        setSaveStatus('✅ Tenant ID updated successfully!');
      } else {
        setSaveStatus(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error('Update tenant ID error:', error);
      setSaveStatus('❌ Error updating tenant ID');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Handle profile image upload - UPDATED to apply globally
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      setSaveStatus('❌ Image size should be less than 2MB');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to upload profile image');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    setSaving(true);
    
    try {
      const compressedImage = await compressImage(file);
      
      if (compressedImage.length > 100000) {
        setSaveStatus('❌ Image is still too large after compression');
        setSaving(false);
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }
      
      setImagePreview(compressedImage);
      updateLocalSetting('profile', 'profilePhoto', compressedImage);
      
      // ✅ Apply the image globally immediately (don't wait for backend)
      applyGlobalProfileImage(compressedImage);
      
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/settings/upload-profile-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          imageData: compressedImage,
          tenantId: getCurrentTenantId() || 'default-tenant'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSaveStatus('✅ Profile image saved to database!');
        
        // Update last updated date
        localStorage.setItem('lastSettingsUpdate', new Date().toISOString());
        setLastUpdated(getLastUpdatedDate());
        
        if (data.settings?.profile) {
          updateLocalSetting('profile', 'profilePhoto', data.settings.profile.profilePhoto || compressedImage);
          updateLocalSetting('profile', 'profilePhotoUrl', data.settings.profile.profilePhotoUrl || '');
          
          // ✅ Apply the final image from backend
          const finalImage = data.settings.profile.profilePhotoUrl || data.settings.profile.profilePhoto || compressedImage;
          applyGlobalProfileImage(finalImage);
        }
        
        await refetchSettings();
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setSaveStatus(`❌ ${error.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Language change handler
  const handleLanguageChange = async (newLanguage) => {
    if (!localSettings || saving) return;
    
    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to change language');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    setSaving(true);
    
    try {
      updateLocalSetting('language', 'appLanguage', newLanguage);
      updateLocalSetting('language', 'locale', newLanguage);
      
      const languageResult = await updateLanguage(newLanguage);
      
      if (languageResult.success) {
        const updatedLanguageSettings = {
          ...localSettings.language,
          appLanguage: newLanguage,
          locale: newLanguage
        };
        
        const settingsResult = await updateSettings('language', updatedLanguageSettings);
        
        if (settingsResult.success) {
          const languageNames = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'ar': 'Arabic',
            'hi': 'Hindi'
          };
          
          const languageName = languageNames[newLanguage] || newLanguage;
          setSaveStatus(`✅ Language changed to ${languageName}!`);
          
          // Update last updated date
          localStorage.setItem('lastSettingsUpdate', new Date().toISOString());
          setLastUpdated(getLastUpdatedDate());
          
          await refetchSettings();
        }
      } else {
        setSaveStatus('❌ Failed to change language');
      }
    } catch (error) {
      console.log('Language change error:', error);
      setSaveStatus('❌ Error changing language');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Theme change handler
  const handleThemeChange = async (newTheme) => {
    if (!localSettings || saving) return;
    
    updateLocalSetting('theme', 'mode', newTheme);
    
    const updatedThemeSettings = {
      ...localSettings.theme,
      mode: newTheme
    };
    applyGlobalThemeWithSettings(updatedThemeSettings);
    
    if (isAuthenticated) {
      setSaving(true);
      try {
        updateTheme(newTheme);
        
        const result = await updateSettings('theme', updatedThemeSettings);
        
        if (result.success) {
          setSaveStatus(`✅ Theme changed to ${newTheme}!`);
          
          // Update last updated date
          localStorage.setItem('lastSettingsUpdate', new Date().toISOString());
          setLastUpdated(getLastUpdatedDate());
          
          applyGlobalThemeWithSettings(updatedThemeSettings);
          updateThemeSettings(updatedThemeSettings);
          
          await refetchSettings();
        } else {
          setSaveStatus('❌ Failed to save theme to database');
        }
      } catch (error) {
        console.log('Theme change error:', error);
        setSaveStatus('❌ Error saving theme to database');
      } finally {
        setSaving(false);
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } else {
      setSaveStatus(`✅ Theme changed to ${newTheme}! (applied locally)`);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // ✅ Helper function to lighten color
  const lightenColor = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return `#${(
      0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    )
      .toString(16)
      .slice(1)}`;
  };

  // ✅ Helper function to darken color
  const darkenColor = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    
    return `#${(
      0x1000000 +
      (R > 0 ? R : 0) * 0x10000 +
      (G > 0 ? G : 0) * 0x100 +
      (B > 0 ? B : 0)
    )
      .toString(16)
      .slice(1)}`;
  };

  // ✅ Primary color change
  const handlePrimaryColorChange = async (color) => {
    if (!localSettings || saving) return;
    
    updateLocalSetting('theme', 'primaryColor', color);
    
    const updatedThemeSettings = {
      ...localSettings.theme,
      primaryColor: color
    };
    applyGlobalThemeWithSettings(updatedThemeSettings);
    
    if (isAuthenticated) {
      setSaving(true);
      try {
        const result = await updateSettings('theme', updatedThemeSettings);
        
        if (result.success) {
          setSaveStatus(`✅ Primary color changed!`);
          
          // Update last updated date
          localStorage.setItem('lastSettingsUpdate', new Date().toISOString());
          setLastUpdated(getLastUpdatedDate());
          
          applyGlobalThemeWithSettings(updatedThemeSettings);
          await refetchSettings();
        } else {
          setSaveStatus('❌ Failed to save color to database');
        }
      } catch (error) {
        console.log('Color change error:', error);
        setSaveStatus('❌ Error saving color to database');
      } finally {
        setSaving(false);
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } else {
      setSaveStatus(`✅ Primary color changed! (applied locally)`);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // ✅ Font Size change
  const handleFontSizeChange = async (size) => {
    if (!localSettings || saving) return;
    
    console.log(`📏 Changing font size to: ${size}`);
    
    const fontSizeMapping = {
      'Small (14px) - Compact': 'small',
      'Medium (16px) - Default': 'medium', 
      'Large (18px) - Enhanced Readability': 'large',
      'Extra Large (20px) - Accessibility': 'xlarge'
    };
    
    const backendFontSize = fontSizeMapping[size] || 'medium';
    
    updateLocalSetting('theme', 'fontSize', backendFontSize);
    
    const updatedThemeSettings = {
      ...localSettings.theme,
      fontSize: backendFontSize
    };
    
    applyGlobalThemeWithSettings(updatedThemeSettings);
    
    if (isAuthenticated) {
      setSaving(true);
      try {
        const result = await updateSettings('theme', updatedThemeSettings);
        
        if (result.success) {
          setSaveStatus(`✅ Font size changed to ${size}!`);
          
          // Update last updated date
          localStorage.setItem('lastSettingsUpdate', new Date().toISOString());
          setLastUpdated(getLastUpdatedDate());
          
          applyGlobalThemeWithSettings(updatedThemeSettings);
          await refetchSettings();
        } else {
          setSaveStatus('❌ Failed to save font size to database');
        }
      } catch (error) {
        console.log('Font size change error:', error);
        setSaveStatus('❌ Error saving font size to database');
      } finally {
        setSaving(false);
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } else {
      setSaveStatus(`✅ Font size changed to ${size}! (applied locally)`);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // ✅ Font Family change
  const handleFontFamilyChange = async (fontFamily) => {
    if (!localSettings || saving) return;
    
    console.log(`🔤 Changing font family to: ${fontFamily}`);
    
    const fontName = fontFamily.split(' - ')[0] || fontFamily;
    
    updateLocalSetting('theme', 'fontFamily', fontName);
    
    const updatedThemeSettings = {
      ...localSettings.theme,
      fontFamily: fontName
    };
    
    applyGlobalThemeWithSettings(updatedThemeSettings);
    
    if (isAuthenticated) {
      setSaving(true);
      try {
        const result = await updateSettings('theme', updatedThemeSettings);
        
        if (result.success) {
          setSaveStatus(`✅ Font family changed to ${fontName}!`);
          
          // Update last updated date
          localStorage.setItem('lastSettingsUpdate', new Date().toISOString());
          setLastUpdated(getLastUpdatedDate());
          
          applyGlobalThemeWithSettings(updatedThemeSettings);
          await refetchSettings();
        } else {
          setSaveStatus('❌ Failed to save font family to database');
        }
      } catch (error) {
        console.log('Font family change error:', error);
        setSaveStatus('❌ Error saving font family to database');
      } finally {
        setSaving(false);
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } else {
      setSaveStatus(`✅ Font family changed to ${fontName}! (applied locally)`);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // ✅ Performance setting change handler
  const handlePerformanceChange = async (key, value) => {
    if (!localSettings || saving) return;
    
    console.log(`⚡ Changing performance setting: ${key} = ${value}`);
    
    updateLocalSetting('performance', key, value);
    
    // Apply the setting immediately
    const updatedPerformanceSettings = {
      ...localSettings.performance,
      [key]: value
    };
    
    applyPerformanceSettings(updatedPerformanceSettings);
    
    // Save to database if authenticated
    if (isAuthenticated) {
      setSaving(true);
      try {
        const result = await updateSettings('performance', updatedPerformanceSettings);
        
        if (result.success) {
          const settingNames = {
            'enableCache': 'Cache',
            'autoSave': 'Auto Save',
            'lowDataMode': 'Low Data Mode'
          };
          
          setSaveStatus(`✅ ${settingNames[key]} ${value ? 'enabled' : 'disabled'}!`);
          
          // Update last updated date
          localStorage.setItem('lastSettingsUpdate', new Date().toISOString());
          setLastUpdated(getLastUpdatedDate());
          
          await refetchSettings();
        } else {
          setSaveStatus('❌ Failed to save performance settings to database');
        }
      } catch (error) {
        console.log('Performance change error:', error);
        setSaveStatus('❌ Error saving performance settings to database');
      } finally {
        setSaving(false);
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } else {
      const settingNames = {
        'enableCache': 'Cache',
        'autoSave': 'Auto Save',
        'lowDataMode': 'Low Data Mode'
      };
      setSaveStatus(`✅ ${settingNames[key]} ${value ? 'enabled' : 'disabled'}! (applied locally)`);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // ✅ FIXED Password change handler
  const handlePasswordChange = async () => {
    // Clear previous errors
    setPasswordErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    // Validation
    let hasError = false;
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      hasError = true;
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
      hasError = true;
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
      hasError = true;
    } else {
      const passwordValidationErrors = validatePassword(passwordData.newPassword);
      if (passwordValidationErrors.length > 0) {
        newErrors.newPassword = passwordValidationErrors.join('. ');
        hasError = true;
      }
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
      hasError = true;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      hasError = true;
    }

    if (hasError) {
      setPasswordErrors(newErrors);
      setTimeout(() => {
        setPasswordErrors({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }, 5000);
      return;
    }

    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to change password');
      setTimeout(() => setSaveStatus(''), 5000);
      setShowPasswordModal(false);
      return;
    }

    setSaving(true);
    
    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      const userEmail = getCurrentUserEmail();
      
      if (!userEmail) {
        throw new Error('User email not found');
      }

      // Call the backend API to change password
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userEmail,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      if (data.success) {
        setSaveStatus('✅ Password changed successfully! You will need to log in again with your new password.');
        
        // Clear password fields
        setPasswordData({ 
          currentPassword: '', 
          newPassword: '', 
          confirmPassword: '' 
        });
        
        // Close modal
        setShowPasswordModal(false);
        
        // Show success message
        setTimeout(() => {
          setSaveStatus('');
          
          // Force logout after password change for security
          setTimeout(() => {
            handleSignout();
          }, 1500);
          
        }, 3000);
        
      } else {
        throw new Error(data.message || 'Failed to change password');
      }
      
    } catch (error) {
      console.error('Password change error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Invalid current password') || 
          error.message.includes('incorrect password') ||
          error.message.includes('current password is wrong') ||
          error.message.includes('401')) {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect'
        }));
        setSaveStatus('❌ Current password is incorrect');
      } else if (error.message.includes('same as current') || 
                error.message.includes('cannot be the same')) {
        setSaveStatus('❌ New password cannot be the same as current password');
      } else if (error.message.includes('weak') || 
                error.message.includes('strength') ||
                error.message.includes('strong')) {
        setSaveStatus('❌ Password is too weak. Please use a stronger password');
      } else if (error.message.includes('NetworkError') ||
                error.message.includes('Failed to fetch')) {
        setSaveStatus('❌ Network error. Please check your connection and try again.');
      } else {
        setSaveStatus(`❌ ${error.message || 'Error changing password. Please try again.'}`);
      }
      
      setTimeout(() => {
        setSaveStatus('');
        setPasswordErrors({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }, 5000);
      
    } finally {
      setSaving(false);
    }
  };

  // ✅ FIXED: Two-factor authentication toggle with proper persistence
  const handleTwoFactorAuth = async (enable) => {
    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to enable two-factor authentication');
      setTimeout(() => setSaveStatus(''), 5000);
      // Still update local UI state
      updateLocalSetting('privacy', 'twoFactorAuth', enable);
      setTwoFactorStatus(prev => ({
        ...prev,
        isEnabled: enable
      }));
      return;
    }

    console.log('🔐 Toggling 2FA to:', enable);

    if (!enable) {
      // Disable 2FA
      setTwoFactorLoading(true);
      try {
        // Update local state immediately
        updateLocalSetting('privacy', 'twoFactorAuth', false);
        setTwoFactorStatus({
          isEnabled: false,
          needsVerification: false,
          nextVerificationDate: null,
          lastVerification: null
        });
        setRequires2FAVerification(false);
        setTwoFactorPIN(''); // Clear PIN when disabling
        
        // Save to backend
        await handleSave('privacy');
        
        setSaveStatus('✅ Two-factor authentication disabled!');
        
        // Update last updated date
        localStorage.setItem('lastSettingsUpdate', new Date().toISOString());
        setLastUpdated(getLastUpdatedDate());
        
        await refetchSettings();
      } catch (error) {
        console.error('2FA disable error:', error);
        setSaveStatus('❌ Error disabling two-factor authentication');
        // Revert on error
        updateLocalSetting('privacy', 'twoFactorAuth', true);
        setTwoFactorStatus(prev => ({
          ...prev,
          isEnabled: true
        }));
      } finally {
        setTwoFactorLoading(false);
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } else {
      // Enable 2FA - show PIN setup modal
      setShowTwoFactorModal(true);
      setTwoFactorData({
        step: 'pin-setup',
        pin: '',
        confirmPin: ''
      });
    }
  };

  // ✅ FIXED: Setup PIN with proper backend persistence
  const setupPin = async () => {
    if (!twoFactorData.pin || twoFactorData.pin.length !== 6 || !/^\d+$/.test(twoFactorData.pin)) {
      setSaveStatus('❌ PIN must be exactly 6 digits (numbers only)');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (twoFactorData.pin !== twoFactorData.confirmPin) {
      setSaveStatus('❌ PINs do not match');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to setup PIN');
      setTimeout(() => setSaveStatus(''), 5000);
      setShowTwoFactorModal(false);
      return;
    }

    setTwoFactorLoading(true);
    try {
      console.log('🔐 Setting up 2FA PIN:', twoFactorData.pin);
      
      // Store PIN locally (in production, this should be hashed on backend)
      setTwoFactorPIN(twoFactorData.pin);
      
      // Update local state
      updateLocalSetting('privacy', 'twoFactorAuth', true);
      
      setTwoFactorStatus({
        isEnabled: true,
        needsVerification: false,
        nextVerificationDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        lastVerification: new Date()
      });
      
      setRequires2FAVerification(false);
      
      // Create privacy settings object with 2FA data
      const privacySettings = {
        twoFactorAuth: true,
        twoFactorPIN: twoFactorData.pin,
        profileVisibility: localSettings.privacy?.profileVisibility || 'private',
        showEmail: localSettings.privacy?.showEmail || false,
        loginAlerts: localSettings.privacy?.loginAlerts || false
      };
      
      console.log('💾 Saving 2FA settings:', privacySettings);
      
      // Save to backend using existing updateSettings
      const result = await updateSettings('privacy', privacySettings);
      
      if (result.success) {
        setShowTwoFactorModal(false);
        setTwoFactorData({
          step: 'pin-setup',
          pin: '',
          confirmPin: ''
        });
        
        setSaveStatus('✅ Two-factor authentication enabled with 6-digit PIN!');
        
        // Update last updated date
        localStorage.setItem('lastSettingsUpdate', new Date().toISOString());
        setLastUpdated(getLastUpdatedDate());
        
        // Refresh settings from backend to ensure consistency
        await refetchSettings();
        
        // Store in localStorage for persistence
        localStorage.setItem('twoFactorEnabled', 'true');
        localStorage.setItem('last2FAVerification', new Date().toISOString());
        
      } else {
        throw new Error('Failed to save 2FA settings to database');
      }
      
    } catch (error) {
      console.error('PIN setup error:', error);
      setSaveStatus('❌ Error setting up PIN: ' + error.message);
      // Revert on error
      updateLocalSetting('privacy', 'twoFactorAuth', false);
      setTwoFactorStatus(prev => ({
        ...prev,
        isEnabled: false
      }));
      setTwoFactorPIN('');
    } finally {
      setTwoFactorLoading(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Enhanced Signout
  const handleSignout = async () => {
    try {
      setSaving(true);
      
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (token) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            console.log('✅ Backend logout successful');
          }
        } catch (error) {
          console.log('⚠️ Backend logout failed, continuing with client-side cleanup');
        }
      }
      
      const authItemsToRemove = [
        'sessionToken',
        'token',
        'authToken',
        'userEmail',
        'userId',
        'userName',
        'refreshToken',
        'isLoggedIn',
        'last2FAVerification',
        'userCurrency',
        'userTimezone',
        '2FAAutoShown',
        'tenantId',
        'userSession',
        'sessionExpiry',
        'redirectAfterLogin',
        'recentPages'
      ];
      
      authItemsToRemove.forEach(item => {
        localStorage.removeItem(item);
        sessionStorage.removeItem(item);
      });
      
      localStorage.removeItem('userSession');
      sessionStorage.removeItem('userSession');
      
      // Preserve accessibility settings
      const highContrast = localStorage.getItem('highContrastEnabled');
      const reduceMotion = localStorage.getItem('reduceMotionEnabled');
      const screenReader = localStorage.getItem('screenReaderOptimized');
      const keyboardNav = localStorage.getItem('keyboardNavigationEnabled');
      
      // Preserve 2FA setting
      const twoFactorEnabled = localStorage.getItem('twoFactorEnabled');
      const twoFactorPIN = localStorage.getItem('twoFactorPIN');
      
      // Preserve global profile image
      const globalProfileImage = localStorage.getItem('globalProfileImage');
      
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      setSaving(false);
      setShowSignoutModal(false);
      
      setSaveStatus('✅ Successfully signed out! Redirecting...');
      
      setTimeout(() => {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Restore accessibility settings
        if (highContrast) localStorage.setItem('highContrastEnabled', highContrast);
        if (reduceMotion) localStorage.setItem('reduceMotionEnabled', reduceMotion);
        if (screenReader) localStorage.setItem('screenReaderOptimized', screenReader);
        if (keyboardNav) localStorage.setItem('keyboardNavigationEnabled', keyboardNav);
        
        // Restore 2FA setting
        if (twoFactorEnabled) localStorage.setItem('twoFactorEnabled', twoFactorEnabled);
        if (twoFactorPIN) localStorage.setItem('twoFactorPIN', twoFactorPIN);
        
        // Restore global profile image
        if (globalProfileImage) localStorage.setItem('globalProfileImage', globalProfileImage);
        
        if ('caches' in window) {
          caches.keys().then(function(names) {
            for (let name of names) {
              caches.delete(name);
            }
          });
        }
        
        window.location.href = '/login?logout=' + Date.now() + '&nocache=' + Math.random();
      }, 1000);
      
    } catch (error) {
      console.log('Signout error:', error);
      setSaving(false);
      setSaveStatus('❌ Error during signout');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Reset settings
  const handleReset = async () => {
    if (window.confirm('⚠️ Are you sure you want to reset all settings to default? This cannot be undone.')) {
      if (!isAuthenticated) {
        setSaveStatus('❌ Please log in to reset settings');
        setTimeout(() => setSaveStatus(''), 5000);
        return;
      }

      setSaving(true);
      const result = await resetSettings();
      setSaving(false);
      
      if (result.success) {
        setSaveStatus('✅ Settings reset successfully!');
        
        // Update last updated date
        localStorage.setItem('lastSettingsUpdate', new Date().toISOString());
        setLastUpdated(getLastUpdatedDate());
        
        // Update 2FA status after reset
        setTwoFactorStatus({
          isEnabled: false,
          needsVerification: false,
          nextVerificationDate: null,
          lastVerification: null
        });
        
        setTwoFactorPIN('');
        
        // Clear global profile image
        localStorage.removeItem('globalProfileImage');
        applyGlobalProfileImage('');
        setImagePreview('');
        
        await refetchSettings();
        
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('❌ Error resetting settings');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    }
  };

  // ✅ Export data
  const handleExport = async () => {
    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to export your data');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    try {
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/settings/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finovo-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSaveStatus('✅ Data exported successfully!');
      
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.log('Export error:', error);
      setSaveStatus('❌ Error exporting data');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Save profile without image
  const handleSaveProfileWithoutImage = async () => {
    if (!localSettings || !localSettings.profile) {
      setSaveStatus('❌ No profile data to save');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    const isAuth = checkAuth();
    
    if (!isAuth) {
      setSaveStatus('❌ Please log in to save profile');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    setSaving(true);
    
    const profileData = {
      name: localSettings.profile.name || '',
      phone: localSettings.profile.phone || '',
      bio: localSettings.profile.bio || ''
    };
    
    console.log('💾 Saving profile (without image):', profileData);
    
    try {
      const result = await updateSettings('profile', profileData);
      
      if (result.success) {
        setSaveStatus('✅ Profile saved successfully!');
        
        // Update last updated date
        localStorage.setItem('lastSettingsUpdate', new Date().toISOString());
        setLastUpdated(getLastUpdatedDate());
        
        if (result.data?.profile?.name) {
          setCurrentUserName(result.data.profile.name);
        }
        
        await refetchSettings();
      } else {
        setSaveStatus(`❌ Error: ${result.error || 'Failed to save'}`);
      }
    } catch (error) {
      setSaveStatus(`❌ Connection Error: ${error.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  if (loading || !localSettings || isChecking2FA) {
    return (
      <div className="settings-loading">
        <div className="loader-spinner"></div>
        <p>Loading your settings from database...</p>
        <small>Please wait while we fetch your settings</small>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-error">
        <div className="error-icon">⚠️</div>
        <h2>Failed to Load Settings from Database</h2>
        <p>Error: {error}</p>
        <p className="error-note">
          ⚠️ Please check your:
          <br />1. Internet connection
          <br />2. Backend server (localhost:5000)
          <br />3. Authentication status
          <br />4. Database connection
        </p>
        <button onClick={() => refetchSettings()} className="btn-save">
          Retry Loading
        </button>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          Reload Page
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'account', label: 'Account', icon: '🏢' },
    { id: 'theme', label: 'Theme', icon: '🎨' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'appearance', label: 'Appearance', icon: '✨' },
    { id: 'language', label: 'Language & Region', icon: '🌍' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'accessibility', label: 'Accessibility', icon: '♿' },
    { id: 'about', label: 'About', icon: 'ℹ️' }
  ];

  const loggedInUserEmail = getCurrentUserEmail();
  const loggedInUserName = getCurrentUserName();
  
  const actualTenantId = getCurrentTenantId();

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div>
          <h1>⚙️ Settings</h1>
          <p className="settings-subtitle">Manage your account preferences and app behavior</p>
          {loggedInUserEmail && (
            <div className="user-info-display">
              <small>Logged in as: <strong>{loggedInUserEmail}</strong></small>
            </div>
          )}
        </div>
        <div className="header-actions">
          {saveStatus && (
            <div className={`save-status ${saveStatus.includes('❌') ? 'error' : 'success'}`}>
              {saveStatus}
            </div>
          )}
          
          {requires2FAVerification && (
            <button 
              className="btn-verify-2fa"
              onClick={() => {}}
              title="Verify two-factor authentication"
              disabled={saving || twoFactorLoading}
            >
              🛡️ Verify Security
            </button>
          )}
          
          <button 
            className="btn-signout"
            onClick={() => setShowSignoutModal(true)}
            disabled={saving}
            title="Sign out from your account"
          >
            🚪 Sign Out
          </button>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              disabled={saving}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>👤 {t('profileSettings')}</h2>
              <p className="section-description">{t('profileDescription')}</p>
              
              <div className="profile-header-section">
                <div className="profile-image-container">
                  <div className="profile-image-wrapper">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="profile-image" />
                    ) : (
                      <div className="profile-image-placeholder">
                        <span className="profile-initials">
                          {loggedInUserName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <label htmlFor="profile-image-input" className="profile-image-edit">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                    </label>
                    <input
                      id="profile-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      disabled={saving}
                    />
                  </div>
                  <div className="profile-image-info">
                    <h3>{loggedInUserName || t('user')}</h3>
                    <p className="profile-email">
                      {loggedInUserEmail || t('pleaseLogInToSeeEmail')}
                    </p>
                    <small>Profile image will be applied globally across the app</small>
                  </div>
                </div>
              </div>
              
              <div className="setting-group">
                <label>{t('displayName')}</label>
                <input
                  type="text"
                  value={localSettings.profile?.name || ''}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    updateLocalSetting('profile', 'name', newVal);
                    setCurrentUserName(newVal);
                  }}
                  placeholder={t('enterDisplayName')}
                  disabled={saving}
                />
                <small>{t('nameWillBeSaved')}</small>
              </div>
              
              <div className="setting-group">
                <label>{t('emailAddress')} ({t('readOnly')})</label>
                <input
                  type="email"
                  value={loggedInUserEmail || 'Not logged in'}
                  disabled
                  className="readonly-input"
                  readOnly
                />
                <small>
                  {loggedInUserEmail ? t('emailIsManaged') : t('pleaseLogInToSeeEmail')}
                </small>
              </div>
              
              <div className="setting-group">
                <label>{t('phoneNumber')}</label>
                <input
                  type="tel"
                  value={localSettings.profile?.phone || ''}
                  onChange={(e) => updateLocalSetting('profile', 'phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={saving}
                />
                <small>{t('phoneWillBeSaved')}</small>
              </div>
              
              <div className="setting-group">
                <label>{t('bio')}</label>
                <textarea
                  value={localSettings.profile?.bio || ''}
                  onChange={(e) => updateLocalSetting('profile', 'bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows="4"
                  disabled={saving}
                />
                <small>{t('bioWillBeSaved')}</small>
              </div>
              
              <div className="profile-actions">
                <button 
                  className="btn-save" 
                  onClick={handleSaveProfileWithoutImage} 
                  disabled={saving || !isAuthenticated}
                  title={!isAuthenticated ? t('pleaseLogInToSave') : ""}
                >
                  {saving ? `💾 ${t('saving')}` : `💾 ${t('saveProfile')}`}
                </button>
                <small className="save-note">{t('saveNote')}</small>
              </div>
              
              {!isAuthenticated && <small className="auth-warning">{t('pleaseLogInToSave')}</small>}
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="settings-section">
              <h2>🏢 Account Type</h2>
              <p className="section-description">Choose your account type based on your needs</p>
              
              <div className="account-type-cards">
                <div 
                  className={`account-card ${localSettings.account?.type === 'individual' ? 'selected' : ''}`}
                  onClick={() => updateLocalSetting('account', 'type', 'individual')}
                >
                  <div className="account-card-icon">👤</div>
                  <h3>Individual</h3>
                  <p>Perfect for personal finance management</p>
                  <ul>
                    <li>Single user access</li>
                    <li>Personal budgeting tools</li>
                    <li>Transaction tracking</li>
                    <li>Basic reports</li>
                  </ul>
                </div>

                <div 
                  className={`account-card ${localSettings.account?.type === 'family' ? 'selected' : ''}`}
                  onClick={() => updateLocalSetting('account', 'type', 'family')}
                >
                  <div className="account-card-icon">👨‍👩‍👧‍👦</div>
                  <h3>Family</h3>
                  <p>Share finances with family members</p>
                  <ul>
                    <li>Up to 5 family members</li>
                    <li>Shared budgets</li>
                    <li>Individual profiles</li>
                    <li>Family reports</li>
                  </ul>
                </div>

                <div 
                  className={`account-card ${localSettings.account?.type === 'business' ? 'selected' : ''}`}
                  onClick={() => updateLocalSetting('account', 'type', 'business')}
                >
                  <div className="account-card-icon">💼</div>
                  <h3>Business</h3>
                  <p>Advanced tools for business management</p>
                  <ul>
                    <li>Unlimited users</li>
                    <li>Business analytics</li>
                    <li>Invoice management</li>
                    <li>Advanced reporting</li>
                  </ul>
                </div>
              </div>
              
              <button 
                className="btn-save" 
                onClick={() => handleSave('account')} 
                disabled={saving || !isAuthenticated}
                title={!isAuthenticated ? "Please log in to save" : ""}
              >
                {saving ? `💾 ${t('saving')}` : `💾 ${t('saveAccountType')}` }
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save</small>}
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div className="settings-section">
              <h2>🎨 Theme Settings</h2>
              <p className="section-description">Customize your app appearance - changes apply globally across the entire application</p>
              
              <div className="setting-group">
                <label>Theme Mode</label>
                <select
                  value={localSettings.theme?.mode || 'light'}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="light">☀️ Light Mode</option>
                  <option value="dark">🌙 Dark Mode</option>
                  <option value="auto">🔄 Auto (System Preference)</option>
                </select>
                <small>Changes apply to the entire application immediately</small>
              </div>
              
              <div className="setting-group">
                <label>Primary Color</label>
                <div className="color-picker-group">
                  <input
                    type="color"
                    value={localSettings.theme?.primaryColor || '#3b82f6'}
                    onChange={(e) => handlePrimaryColorChange(e.target.value)}
                    disabled={saving}
                  />
                  <input
                    type="text"
                    value={localSettings.theme?.primaryColor || '#3b82f6'}
                    onChange={(e) => handlePrimaryColorChange(e.target.value)}
                    placeholder="#3b82f6"
                    disabled={saving}
                  />
                </div>
                <small>Color changes apply globally to buttons, links, and highlights</small>
              </div>
              
              <div className="setting-group">
                <label>Font Size</label>
                <select
                  value={
                    localSettings.theme?.fontSize === 'xlarge' ? 'Extra Large (20px) - Accessibility' :
                    localSettings.theme?.fontSize === 'large' ? 'Large (18px) - Enhanced Readability' :
                    localSettings.theme?.fontSize === 'small' ? 'Small (14px) - Compact' :
                    'Medium (16px) - Default'
                  }
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="Small (14px) - Compact">🔤 Small (14px) - Compact</option>
                  <option value="Medium (16px) - Default">🔤 Medium (16px) - Default</option>
                  <option value="Large (18px) - Enhanced Readability">🔤 Large (18px) - Enhanced Readability</option>
                  <option value="Extra Large (20px) - Accessibility">🔤 Extra Large (20px) - Accessibility</option>
                </select>
                <small>Font size applies to all text in the application</small>
              </div>
              
              <div className="setting-group">
                <label>Font Family</label>
                <select
                  value={`${localSettings.theme?.fontFamily || 'Inter'} - ${localSettings.theme?.fontFamily === 'Inter' ? 'Modern & Clean (Default)' : 
                         localSettings.theme?.fontFamily === 'Roboto' ? 'Google\'s Font' :
                         localSettings.theme?.fontFamily === 'Open Sans' ? 'Highly Readable' :
                         localSettings.theme?.fontFamily === 'Lato' ? 'Elegant & Professional' :
                         localSettings.theme?.fontFamily === 'Montserrat' ? 'Geometric & Bold' :
                         localSettings.theme?.fontFamily === 'Poppins' ? 'Geometric Sans-Serif' :
                         localSettings.theme?.fontFamily === 'Nunito' ? 'Rounded & Friendly' :
                         localSettings.theme?.fontFamily === 'Source Sans Pro' ? 'Adobe\'s Font' :
                         localSettings.theme?.fontFamily === 'Noto Sans' ? 'Google\'s Universal Font' :
                         localSettings.theme?.fontFamily === 'Segoe UI' ? 'Microsoft\'s Font' :
                         localSettings.theme?.fontFamily === 'SF Pro Display' ? 'Apple\'s Font' :
                         localSettings.theme?.fontFamily === 'Arial' ? 'Classic Web Font' :
                         localSettings.theme?.fontFamily === 'Helvetica' ? 'Professional Print Font' :
                         localSettings.theme?.fontFamily === 'Georgia' ? 'Elegant Serif' :
                         localSettings.theme?.fontFamily === 'Times New Roman' ? 'Traditional Serif' :
                         localSettings.theme?.fontFamily === 'Courier New' ? 'Monospace' :
                         localSettings.theme?.fontFamily === 'Comic Sans MS' ? 'Casual' : 'Modern & Clean (Default)'}`}
                  onChange={(e) => handleFontFamilyChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="Inter - Modern & Clean (Default)">🔤 Inter - Modern & Clean (Default)</option>
                  <option value="Roboto - Google's Font">🔤 Roboto - Google's Font</option>
                  <option value="Open Sans - Highly Readable">🔤 Open Sans - Highly Readable</option>
                  <option value="Lato - Elegant & Professional">🔤 Lato - Elegant & Professional</option>
                  <option value="Montserrat - Geometric & Bold">🔤 Montserrat - Geometric & Bold</option>
                  <option value="Poppins - Geometric Sans-Serif">🔤 Poppins - Geometric Sans-Serif</option>
                  <option value="Nunito - Rounded & Friendly">🔤 Nunito - Rounded & Friendly</option>
                  <option value="Source Sans Pro - Adobe's Font">🔤 Source Sans Pro - Adobe's Font</option>
                  <option value="Noto Sans - Google's Universal Font">🔤 Noto Sans - Google's Universal Font</option>
                  <option value="Segoe UI - Microsoft's Font">🔤 Segoe UI - Microsoft's Font</option>
                  <option value="SF Pro Display - Apple's Font">🔤 SF Pro Display - Apple's Font</option>
                  <option value="Arial - Classic Web Font">🔤 Arial - Classic Web Font</option>
                  <option value="Helvetica - Professional Print Font">🔤 Helvetica - Professional Print Font</option>
                  <option value="Georgia - Elegant Serif">🔤 Georgia - Elegant Serif</option>
                  <option value="Times New Roman - Traditional Serif">🔤 Times New Roman - Traditional Serif</option>
                  <option value="Courier New - Monospace">🔤 Courier New - Monospace</option>
                  <option value="Comic Sans MS - Casual">🔤 Comic Sans MS - Casual</option>
                </select>
                <small>Font family applies to all text throughout the application</small>
              </div>
              
              <div className="theme-actions">
                <button 
                  className="btn-save" 
                  onClick={() => handleSave('theme')} 
                  disabled={saving || !isAuthenticated}
                  title={!isAuthenticated ? "Please log in to save" : ""}
                >
                  {saving ? `💾 ${t('saving')}` : `💾 ${t('saveTheme')}` }
                </button>
              </div>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save</small>}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>🔔 Notification Settings</h2>
              <p className="section-description">Control how you receive notifications</p>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">📧 Email Notifications</span>
                    <small>Receive updates via email</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.notifications?.email || false}
                    onChange={(e) => updateLocalSetting('notifications', 'email', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">🔔 Push Notifications</span>
                    <small>Get real-time alerts</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.notifications?.push || false}
                    onChange={(e) => updateLocalSetting('notifications', 'push', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">💰 Transaction Alerts</span>
                    <small>Notify on new transactions</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.notifications?.transactionAlerts || false}
                    onChange={(e) => updateLocalSetting('notifications', 'transactionAlerts', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">📊 Weekly Reports</span>
                    <small>Receive weekly financial summaries</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.notifications?.weeklyReports || false}
                    onChange={(e) => updateLocalSetting('notifications', 'weeklyReports', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">💵 Budget Alerts</span>
                    <small>Warn when nearing budget limits</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.notifications?.budgetAlerts || false}
                    onChange={(e) => updateLocalSetting('notifications', 'budgetAlerts', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">🔐 Security Alerts</span>
                    <small>Important security notifications</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.notifications?.securityAlerts || false}
                    onChange={(e) => updateLocalSetting('notifications', 'securityAlerts', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <button 
                className="btn-save" 
                onClick={() => handleSave('notifications')} 
                disabled={saving || !isAuthenticated}
                title={!isAuthenticated ? "Please log in to save" : ""}
              >
                {saving ? `💾 ${t('saving')}` : `💾 ${t('saveNotifications')}` }
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save</small>}
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h2>🔒 Privacy & Security</h2>
              <p className="section-description">Manage your privacy and security preferences</p>
              
              <div className="setting-group">
                <label>Profile Visibility</label>
                <select
                  value={localSettings.privacy?.profileVisibility || 'private'}
                  onChange={(e) => updateLocalSetting('privacy', 'profileVisibility', e.target.value)}
                  disabled={saving}
                >
                  <option value="public">🌐 Public</option>
                  <option value="private">🔒 Private</option>
                  <option value="friends">👥 Friends Only</option>
                </select>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">Show Email</span>
                    <small>Display email on profile</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.privacy?.showEmail || false}
                    onChange={(e) => updateLocalSetting('privacy', 'showEmail', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="two-factor-section">
                <div className="setting-group toggle-group">
                  <label>
                    <div>
                      <span className="toggle-label">Two-Factor Authentication</span>
                      <small>
                        {twoFactorStatus.isEnabled 
                          ? `Extra security enabled with 6-digit PIN. Verification required every 15 days. ${twoFactorPIN ? '(PIN is set)' : ''}`
                          : 'Add extra security to your account with a 6-digit PIN. When enabled, you\'ll need to enter your PIN periodically.'
                        }
                      </small>
                    </div>
                    <input
                      type="checkbox"
                      checked={twoFactorStatus.isEnabled}
                      onChange={(e) => handleTwoFactorAuth(e.target.checked)}
                      disabled={saving || twoFactorLoading || !isAuthenticated}
                    />
                  </label>
                </div>
                
                {twoFactorStatus.isEnabled && (
                  <div className="two-factor-status">
                    <div className={`status-badge ${requires2FAVerification ? 'verification-needed' : 'enabled'}`}>
                      <span className="status-icon">🛡️</span>
                      <span className="status-text">
                        {requires2FAVerification 
                          ? 'Two-factor authentication verification needed'
                          : 'Two-factor authentication is active with 6-digit PIN'
                        }
                      </span>
                    </div>
                    <div className="two-factor-actions">
                      <button 
                        className="btn-secondary btn-sm"
                        onClick={() => handleTwoFactorAuth(false)}
                        disabled={saving || twoFactorLoading || !isAuthenticated}
                      >
                        {twoFactorLoading ? 'Disabling...' : 'Disable 2FA'}
                      </button>
                      {!twoFactorPIN && (
                        <button 
                          className="btn-secondary btn-sm"
                          onClick={() => {
                            setShowTwoFactorModal(true);
                            setTwoFactorData({
                              step: 'pin-setup',
                              pin: '',
                              confirmPin: ''
                            });
                          }}
                          disabled={saving || twoFactorLoading}
                        >
                          Setup PIN
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">Login Alerts</span>
                    <small>Notify on new login attempts</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.privacy?.loginAlerts || false}
                    onChange={(e) => updateLocalSetting('privacy', 'loginAlerts', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <button 
                className="btn-save" 
                onClick={() => handleSave('privacy')} 
                disabled={saving || !isAuthenticated}
                title={!isAuthenticated ? "Please log in to save" : ""}
              >
                {saving ? `💾 ${t('saving')}` : `💾 ${t('savePrivacySettings')}` }
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save</small>}
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h2>✨ Appearance Settings</h2>
              <p className="section-description">Customize how the app looks</p>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">Compact Mode</span>
                    <small>Reduce spacing for more content</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.appearance?.compactMode || false}
                    onChange={(e) => updateLocalSetting('appearance', 'compactMode', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">Show Animations</span>
                    <small>Enable smooth transitions</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.appearance?.showAnimations || false}
                    onChange={(e) => updateLocalSetting('appearance', 'showAnimations', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group">
                <label>Currency Symbol</label>
                <select
                  value={localSettings.appearance?.currencySymbol || '$'}
                  onChange={(e) => updateLocalSetting('appearance', 'currencySymbol', e.target.value)}
                  disabled={saving}
                >
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="¥">¥ (JPY)</option>
                  <option value="₹">₹ (INR)</option>
                </select>
              </div>
              
              <div className="setting-group">
                <label>Date Format</label>
                <select
                  value={localSettings.appearance?.dateFormat || 'MM/DD/YYYY'}
                  onChange={(e) => updateLocalSetting('appearance', 'dateFormat', e.target.value)}
                  disabled={saving}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              
              <button 
                className="btn-save" 
                onClick={() => handleSave('appearance')} 
                disabled={saving || !isAuthenticated}
                title={!isAuthenticated ? "Please log in to save" : ""}
              >
                {saving ? `💾 ${t('saving')}` : `💾 ${t('saveAppearance')}` }
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save</small>}
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div className="settings-section">
              <h2>🌍 Language & Region</h2>
              <p className="section-description">Set your language and regional preferences</p>
              
              <div className="setting-group">
                <label>Language</label>
                <select
                  value={localSettings.language?.appLanguage || localSettings.language?.locale || language || 'en'}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Español (Spanish)</option>
                  <option value="fr">🇫🇷 Français (French)</option>
                  <option value="de">🇩🇪 Deutsch (German)</option>
                  <option value="it">🇮🇹 Italiano (Italian)</option>
                  <option value="pt">🇵🇹 Português (Portuguese)</option>
                  <option value="ru">🇷🇺 Русский (Russian)</option>
                  <option value="zh">🇨🇳 中文 (Chinese)</option>
                  <option value="ja">🇯🇵 日本語 (Japanese)</option>
                  <option value="ko">🇰🇷 한국어 (Korean)</option>
                  <option value="ar">🇸🇦 العربية (Arabic)</option>
                  <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
                </select>
                <small>Language changes will be saved to database</small>
              </div>

              <div className="setting-group">
                <label>Currency</label>
                <select
                  value={localSettings.language?.currency || 'USD'}
                  onChange={(e) => updateLocalSetting('language', 'currency', e.target.value)}
                  disabled={saving}
                >
                  <option value="USD">🇺🇸 US Dollar (USD)</option>
                  <option value="EUR">🇪🇺 Euro (EUR)</option>
                  <option value="GBP">🇬🇧 British Pound (GBP)</option>
                  <option value="JPY">🇯🇵 Japanese Yen (JPY)</option>
                  <option value="INR">🇮🇳 Indian Rupee (INR)</option>
                  <option value="AUD">🇦🇺 Australian Dollar (AUD)</option>
                  <option value="CAD">🇨🇦 Canadian Dollar (CAD)</option>
                  <option value="CNY">🇨🇳 Chinese Yuan (CNY)</option>
                </select>
              </div>
              
              <div className="setting-group">
                <label>Timezone</label>
                <select
                  value={localSettings.language?.timezone || 'UTC'}
                  onChange={(e) => updateLocalSetting('language', 'timezone', e.target.value)}
                  disabled={saving}
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>
              
              <button 
                className="btn-save" 
                onClick={() => handleSave('language')} 
                disabled={saving || !isAuthenticated}
                title={!isAuthenticated ? "Please log in to save" : ""}
              >
                {saving ? '💾 Saving...' : '💾 Save Language Settings'}
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save</small>}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="settings-section">
              <h2>⚡ Performance Settings</h2>
              <p className="section-description">Optimize app performance. Changes apply immediately across the entire application.</p>
              
              <div className="performance-status active">
                <span className="status-icon">ℹ️</span>
                <span className="status-text">Performance settings apply globally to the entire application</span>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">Enable Cache</span>
                    <small>Faster load times by storing data locally. Reduces server requests and improves overall app performance.</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.performance?.enableCache || false}
                    onChange={(e) => handlePerformanceChange('enableCache', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">Auto Save</span>
                    <small>Automatically save changes as you work. Prevents data loss and provides a seamless editing experience.</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.performance?.autoSave || false}
                    onChange={(e) => handlePerformanceChange('autoSave', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">Low Data Mode</span>
                    <small>Reduce data usage by loading lower quality images and disabling heavy animations. Ideal for slow connections.</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.performance?.lowDataMode || false}
                    onChange={(e) => handlePerformanceChange('lowDataMode', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="performance-actions">
                <button 
                  className="btn-save" 
                  onClick={() => handleSave('performance')} 
                  disabled={saving || !isAuthenticated}
                  title={!isAuthenticated ? "Please log in to save" : ""}
                >
                  {saving ? '💾 Saving...' : '💾 Save Performance Settings'}
                </button>
                <small className="save-note">Settings apply immediately across the entire application</small>
              </div>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save</small>}
            </div>
          )}

          {/* ✅ FIXED: Accessibility Tab - Complete and Working */}
          {activeTab === 'accessibility' && (
            <div className="settings-section">
              <h2>♿ Accessibility Settings</h2>
              <p className="section-description">Make the app easier to use. Changes apply immediately across the entire application.</p>
              
              <div className="accessibility-status active">
                <span className="status-icon">ℹ️</span>
                <span className="status-text">Accessibility settings apply immediately to the entire application</span>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">High Contrast</span>
                    <small>Increases color contrast for better visibility. Applies globally to all elements.</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility?.highContrast || false}
                    onChange={(e) => updateLocalSetting('accessibility', 'highContrast', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">Reduce Motion</span>
                    <small>Minimizes animations and transitions for users sensitive to motion. Applies to all animations in the app.</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility?.reduceMotion || false}
                    onChange={(e) => updateLocalSetting('accessibility', 'reduceMotion', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">Screen Reader Support</span>
                    <small>Optimizes the app for screen readers and assistive technologies. Adds ARIA attributes and improves navigation.</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility?.screenReader || false}
                    onChange={(e) => updateLocalSetting('accessibility', 'screenReader', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">Keyboard Navigation</span>
                    <small>Enhances keyboard navigation and focus indicators. Improves tab navigation and focus visibility.</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility?.keyboardNavigation || false}
                    onChange={(e) => updateLocalSetting('accessibility', 'keyboardNavigation', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="accessibility-preview">
                <h3>Live Preview</h3>
                <div className="preview-container">
                  <div className="preview-item">
                    <span className="preview-label">Focus Indicator:</span>
                    <button className="preview-button">Sample Button</button>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Contrast:</span>
                    <div className="preview-text">
                      This text will change based on your accessibility settings
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="accessibility-info">
                <h3>About These Settings</h3>
                <ul>
                  <li><strong>High Contrast:</strong> Increases contrast ratios for text, buttons, and backgrounds. Ideal for users with low vision.</li>
                  <li><strong>Reduce Motion:</strong> Reduces or eliminates animations. Helpful for users with motion sensitivity or vestibular disorders.</li>
                  <li><strong>Screen Reader Support:</strong> Adds proper ARIA labels, roles, and landmarks. Essential for blind and low-vision users.</li>
                  <li><strong>Keyboard Navigation:</strong> Improves focus management and keyboard-only navigation. Crucial for motor-impaired users.</li>
                </ul>
                <p className="info-note">
                  <strong>Note:</strong> All accessibility settings are saved to your account and persist across sessions.
                  They apply immediately to the entire application without requiring a page reload.
                </p>
              </div>
              
              <div className="accessibility-actions">
                <button 
                  className="btn-save" 
                  onClick={() => handleSave('accessibility')} 
                  disabled={saving || !isAuthenticated}
                  title={!isAuthenticated ? "Please log in to save" : ""}
                >
                  {saving ? '💾 Saving...' : '💾 Save Accessibility Settings'}
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    // Reset accessibility to defaults
                    const defaultSettings = {
                      highContrast: false,
                      reduceMotion: false,
                      screenReader: false,
                      keyboardNavigation: false
                    };
                    setLocalSettings(prev => ({
                      ...prev,
                      accessibility: defaultSettings
                    }));
                    applyAccessibilitySettings(defaultSettings);
                    setSaveStatus('♿ Accessibility settings reset to defaults (applied globally)');
                    setTimeout(() => setSaveStatus(''), 3000);
                  }}
                  disabled={saving}
                >
                  🔄 Reset to Defaults
                </button>
                <small className="save-note">Accessibility settings apply immediately across the entire application</small>
              </div>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save settings to database</small>}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="settings-section">
              <h2>ℹ️ About Finovo</h2>
              <p className="section-description">App information and data management</p>
              
              <div className="about-content">
                <div className="about-item">
                  <strong>Logged-in User:</strong>
                  <span className="user-email-info">
                    {loggedInUserEmail || 'Not logged in'}
                    {loggedInUserEmail && (
                      <button 
                        className="copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(loggedInUserEmail);
                          setSaveStatus('✅ Email copied to clipboard!');
                          setTimeout(() => setSaveStatus(''), 2000);
                        }}
                        title="Copy Email"
                      >
                        📋
                      </button>
                    )}
                  </span>
                </div>
                
                <div className="about-item">
                  <strong>Version:</strong>
                  <span>{appVersion}</span>
                </div>
                
                <div className="about-item">
                  <strong>Last Updated:</strong>
                  <span>{lastUpdated}</span>
                </div>
                
                <div className="about-item">
                  <strong>Support:</strong>
                  <span>support@finovo.app</span>
                </div>
                
                <div className="about-item">
                  <strong>Database Status:</strong>
                  <span className={`db-status ${isAuthenticated ? 'connected' : 'disconnected'}`}>
                    {databaseStatus}
                  </span>
                </div>
                
                <div className="about-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={handleExport} 
                    disabled={saving || !isAuthenticated}
                    title={!isAuthenticated ? "Please log in to export data" : ""}
                  >
                    📥 Export Data
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={handleReset} 
                    disabled={saving || !isAuthenticated}
                    title={!isAuthenticated ? "Please log in to reset settings" : ""}
                  >
                    🔄 Reset All Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔑 Change Password</h3>
              <button 
                className="modal-close"
                onClick={() => !saving && setShowPasswordModal(false)}
                disabled={saving}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="setting-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  placeholder="Enter your current password"
                  disabled={saving}
                  className={passwordErrors.currentPassword ? 'error' : ''}
                />
                {passwordErrors.currentPassword && (
                  <small className="error-text">{passwordErrors.currentPassword}</small>
                )}
              </div>
              <div className="setting-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder="Enter new password (min 8 characters)"
                  disabled={saving}
                  className={passwordErrors.newPassword ? 'error' : ''}
                />
                {passwordErrors.newPassword && (
                  <small className="error-text">{passwordErrors.newPassword}</small>
                )}
                <small className="password-requirements">
                  Password must be at least 8 characters and include:
                  <br />• One uppercase letter
                  <br />• One lowercase letter  
                  <br />• One number
                  <br />• One special character
                </small>
              </div>
              <div className="setting-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  disabled={saving}
                  className={passwordErrors.confirmPassword ? 'error' : ''}
                />
                {passwordErrors.confirmPassword && (
                  <small className="error-text">{passwordErrors.confirmPassword}</small>
                )}
              </div>
              
              <div className="password-security-note">
                <div className="security-icon">🔒</div>
                <div className="security-content">
                  <h4>Security Note:</h4>
                  <ul>
                    <li>After changing your password, you will be automatically logged out</li>
                    <li>You will need to log in again with your new password</li>
                    <li>Make sure to remember your new password</li>
                    <li>Consider using a password manager for better security</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => !saving && setShowPasswordModal(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handlePasswordChange}
                disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                {saving ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tenant ID Change Modal */}
      {showTenantIdModal && (
        <div className="modal-overlay" onClick={() => !saving && !isGeneratingTenantId && setShowTenantIdModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔢 Tenant ID Management</h3>
              <button 
                className="modal-close"
                onClick={() => !saving && !isGeneratingTenantId && setShowTenantIdModal(false)}
                disabled={saving || isGeneratingTenantId}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="setting-group">
                <label>Current Tenant ID</label>
                <input
                  type="text"
                  value={actualTenantId || 'Not set'}
                  disabled
                  className="readonly-input"
                  readOnly
                />
                <small>Your current 6-digit tenant identifier</small>
              </div>
              
              <div className="setting-group">
                <label>New Tenant ID</label>
                <div className="tenant-id-input-group">
                  <input
                    type="text"
                    value={tenantIdData.newTenantId}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setTenantIdData(prev => ({...prev, newTenantId: value}));
                    }}
                    placeholder="Enter 6-digit number"
                    disabled={saving || isGeneratingTenantId}
                    maxLength="6"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <button 
                    className="btn-generate-tenant-id"
                    onClick={handleGenerateTenantId}
                    disabled={saving || isGeneratingTenantId}
                  >
                    {isGeneratingTenantId ? 'Generating...' : 'Generate Random'}
                  </button>
                </div>
                <small>Must be exactly 6 digits (numbers only, e.g., 123456)</small>
              </div>
              
              <div className="setting-group">
                <label>Confirm New Tenant ID</label>
                <input
                  type="text"
                  value={tenantIdData.confirmTenantId}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTenantIdData(prev => ({...prev, confirmTenantId: value}));
                  }}
                  placeholder="Confirm 6-digit number"
                  disabled={saving || isGeneratingTenantId}
                  maxLength="6"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <small>Re-enter the 6-digit number to confirm</small>
              </div>
              
              <div className="tenant-id-warning">
                <div className="warning-icon">⚠️</div>
                <div className="warning-content">
                  <h4>Important Note:</h4>
                  <ul>
                    <li><strong>Tenant ID must be exactly 6 digits</strong> (e.g., 123456)</li>
                    <li>This ID is used to uniquely identify your account in the system</li>
                    <li>Each Tenant ID must be unique across all users</li>
                    <li>Keep this ID secure and confidential</li>
                    <li>Changing Tenant ID may affect linked services</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => !saving && !isGeneratingTenantId && setShowTenantIdModal(false)}
                disabled={saving || isGeneratingTenantId}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleUpdateTenantId}
                disabled={saving || isGeneratingTenantId || 
                         tenantIdData.newTenantId.length !== 6 || 
                         tenantIdData.confirmTenantId.length !== 6 ||
                         tenantIdData.newTenantId !== tenantIdData.confirmTenantId}
              >
                {saving ? 'Updating...' : 'Update Tenant ID'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication Modal */}
      {showTwoFactorModal && (
        <div className="modal-overlay" onClick={() => !twoFactorLoading && setShowTwoFactorModal(false)}>
          <div className="modal-content two-factor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {twoFactorData.step === 'pin-setup' && '🔐 Setup 6-Digit PIN'}
              </h3>
              <button 
                className="modal-close"
                onClick={() => !twoFactorLoading && setShowTwoFactorModal(false)}
                disabled={twoFactorLoading}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {twoFactorData.step === 'pin-setup' && (
                <div className="two-factor-step">
                  <div className="step-description">
                    <p>Create a 6-digit PIN for two-factor authentication. You'll need to enter this PIN periodically for security verification.</p>
                    <p><strong>Note:</strong> The PIN will be saved securely in the database.</p>
                  </div>
                  
                  <div className="setting-group">
                    <label>Enter 6-digit PIN:</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="6"
                      placeholder="123456"
                      value={twoFactorData.pin}
                      onChange={(e) => setTwoFactorData(prev => ({
                        ...prev, 
                        pin: e.target.value.replace(/\D/g, '').slice(0, 6)
                      }))}
                      className="pin-input"
                      disabled={twoFactorLoading}
                      autoFocus
                    />
                    <small>Must be exactly 6 digits (numbers only)</small>
                  </div>

                  <div className="setting-group">
                    <label>Confirm 6-digit PIN:</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="6"
                      placeholder="123456"
                      value={twoFactorData.confirmPin}
                      onChange={(e) => setTwoFactorData(prev => ({
                        ...prev, 
                        confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6)
                      }))}
                      className="pin-input"
                      disabled={twoFactorLoading}
                    />
                  </div>
                  
                  <div className="modal-footer">
                    <button 
                      className="btn-secondary" 
                      onClick={() => !twoFactorLoading && setShowTwoFactorModal(false)}
                      disabled={twoFactorLoading}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn-save" 
                      onClick={setupPin}
                      disabled={twoFactorLoading || twoFactorData.pin.length !== 6 || twoFactorData.confirmPin.length !== 6}
                    >
                      {twoFactorLoading ? 'Setting Up...' : 'Setup PIN'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Signout Confirmation Modal */}
      {showSignoutModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowSignoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚪 {t('signOut')}</h3>
              <button 
                className="modal-close"
                onClick={() => !saving && setShowSignoutModal(false)}
                disabled={saving}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="signout-warning">
                <div className="warning-icon">⚠️</div>
                <div className="warning-content">
                  <h4>{t('confirmSignOut')}</h4>
                  <p>{t('signOutWarning')}</p>
                  <ul>
                    <li>{t('unsavedChangesLost')}</li>
                    <li>{t('redirectToLogin')}</li>
                    <li>{t('sessionDataCleared')}</li>
                    {twoFactorStatus.isEnabled && (
                      <li>🛡️ {t('twoFactorRemainsEnabled') || 'Two-factor authentication will remain enabled'}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => !saving && setShowSignoutModal(false)}
                disabled={saving}
              >
                {t('cancel')}
              </button>
              <button 
                className="btn-danger" 
                onClick={handleSignout}
                disabled={saving}
              >
                {saving ? t('signingOut') : t('yesSignOut')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;