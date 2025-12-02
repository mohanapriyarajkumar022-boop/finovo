// src/pages/settings.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import './Settings.css';

const Settings = () => {
  const { settings, updateSettings, resetSettings, loading, error } = useSettings();
  const { t, language, updateLanguage } = useLanguage();
  const { theme, updateTheme, updateThemeSettings } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [saveStatus, setSaveStatus] = useState('');
  const [localSettings, setLocalSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [autoShowTwoFactorModal, setAutoShowTwoFactorModal] = useState(false); // NEW: For auto popup
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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
  const [hasAutoShown2FA, setHasAutoShown2FA] = useState(false); // NEW: Prevent multiple auto-shows

  // ✅ Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('sessionToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
    const tenantId = getTenantId();
    
    const headers = {
      'Content-Type': 'application/json',
      'Tenant-ID': tenantId
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // ✅ Get tenant ID
  const getTenantId = () => {
    let tenantId = localStorage.getItem('tenantId') || localStorage.getItem('userId');
    
    if (!tenantId) {
      tenantId = 'tenant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('tenantId', tenantId);
    }
    
    return tenantId;
  };

  // ✅ Check authentication
  const checkAuthentication = () => {
    const token = localStorage.getItem('sessionToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    return !!(token && userId);
  };

  // ✅ Require authentication for actions
  const requireAuthentication = (action = 'perform this action') => {
    const isAuthenticated = checkAuthentication();
    if (!isAuthenticated) {
      setSaveStatus('❌ ' + (t('authenticationRequired') || 'Please log in to ' + action));
      setTimeout(() => setSaveStatus(''), 5000);
      return false;
    }
    return true;
  };

  // ✅ Check 2FA status from backend
  const checkTwoFactorStatusFromBackend = async () => {
    try {
      const headers = getAuthHeaders();
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, skipping 2FA check');
        return {
          isEnabled: false,
          needsVerification: false,
          nextVerificationDate: null,
          lastVerification: null
        };
      }
      
      const response = await fetch('http://localhost:5000/api/two-factor/status', {
        method: 'GET',
        headers: headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log('2FA status from backend:', data);
        return {
          isEnabled: data.enabled || false,
          needsVerification: data.verificationRequired || false,
          nextVerificationDate: data.nextVerificationDate || null,
          lastVerification: data.lastVerification || null
        };
      } else {
        console.log('Failed to get 2FA status:', response.status);
        return {
          isEnabled: false,
          needsVerification: false,
          nextVerificationDate: null,
          lastVerification: null
        };
      }
    } catch (error) {
      console.log('Error checking 2FA status from backend:', error.message);
      return {
        isEnabled: false,
        needsVerification: false,
        nextVerificationDate: null,
        lastVerification: null
      };
    }
  };

  // ✅ NEW: Check if we should auto-show 2FA modal
  const shouldAutoShow2FAModal = (status) => {
    if (!status.isEnabled) return false;
    if (!status.needsVerification) return false;
    
    // Check if we've already shown it in this session
    const hasShownInSession = sessionStorage.getItem('2FAAutoShown');
    if (hasShownInSession) return false;
    
    // Check if it's actually overdue
    if (status.nextVerificationDate) {
      const nextVerification = new Date(status.nextVerificationDate);
      const now = new Date();
      return now >= nextVerification;
    }
    
    return status.needsVerification;
  };

  // ✅ Initialize local settings and check 2FA status
  useEffect(() => {
    const initializeSettings = async () => {
      if (settings) {
        const initialSettings = JSON.parse(JSON.stringify(settings));
        setLocalSettings(initialSettings);
        
        if (initialSettings.profile?.profilePhoto) {
          setImagePreview(initialSettings.profile.profilePhoto);
        }
        
        // Always check 2FA status from backend on initialization
        setIsChecking2FA(true);
        try {
          const backend2FAStatus = await checkTwoFactorStatusFromBackend();
          console.log('Backend 2FA status on init:', backend2FAStatus);
          
          setTwoFactorStatus(backend2FAStatus);
          setRequires2FAVerification(backend2FAStatus.needsVerification);
          
          // Check if we should auto-show the 2FA modal
          if (shouldAutoShow2FAModal(backend2FAStatus) && !hasAutoShown2FA) {
            console.log('Auto-showing 2FA verification modal');
            setAutoShowTwoFactorModal(true);
            setTwoFactorData({
              step: 'verify-pin',
              pin: '',
              confirmPin: ''
            });
            setHasAutoShown2FA(true);
            // Mark as shown in session storage
            sessionStorage.setItem('2FAAutoShown', 'true');
          }
          
          // Update local settings to match backend
          if (initialSettings.privacy?.twoFactorAuth !== backend2FAStatus.isEnabled) {
            const updatedSettings = {
              ...initialSettings,
              privacy: {
                ...initialSettings.privacy,
                twoFactorAuth: backend2FAStatus.isEnabled
              }
            };
            setLocalSettings(updatedSettings);
            
            // Also store in localStorage for quick access
            localStorage.setItem('twoFactorEnabled', backend2FAStatus.isEnabled.toString());
            if (backend2FAStatus.isEnabled) {
              localStorage.setItem('last2FACheck', new Date().toISOString());
            }
          }
        } catch (error) {
          console.error('Error initializing 2FA status:', error);
        } finally {
          setIsChecking2FA(false);
        }
      }
    };

    initializeSettings();
  }, [settings]);

  // ✅ Check 2FA status when privacy tab is active or when 2FA is toggled
  useEffect(() => {
    const check2FAStatus = async () => {
      if ((activeTab === 'privacy' || twoFactorLoading) && checkAuthentication()) {
        try {
          const headers = getAuthHeaders();
          
          // Check verification requirement
          const verificationResponse = await fetch('http://localhost:5000/api/two-factor/verification-required', {
            method: 'GET',
            headers: headers
          });

          if (verificationResponse.ok) {
            const verificationData = await verificationResponse.json();
            setRequires2FAVerification(verificationData.required || false);
            
            // NEW: Auto-show modal if verification is required
            if (verificationData.required && !hasAutoShown2FA && !autoShowTwoFactorModal) {
              console.log('Verification required, auto-showing modal');
              setAutoShowTwoFactorModal(true);
              setTwoFactorData({
                step: 'verify-pin',
                pin: '',
                confirmPin: ''
              });
              setHasAutoShown2FA(true);
              sessionStorage.setItem('2FAAutoShown', 'true');
            }
          }
          
          // Get full 2FA status
          const statusResponse = await fetch('http://localhost:5000/api/two-factor/status', {
            method: 'GET',
            headers: headers
          });

          if (statusResponse.ok) {
            const statusData = await response.json();
            const newStatus = {
              isEnabled: statusData.enabled || false,
              needsVerification: statusData.verificationRequired || false,
              nextVerificationDate: statusData.nextVerificationDate || null,
              lastVerification: statusData.lastVerification || null
            };
            
            setTwoFactorStatus(newStatus);
            
            // NEW: Auto-show modal if needed
            if (shouldAutoShow2FAModal(newStatus) && !hasAutoShown2FA && !autoShowTwoFactorModal) {
              console.log('Auto-showing 2FA modal from status check');
              setAutoShowTwoFactorModal(true);
              setTwoFactorData({
                step: 'verify-pin',
                pin: '',
                confirmPin: ''
              });
              setHasAutoShown2FA(true);
              sessionStorage.setItem('2FAAutoShown', 'true');
            }
            
            // Update local settings if different
            if (localSettings && localSettings.privacy?.twoFactorAuth !== newStatus.isEnabled) {
              updateLocalSetting('privacy', 'twoFactorAuth', newStatus.isEnabled);
            }
          }
        } catch (error) {
          console.log('Error checking 2FA status in effect:', error.message);
        }
      }
    };

    check2FAStatus();
  }, [activeTab, twoFactorLoading, localSettings]);

  // ✅ NEW: Handle auto-show modal close
  const handleAutoModalClose = () => {
    setAutoShowTwoFactorModal(false);
    // Don't reset hasAutoShown2FA so we don't show it again
  };

  // ✅ Update local setting
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
      
      // Special handling for 2FA to ensure consistency
      if (section === 'privacy' && key === 'twoFactorAuth') {
        // Update twoFactorStatus to match UI
        setTwoFactorStatus(prevStatus => ({
          ...prevStatus,
          isEnabled: value
        }));
      }
      
      return newSettings;
    });
  };

  // ✅ Handle save settings
  const handleSave = async (section) => {
    if (!localSettings || !localSettings[section]) {
      setSaveStatus('❌ ' + (t('noSettingsToSave') || 'No settings to save'));
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    setSaving(true);
    
    const settingsData = {
      ...localSettings[section],
      tenantId: getTenantId()
    };
    
    const result = await updateSettings(section, settingsData);
    setSaving(false);
    
    if (result.success) {
      setSaveStatus('✅ ' + (t('settingsSaved') || 'Settings saved successfully!'));
      setTimeout(() => setSaveStatus(''), 3000);
    } else {
      setSaveStatus(`❌ ${result.error || (t('saveFailed') || 'Failed to save')}`);
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  // ✅ Send notification email
  const sendNotificationEmail = async (type) => {
    try {
      if (!checkAuthentication()) {
        console.log('User not authenticated, skipping notification email');
        return;
      }

      const headers = getAuthHeaders();
      const userEmail = localStorage.getItem('userEmail');
      const userName = localStorage.getItem('userName') || 'User';
      
      if (!userEmail) {
        console.log('No user email found for notification');
        return;
      }

      const response = await fetch('http://localhost:5000/api/notifications/send', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          type: type,
          email: userEmail,
          name: userName,
          tenantId: getTenantId()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Notification email sent successfully');
      } else {
        console.log('❌ Failed to send notification email:', data.message);
      }
    } catch (error) {
      console.log('Error sending notification email:', error.message);
    }
  };

  // ✅ Language change handler
  const handleLanguageChange = async (newLanguage) => {
    if (!localSettings || saving) return;
    
    setSaving(true);
    
    try {
      // Update local state
      updateLocalSetting('language', 'appLanguage', newLanguage);
      updateLocalSetting('language', 'locale', newLanguage);
      
      // Update language context
      const languageResult = await updateLanguage(newLanguage);
      
      if (languageResult.success) {
        // Prepare updated settings
        const updatedLanguageSettings = {
          ...localSettings.language,
          appLanguage: newLanguage,
          locale: newLanguage,
          tenantId: getTenantId()
        };
        
        // Save to backend
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
          setSaveStatus(`✅ ${t('languageChanged') || 'Language changed to'} ${languageName}!`);
        }
      } else {
        setSaveStatus('❌ ' + (t('languageChangeFailed') || 'Failed to change language'));
      }
    } catch (error) {
      console.log('Language change error:', error);
      setSaveStatus('❌ ' + (t('languageChangeError') || 'Error changing language'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Currency change handler
  const handleCurrencyChange = async (newCurrency) => {
    if (!localSettings || saving) return;
    
    setSaving(true);
    
    try {
      // Update local state
      updateLocalSetting('language', 'currency', newCurrency);
      
      // Prepare updated settings
      const updatedLanguageSettings = {
        ...localSettings.language,
        currency: newCurrency,
        tenantId: getTenantId()
      };
      
      // Save to backend
      const result = await updateSettings('language', updatedLanguageSettings);
      
      if (result.success) {
        setSaveStatus(`✅ ${t('currencyChanged') || 'Currency changed to'} ${newCurrency}!`);
        
        // Store in localStorage
        localStorage.setItem('userCurrency', newCurrency);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('currencyChanged', {
          detail: { currency: newCurrency }
        }));
      } else {
        setSaveStatus('❌ ' + (t('currencyChangeFailed') || 'Failed to change currency'));
      }
    } catch (error) {
      console.log('Currency change error:', error);
      setSaveStatus('❌ ' + (t('currencyChangeError') || 'Error changing currency'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Timezone change handler
  const handleTimezoneChange = async (newTimezone) => {
    if (!localSettings || saving) return;
    
    setSaving(true);
    
    try {
      // Update local state
      updateLocalSetting('language', 'timezone', newTimezone);
      
      // Prepare updated settings
      const updatedLanguageSettings = {
        ...localSettings.language,
        timezone: newTimezone,
        tenantId: getTenantId()
      };
      
      // Save to backend
      const result = await updateSettings('language', updatedLanguageSettings);
      
      if (result.success) {
        setSaveStatus(`✅ ${t('timezoneChanged') || 'Timezone changed to'} ${newTimezone}!`);
        
        // Store in localStorage
        localStorage.setItem('userTimezone', newTimezone);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('timezoneChanged', {
          detail: { timezone: newTimezone }
        }));
      } else {
        setSaveStatus('❌ ' + (t('timezoneChangeFailed') || 'Failed to change timezone'));
      }
    } catch (error) {
      console.log('Timezone change error:', error);
      setSaveStatus('❌ ' + (t('timezoneChangeError') || 'Error changing timezone'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Theme change handler
  const handleThemeChange = async (newTheme) => {
    if (!localSettings || saving) return;
    
    // Update local state
    updateLocalSetting('theme', 'mode', newTheme);
    
    setSaving(true);
    
    try {
      // Update theme context
      updateTheme(newTheme);
      
      // Prepare updated settings
      const updatedThemeSettings = {
        ...localSettings.theme,
        mode: newTheme,
        tenantId: getTenantId()
      };
      
      // Save to backend
      const result = await updateSettings('theme', updatedThemeSettings);
      
      if (result.success) {
        setSaveStatus(`✅ ${t('themeChanged') || 'Theme changed to'} ${newTheme}!`);
        
        // Update theme context with all settings
        updateThemeSettings({
          mode: newTheme,
          primaryColor: updatedThemeSettings.primaryColor,
          fontSize: updatedThemeSettings.fontSize,
          fontFamily: updatedThemeSettings.fontFamily
        });
      } else {
        setSaveStatus('❌ ' + (t('themeChangeFailed') || 'Failed to change theme'));
      }
    } catch (error) {
      console.log('Theme change error:', error);
      setSaveStatus('❌ ' + (t('themeChangeError') || 'Error changing theme'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Primary color change
  const handlePrimaryColorChange = async (color) => {
    if (!localSettings || saving) return;
    
    // Update local state
    updateLocalSetting('theme', 'primaryColor', color);
    
    // Update theme context
    updateThemeSettings({
      mode: theme,
      primaryColor: color,
      fontSize: localSettings.theme?.fontSize,
      fontFamily: localSettings.theme?.fontFamily
    });
    
    // Auto-save
    setSaving(true);
    try {
      const updatedThemeSettings = {
        ...localSettings.theme,
        primaryColor: color,
        tenantId: getTenantId()
      };
      
      const result = await updateSettings('theme', updatedThemeSettings);
      
      if (result.success) {
        setSaveStatus(`✅ ${t('colorChanged') || 'Primary color changed!'}`);
      } else {
        setSaveStatus('❌ ' + (t('colorChangeFailed') || 'Failed to save color'));
      }
    } catch (error) {
      console.log('Color change error:', error);
      setSaveStatus('❌ ' + (t('colorChangeError') || 'Error changing color'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // ✅ Font size change
  const handleFontSizeChange = async (size) => {
    if (!localSettings || saving) return;
    
    // Update local state
    updateLocalSetting('theme', 'fontSize', size);
    
    // Update theme context
    updateThemeSettings({
      mode: theme,
      primaryColor: localSettings.theme?.primaryColor,
      fontSize: size,
      fontFamily: localSettings.theme?.fontFamily
    });
    
    // Auto-save
    setSaving(true);
    try {
      const updatedThemeSettings = {
        ...localSettings.theme,
        fontSize: size,
        tenantId: getTenantId()
      };
      
      const result = await updateSettings('theme', updatedThemeSettings);
      
      if (result.success) {
        setSaveStatus(`✅ ${t('fontSizeChanged') || 'Font size changed!'}`);
      } else {
        setSaveStatus('❌ ' + (t('fontSizeChangeFailed') || 'Failed to save font size'));
      }
    } catch (error) {
      console.log('Font size change error:', error);
      setSaveStatus('❌ ' + (t('fontSizeChangeError') || 'Error changing font size'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // ✅ Font family change
  const handleFontFamilyChange = async (family) => {
    if (!localSettings || saving) return;
    
    // Update local state
    updateLocalSetting('theme', 'fontFamily', family);
    
    // Update theme context
    updateThemeSettings({
      mode: theme,
      primaryColor: localSettings.theme?.primaryColor,
      fontSize: localSettings.theme?.fontSize,
      fontFamily: family
    });
    
    // Auto-save
    setSaving(true);
    try {
      const updatedThemeSettings = {
        ...localSettings.theme,
        fontFamily: family,
        tenantId: getTenantId()
      };
      
      const result = await updateSettings('theme', updatedThemeSettings);
      
      if (result.success) {
        setSaveStatus(`✅ ${t('fontFamilyChanged') || 'Font family changed!'}`);
      } else {
        setSaveStatus('❌ ' + (t('fontFamilyChangeFailed') || 'Failed to save font family'));
      }
    } catch (error) {
      console.log('Font family change error:', error);
      setSaveStatus('❌ ' + (t('fontFamilyChangeError') || 'Error changing font family'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // ✅ Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSaveStatus('❌ ' + (t('imageSizeError') || 'Image size should be less than 5MB'));
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }
      
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        updateLocalSetting('profile', 'profilePhoto', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ Password change
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveStatus('❌ ' + (t('passwordsNotMatch') || 'Passwords do not match'));
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setSaveStatus('❌ ' + (t('passwordMinLength') || 'Password must be at least 6 characters'));
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (!requireAuthentication('change your password')) {
      return;
    }

    setSaving(true);
    try {
      const headers = getAuthHeaders();
      
      const response = await fetch('http://localhost:5000/api/settings/change-password', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          tenantId: getTenantId()
        })
      });

      const data = await response.json();
      setSaving(false);

      if (data.success) {
        setSaveStatus('✅ ' + (t('passwordChanged') || 'Password changed successfully!'));
        
        // Send notification if enabled
        if (localSettings.notifications?.email) {
          await sendNotificationEmail('passwordChanged');
        }
        
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus(`❌ ${data.message}`);
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      setSaving(false);
      setSaveStatus('❌ ' + (t('passwordChangeError') || 'Error changing password'));
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Two-factor authentication toggle handler - FIXED
  const handleTwoFactorAuth = async (enable) => {
    console.log('handleTwoFactorAuth called with enable:', enable, 'current status:', twoFactorStatus.isEnabled);
    
    if (!requireAuthentication('enable two-factor authentication')) {
      // Revert UI change if not authenticated
      updateLocalSetting('privacy', 'twoFactorAuth', !enable);
      return;
    }

    if (!enable) {
      // Disable 2FA
      setTwoFactorLoading(true);
      try {
        const headers = getAuthHeaders();
        
        const response = await fetch('http://localhost:5000/api/two-factor/disable', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            tenantId: getTenantId()
          })
        });

        const data = await response.json();
        console.log('Disable 2FA response:', data);
        
        if (data.success) {
          // Update state immediately
          setTwoFactorStatus({
            isEnabled: false,
            needsVerification: false,
            nextVerificationDate: null,
            lastVerification: null
          });
          setRequires2FAVerification(false);
          
          // Update local settings
          updateLocalSetting('privacy', 'twoFactorAuth', false);
          
          // Clear localStorage
          localStorage.removeItem('twoFactorEnabled');
          localStorage.removeItem('last2FACheck');
          
          setSaveStatus('✅ ' + (t('twoFactorDisabled') || 'Two-factor authentication disabled!'));
          
          // Send notification if enabled
          if (localSettings.notifications?.email) {
            await sendNotificationEmail('twoFactorDisabled');
          }
        } else {
          setSaveStatus('❌ ' + (data.message || t('twoFactorDisableFailed') || 'Failed to disable two-factor authentication'));
          // Revert UI change
          updateLocalSetting('privacy', 'twoFactorAuth', true);
        }
      } catch (error) {
        console.log('2FA disable error:', error);
        setSaveStatus('❌ ' + (t('twoFactorDisableError') || 'Error disabling two-factor authentication'));
        // Revert UI change
        updateLocalSetting('privacy', 'twoFactorAuth', true);
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

  // ✅ Setup PIN
  const setupPin = async () => {
    if (!twoFactorData.pin || twoFactorData.pin.length !== 6 || !/^\d+$/.test(twoFactorData.pin)) {
      setSaveStatus('❌ ' + (t('pinMustBe6Digits') || 'PIN must be exactly 6 digits'));
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (twoFactorData.pin !== twoFactorData.confirmPin) {
      setSaveStatus('❌ ' + (t('pinsNotMatch') || 'PINs do not match'));
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    setTwoFactorLoading(true);
    try {
      const headers = getAuthHeaders();
      
      const response = await fetch('http://localhost:5000/api/two-factor/setup', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          pin: twoFactorData.pin,
          tenantId: getTenantId()
        })
      });

      const data = await response.json();
      console.log('Setup PIN response:', data);
      
      if (data.success) {
        // Update state immediately
        const nextVerificationDate = data.nextVerificationDate ? new Date(data.nextVerificationDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        
        setTwoFactorStatus({
          isEnabled: true,
          needsVerification: false,
          nextVerificationDate: nextVerificationDate,
          lastVerification: new Date()
        });
        setRequires2FAVerification(false);
        
        // Update local settings
        updateLocalSetting('privacy', 'twoFactorAuth', true);
        
        // Store in localStorage
        localStorage.setItem('twoFactorEnabled', 'true');
        localStorage.setItem('last2FASetup', new Date().toISOString());
        localStorage.setItem('last2FACheck', new Date().toISOString());
        
        // Send notification if enabled
        if (localSettings.notifications?.email) {
          await sendNotificationEmail('twoFactorEnabled');
        }
        
        setShowTwoFactorModal(false);
        setTwoFactorData({
          step: 'pin-setup',
          pin: '',
          confirmPin: ''
        });
        
        setSaveStatus('✅ ' + (t('twoFactorEnabled') || 'Two-factor authentication enabled with 6-digit PIN!'));
        
        // Force refresh of 2FA status
        setTimeout(() => {
          checkTwoFactorStatusFromBackend().then(status => {
            setTwoFactorStatus(status);
            updateLocalSetting('privacy', 'twoFactorAuth', status.isEnabled);
          });
        }, 500);
      } else {
        setSaveStatus('❌ ' + (data.message || t('pinSetupFailed') || 'Failed to setup PIN'));
        updateLocalSetting('privacy', 'twoFactorAuth', false);
      }
    } catch (error) {
      console.log('PIN setup error:', error);
      setSaveStatus('❌ ' + (t('pinSetupError') || 'Error setting up PIN'));
      updateLocalSetting('privacy', 'twoFactorAuth', false);
    } finally {
      setTwoFactorLoading(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Handle verification
  const handleVerification = async () => {
    if (!requireAuthentication('verify two-factor authentication')) {
      return;
    }

    // Show verification modal
    setShowTwoFactorModal(true);
    setTwoFactorData({
      step: 'verify-pin',
      pin: '',
      confirmPin: ''
    });
  };

  // ✅ Verify PIN for periodic verification
  const verifyPinForVerification = async () => {
    if (!twoFactorData.pin || twoFactorData.pin.length !== 6) {
      setSaveStatus('❌ ' + (t('pinMustBe6Digits') || 'PIN must be exactly 6 digits'));
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    setTwoFactorLoading(true);
    try {
      const headers = getAuthHeaders();
      
      const response = await fetch('http://localhost:5000/api/two-factor/verify', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          pin: twoFactorData.pin,
          tenantId: getTenantId()
        })
      });

      const data = await response.json();
      console.log('Verify PIN response:', data);
      
      if (data.success) {
        // Update verification status
        const nextVerificationDate = data.nextVerificationDate ? new Date(data.nextVerificationDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        
        setTwoFactorStatus(prev => ({
          ...prev,
          needsVerification: false,
          nextVerificationDate: nextVerificationDate,
          lastVerification: new Date()
        }));
        setRequires2FAVerification(false);
        
        // Close both modals (regular and auto)
        setShowTwoFactorModal(false);
        setAutoShowTwoFactorModal(false);
        
        setTwoFactorData({
          step: 'pin-setup',
          pin: '',
          confirmPin: ''
        });
        
        setSaveStatus('✅ ' + (t('verificationSuccessful') || 'Verification successful!'));
        
        // Store verification timestamp
        localStorage.setItem('last2FAVerification', new Date().toISOString());
        localStorage.setItem('last2FACheck', new Date().toISOString());
        
        // Force refresh of 2FA status
        setTimeout(() => {
          checkTwoFactorStatusFromBackend().then(status => {
            setTwoFactorStatus(status);
          });
        }, 500);
      } else {
        setSaveStatus('❌ ' + (data.message || t('verificationFailed') || 'Verification failed'));
      }
    } catch (error) {
      console.log('Verification error:', error);
      setSaveStatus('❌ ' + (t('verificationError') || 'Error during verification'));
    } finally {
      setTwoFactorLoading(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Periodic verification
  const handlePeriodicVerification = () => {
    handleVerification();
  };

  // ✅ Signout
  const handleSignout = async () => {
    try {
      setSaving(true);
      
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      const tenantId = getTenantId();
      
      if (token) {
        try {
          const headers = getAuthHeaders();
          const response = await fetch('http://localhost:5000/api/auth/logout', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              tenantId: tenantId
            })
          });
          
          if (response.ok) {
            console.log('Backend logout successful');
          }
        } catch (error) {
          console.log('Backend logout failed, continuing with client-side cleanup');
        }
      }
      
      // Clear all data
      const itemsToRemove = [
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
        '2FAAutoShown' // Clear the auto-shown flag
      ];
      
      itemsToRemove.forEach(item => {
        localStorage.removeItem(item);
        sessionStorage.removeItem(item);
      });
      
      // Clear cookies
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      setSaving(false);
      setShowSignoutModal(false);
      
      setSaveStatus('✅ ' + (t('signedOut') || 'Successfully signed out!'));
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
    } catch (error) {
      console.log('Signout error:', error);
      setSaving(false);
      setSaveStatus('❌ ' + (t('signoutError') || 'Error during signout'));
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Reset settings
  const handleReset = async () => {
    if (window.confirm('⚠️ ' + (t('resetConfirm') || 'Are you sure you want to reset all settings to default? This cannot be undone.'))) {
      setSaving(true);
      const result = await resetSettings(getTenantId());
      setSaving(false);
      
      if (result.success) {
        setSaveStatus('✅ ' + (t('settingsReset') || 'Settings reset successfully!'));
        
        // Send notification if enabled
        if (localSettings.notifications?.email) {
          await sendNotificationEmail('settingsReset');
        }
        
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('❌ ' + (t('resetError') || 'Error resetting settings'));
        setTimeout(() => setSaveStatus(''), 3000);
      }
    }
  };

  // ✅ Export data
  const handleExport = async () => {
    if (!requireAuthentication('export your data')) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      
      const response = await fetch('http://localhost:5000/api/settings/export-data', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          tenantId: getTenantId()
        })
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finovo-settings-${getTenantId()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSaveStatus('✅ ' + (t('dataExported') || 'Data exported successfully!'));
      
      // Send notification if enabled
      if (localSettings.notifications?.email) {
        await sendNotificationEmail('dataExported');
      }
      
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.log('Export error:', error);
      setSaveStatus('❌ ' + (t('exportError') || 'Error exporting data'));
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  if (loading || !localSettings || isChecking2FA) {
    return (
      <div className="settings-loading">
        <div className="loader-spinner"></div>
        <p>{t('loadingSettings') || 'Loading your settings...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-error">
        <div className="error-icon">⚠️</div>
        <h2>{t('loadSettingsFailed') || 'Failed to Load Settings'}</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-save">
          {t('reloadPage') || 'Reload Page'}
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: t('profile') || 'Profile', icon: '👤' },
    { id: 'account', label: t('account') || 'Account', icon: '🏢' },
    { id: 'theme', label: t('theme') || 'Theme', icon: '🎨' },
    { id: 'notifications', label: t('notifications') || 'Notifications', icon: '🔔' },
    { id: 'privacy', label: t('privacy') || 'Privacy', icon: '🔒' },
    { id: 'appearance', label: t('appearance') || 'Appearance', icon: '✨' },
    { id: 'language', label: t('language') || 'Language & Region', icon: '🌍' },
    { id: 'performance', label: t('performance') || 'Performance', icon: '⚡' },
    { id: 'accessibility', label: t('accessibility') || 'Accessibility', icon: '♿' },
    { id: 'about', label: t('about') || 'About', icon: 'ℹ️' }
  ];

  const userEmail = localStorage.getItem('userEmail') || localSettings.profile?.email || 'user@example.com';

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div>
          <h1>⚙️ {t('settings') || 'Settings'}</h1>
          <p className="settings-subtitle">{t('settingsDescription') || 'Manage your account preferences and app behavior'}</p>
        </div>
        <div className="header-actions">
          {saveStatus && (
            <div className={`save-status ${saveStatus.includes('❌') ? 'error' : ''}`}>
              {saveStatus}
            </div>
          )}
          
          {requires2FAVerification && (
            <button 
              className="btn-verify-2fa"
              onClick={handlePeriodicVerification}
              title={t('verifyTwoFactor') || 'Verify two-factor authentication'}
              disabled={saving || twoFactorLoading}
            >
              🛡️ {t('verifySecurity') || 'Verify Security'}
            </button>
          )}
          
          <button 
            className="btn-signout"
            onClick={() => setShowSignoutModal(true)}
            disabled={saving}
            title={t('signOut') || 'Sign out from your account'}
          >
            🚪 {t('signOut') || 'Sign Out'}
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
              <h2>👤 {t('profileSettings') || 'Profile Settings'}</h2>
              <p className="section-description">{t('updateProfilePicture') || 'Update your profile picture and view your information'}</p>
              
              <div className="profile-header-section">
                <div className="profile-image-container">
                  <div className="profile-image-wrapper">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="profile-image" />
                    ) : (
                      <div className="profile-image-placeholder">
                        <span className="profile-initials">
                          {(localSettings.profile?.name || userEmail).charAt(0).toUpperCase()}
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
                    <h3>{localSettings.profile?.name || t('user') || 'User'}</h3>
                    <p className="profile-email">{userEmail}</p>
                    <small>{t('clickToUpload') || 'Click on the camera icon to upload a new photo'}</small>
                  </div>
                </div>
              </div>
              
              <div className="setting-group">
                <label>{t('displayName') || 'Display Name'}</label>
                <input
                  type="text"
                  value={localSettings.profile?.name || ''}
                  onChange={(e) => updateLocalSetting('profile', 'name', e.target.value)}
                  placeholder={t('enterDisplayName') || "Enter your display name"}
                  disabled={saving}
                />
              </div>
              
              <div className="setting-group">
                <label>{t('emailAddress') || 'Email Address'} ({t('readOnly') || 'Read Only'})</label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="readonly-input"
                />
                <small>{t('emailCannotChange') || 'Email cannot be changed here. Contact support to update.'}</small>
              </div>
              
              <div className="setting-group">
                <label>{t('phoneNumber') || 'Phone Number'}</label>
                <input
                  type="tel"
                  value={localSettings.profile?.phone || ''}
                  onChange={(e) => updateLocalSetting('profile', 'phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={saving}
                />
              </div>
              
              <div className="setting-group">
                <label>{t('bio') || 'Bio'}</label>
                <textarea
                  value={localSettings.profile?.bio || ''}
                  onChange={(e) => updateLocalSetting('profile', 'bio', e.target.value)}
                  placeholder={t('tellAboutYourself') || "Tell us about yourself..."}
                  rows="4"
                  disabled={saving}
                />
              </div>
              
              <button className="btn-save" onClick={() => handleSave('profile')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('saveProfile') || 'Save Profile')}
              </button>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="settings-section">
              <h2>🏢 {t('accountType') || 'Account Type'}</h2>
              <p className="section-description">{t('chooseAccountType') || 'Choose your account type based on your needs'}</p>
              
              <div className="account-type-cards">
                <div 
                  className={`account-card ${localSettings.account?.type === 'individual' ? 'selected' : ''}`}
                  onClick={() => updateLocalSetting('account', 'type', 'individual')}
                >
                  <div className="account-card-icon">👤</div>
                  <h3>{t('individual') || 'Individual'}</h3>
                  <p>{t('individualDescription') || 'Perfect for personal finance management'}</p>
                  <ul>
                    <li>{t('singleUserAccess') || 'Single user access'}</li>
                    <li>{t('personalBudgeting') || 'Personal budgeting tools'}</li>
                    <li>{t('transactionTracking') || 'Transaction tracking'}</li>
                    <li>{t('basicReports') || 'Basic reports'}</li>
                  </ul>
                </div>

                <div 
                  className={`account-card ${localSettings.account?.type === 'family' ? 'selected' : ''}`}
                  onClick={() => updateLocalSetting('account', 'type', 'family')}
                >
                  <div className="account-card-icon">👨‍👩‍👧‍👦</div>
                  <h3>{t('family') || 'Family'}</h3>
                  <p>{t('familyDescription') || 'Share finances with family members'}</p>
                  <ul>
                    <li>{t('upTo5Members') || 'Up to 5 family members'}</li>
                    <li>{t('sharedBudgets') || 'Shared budgets'}</li>
                    <li>{t('individualProfiles') || 'Individual profiles'}</li>
                    <li>{t('familyReports') || 'Family reports'}</li>
                  </ul>
                </div>

                <div 
                  className={`account-card ${localSettings.account?.type === 'business' ? 'selected' : ''}`}
                  onClick={() => updateLocalSetting('account', 'type', 'business')}
                >
                  <div className="account-card-icon">💼</div>
                  <h3>{t('business') || 'Business'}</h3>
                  <p>{t('businessDescription') || 'Advanced tools for business management'}</p>
                  <ul>
                    <li>{t('unlimitedUsers') || 'Unlimited users'}</li>
                    <li>{t('businessAnalytics') || 'Business analytics'}</li>
                    <li>{t('invoiceManagement') || 'Invoice management'}</li>
                    <li>{t('advancedReporting') || 'Advanced reporting'}</li>
                  </ul>
                </div>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('account')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('saveAccountType') || 'Save Account Type')}
              </button>
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div className="settings-section">
              <h2>🎨 {t('themeSettings') || 'Theme Settings'}</h2>
              <p className="section-description">{t('customizeAppearance') || 'Customize your app appearance'}</p>
              
              <div className="setting-group">
                <label>{t('themeMode') || 'Theme Mode'}</label>
                <select
                  value={localSettings.theme?.mode || 'light'}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="light">☀️ {t('lightMode') || 'Light Mode'}</option>
                  <option value="dark">🌙 {t('darkMode') || 'Dark Mode'}</option>
                  <option value="auto">🔄 {t('autoSystem') || 'Auto (System)'}</option>
                </select>
                <small>{t('themeChangesImmediate') || 'Theme changes will be applied immediately across the entire app'}</small>
              </div>
              
              <div className="setting-group">
                <label>{t('primaryColor') || 'Primary Color'}</label>
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
              </div>
              
              <div className="setting-group">
                <label>{t('fontSize') || 'Font Size'}</label>
                <select
                  value={localSettings.theme?.fontSize || 'medium'}
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="small">{t('small') || 'Small'} (14px)</option>
                  <option value="medium">{t('medium') || 'Medium'} (16px)</option>
                  <option value="large">{t('large') || 'Large'} (18px)</option>
                </select>
              </div>
              
              <div className="setting-group">
                <label>{t('fontFamily') || 'Font Family'}</label>
                <select
                  value={localSettings.theme?.fontFamily || 'Inter'}
                  onChange={(e) => handleFontFamilyChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
                </select>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('theme')} disabled={saving}>
                {saving ? (t('applying') || 'Applying...') : '💾 ' + (t('saveTheme') || 'Save Theme')}
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>🔔 {t('notificationSettings') || 'Notification Settings'}</h2>
              <p className="section-description">{t('controlNotifications') || 'Control how you receive notifications'}</p>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">📧 {t('emailNotifications') || 'Email Notifications'}</span>
                    <small>{t('receiveEmailUpdates') || 'Receive updates via email'}</small>
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
                    <span className="toggle-label">🔔 {t('pushNotifications') || 'Push Notifications'}</span>
                    <small>{t('realtimeAlerts') || 'Get real-time alerts'}</small>
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
                    <span className="toggle-label">💰 {t('transactionAlerts') || 'Transaction Alerts'}</span>
                    <small>{t('notifyNewTransactions') || 'Notify on new transactions'}</small>
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
                    <span className="toggle-label">📊 {t('weeklyReports') || 'Weekly Reports'}</span>
                    <small>{t('receiveWeeklySummaries') || 'Receive weekly financial summaries'}</small>
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
                    <span className="toggle-label">💵 {t('budgetAlerts') || 'Budget Alerts'}</span>
                    <small>{t('warnBudgetLimits') || 'Warn when nearing budget limits'}</small>
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
                    <span className="toggle-label">🔐 {t('securityAlerts') || 'Security Alerts'}</span>
                    <small>{t('importantSecurityNotifications') || 'Important security notifications'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.notifications?.securityAlerts || false}
                    onChange={(e) => updateLocalSetting('notifications', 'securityAlerts', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('notifications')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('saveNotifications') || 'Save Notifications')}
              </button>
            </div>
          )}

          {/* Privacy Tab - FIXED */}
          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h2>🔒 {t('privacySecurity') || 'Privacy & Security'}</h2>
              <p className="section-description">{t('managePrivacySecurity') || 'Manage your privacy and security preferences'}</p>
              
              <div className="setting-group">
                <label>{t('profileVisibility') || 'Profile Visibility'}</label>
                <select
                  value={localSettings.privacy?.profileVisibility || 'private'}
                  onChange={(e) => updateLocalSetting('privacy', 'profileVisibility', e.target.value)}
                  disabled={saving}
                >
                  <option value="public">🌐 {t('public') || 'Public'}</option>
                  <option value="private">🔒 {t('private') || 'Private'}</option>
                  <option value="friends">👥 {t('friendsOnly') || 'Friends Only'}</option>
                </select>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('showEmail') || 'Show Email'}</span>
                    <small>{t('displayEmailOnProfile') || 'Display email on profile'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.privacy?.showEmail || false}
                    onChange={(e) => updateLocalSetting('privacy', 'showEmail', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              {/* Two-Factor Authentication Section - FIXED */}
              <div className="two-factor-section">
                <div className="setting-group toggle-group">
                  <label>
                    <div>
                      <span className="toggle-label">{t('twoFactorAuth') || 'Two-Factor Authentication'}</span>
                      <small>
                        {twoFactorStatus.isEnabled 
                          ? (t('twoFactorEnabledDescription') || 'Extra security enabled with 6-digit PIN. Verification required every 15 days.')
                          : (t('twoFactorDisabledDescription') || 'Add extra security to your account with a 6-digit PIN. When enabled, you\'ll need to enter your PIN periodically.')
                        }
                        {twoFactorStatus.isEnabled && twoFactorStatus.nextVerificationDate && (
                          <div className="verification-info">
                            Next verification: {new Date(twoFactorStatus.nextVerificationDate).toLocaleDateString()}
                          </div>
                        )}
                      </small>
                    </div>
                    <input
                      type="checkbox"
                      checked={twoFactorStatus.isEnabled}
                      onChange={(e) => handleTwoFactorAuth(e.target.checked)}
                      disabled={saving || twoFactorLoading}
                    />
                  </label>
                </div>
                
                {twoFactorStatus.isEnabled && (
                  <div className="two-factor-status">
                    <div className={`status-badge ${requires2FAVerification ? 'verification-needed' : 'enabled'}`}>
                      <span className="status-icon">🛡️</span>
                      <span className="status-text">
                        {requires2FAVerification 
                          ? (t('twoFactorVerificationNeeded') || 'Two-factor authentication verification needed')
                          : (t('twoFactorActive') || 'Two-factor authentication is active with 6-digit PIN')
                        }
                        {twoFactorStatus.nextVerificationDate && !requires2FAVerification && (
                          <span className="next-verification">
                            • Next verification: {new Date(twoFactorStatus.nextVerificationDate).toLocaleDateString()}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="two-factor-actions">
                      <button 
                        className="btn-secondary btn-sm"
                        onClick={() => handleTwoFactorAuth(false)}
                        disabled={saving || twoFactorLoading}
                      >
                        {twoFactorLoading ? (t('disabling') || 'Disabling...') : (t('disable2FA') || 'Disable 2FA')}
                      </button>
                      {requires2FAVerification && (
                        <button 
                          className="btn-verify btn-sm"
                          onClick={handleVerification}
                          disabled={saving || twoFactorLoading}
                        >
                          {twoFactorLoading ? (t('verifying') || 'Verifying...') : (t('verifyNow') || 'Verify Now')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('loginAlerts') || 'Login Alerts'}</span>
                    <small>{t('notifyLoginAttempts') || 'Notify on new login attempts'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.privacy?.loginAlerts || false}
                    onChange={(e) => updateLocalSetting('privacy', 'loginAlerts', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>

              <div className="password-change-section">
                <button 
                  className="btn-secondary" 
                  onClick={() => setShowPasswordModal(true)}
                  disabled={saving}
                >
                  🔑 {t('changePassword') || 'Change Password'}
                </button>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('privacy')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('savePrivacy') || 'Save Privacy')}
              </button>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h2>✨ {t('appearanceSettings') || 'Appearance Settings'}</h2>
              <p className="section-description">{t('customizeAppLook') || 'Customize how the app looks'}</p>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('compactMode') || 'Compact Mode'}</span>
                    <small>{t('reduceSpacing') || 'Reduce spacing for more content'}</small>
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
                    <span className="toggle-label">{t('showAnimations') || 'Show Animations'}</span>
                    <small>{t('enableSmoothTransitions') || 'Enable smooth transitions'}</small>
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
                <label>{t('currencySymbol') || 'Currency Symbol'}</label>
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
                <label>{t('dateFormat') || 'Date Format'}</label>
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
              
              <button className="btn-save" onClick={() => handleSave('appearance')} disabled={saving}>
                {saving ? (t('applying') || 'Applying...') : '💾 ' + (t('saveAppearance') || 'Save Appearance')}
              </button>
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div className="settings-section">
              <h2>🌍 {t('languageRegion') || 'Language & Region'}</h2>
              <p className="section-description">{t('setLanguagePreferences') || 'Set your language and regional preferences'}</p>
              
              <div className="setting-group">
                <label>{t('language') || 'Language'}</label>
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
                <small>{t('languageChangesImmediate') || 'Language changes will be applied immediately across the entire app'}</small>
              </div>

              <div className="setting-group">
                <label>{t('currency') || 'Currency'}</label>
                <select
                  value={localSettings.language?.currency || 'USD'}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
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
                <small>{t('currencyChangesImmediate') || 'Currency changes will be applied immediately across the entire app'}</small>
              </div>
              
              <div className="setting-group">
                <label>{t('timezone') || 'Timezone'}</label>
                <select
                  value={localSettings.language?.timezone || 'UTC'}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
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
                <small>{t('timezoneChangesImmediate') || 'Timezone changes will be applied immediately across the entire app'}</small>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('language')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('saveLanguage') || 'Save Language')}
              </button>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="settings-section">
              <h2>⚡ {t('performanceSettings') || 'Performance Settings'}</h2>
              <p className="section-description">{t('optimizeAppPerformance') || 'Optimize app performance'}</p>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('enableCache') || 'Enable Cache'}</span>
                    <small>{t('fasterLoadTimes') || 'Faster load times'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.performance?.enableCache || false}
                    onChange={(e) => updateLocalSetting('performance', 'enableCache', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('autoSave') || 'Auto Save'}</span>
                    <small>{t('automaticallySaveChanges') || 'Automatically save changes'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.performance?.autoSave || false}
                    onChange={(e) => updateLocalSetting('performance', 'autoSave', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('lowDataMode') || 'Low Data Mode'}</span>
                    <small>{t('reduceDataUsage') || 'Reduce data usage'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.performance?.lowDataMode || false}
                    onChange={(e) => updateLocalSetting('performance', 'lowDataMode', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('performance')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('savePerformance') || 'Save Performance')}
              </button>
            </div>
          )}

          {/* Accessibility Tab */}
          {activeTab === 'accessibility' && (
            <div className="settings-section">
              <h2>♿ {t('accessibilitySettings') || 'Accessibility Settings'}</h2>
              <p className="section-description">{t('makeAppEasierToUse') || 'Make the app easier to use'}</p>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">{t('highContrast') || 'High Contrast'}</span>
                    <small>{t('betterVisibility') || 'Better visibility'}</small>
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
                    <span className="toggle-label">{t('reduceMotion') || 'Reduce Motion'}</span>
                    <small>{t('minimizeAnimations') || 'Minimize animations'}</small>
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
                    <span className="toggle-label">{t('screenReaderSupport') || 'Screen Reader Support'}</span>
                    <small>{t('optimizeScreenReaders') || 'Optimize for screen readers'}</small>
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
                    <span className="toggle-label">{t('keyboardNavigation') || 'Keyboard Navigation'}</span>
                    <small>{t('enhancedKeyboardSupport') || 'Enhanced keyboard support'}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility?.keyboardNavigation || false}
                    onChange={(e) => updateLocalSetting('accessibility', 'keyboardNavigation', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <button className="btn-save" onClick={() => handleSave('accessibility')} disabled={saving}>
                {saving ? (t('saving') || 'Saving...') : '💾 ' + (t('saveAccessibility') || 'Save Accessibility')}
              </button>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="settings-section">
              <h2>ℹ️ {t('aboutFinovo') || 'About Finovo'}</h2>
              <p className="section-description">{t('appInformation') || 'App information and data management'}</p>
              
              <div className="about-content">
                {/* Tenant ID from original image */}
                <div className="about-item">
                  <strong>{t('tenantId') || 'Tenant ID'}:</strong>
                  <span className="tenant-id-value" title="788412...">788412...</span>
                </div>
                
                {/* Version from original image */}
                <div className="about-item">
                  <strong>{t('version') || 'Version'}:</strong>
                  <span>3.2.0</span>
                </div>
                
                {/* Last Updated from original image */}
                <div className="about-item">
                  <strong>{t('lastUpdated') || 'Last Updated'}:</strong>
                  <span>November 2024</span>
                </div>
                
                {/* License from original image */}
                <div className="about-item">
                  <strong>{t('license') || 'License'}:</strong>
                  <span>MIT License</span>
                </div>
                
                {/* Support email from original image */}
                <div className="about-item">
                  <strong>{t('support') || 'Support'}:</strong>
                  <span>support@finovo.app</span>
                </div>
                
                {/* Action buttons */}
                <div className="about-actions">
                  <button className="btn-secondary" onClick={handleExport} disabled={saving}>
                    📥 {t('exportData') || 'Export Data'}
                  </button>
                  <button className="btn-danger" onClick={handleReset} disabled={saving}>
                    🔄 {t('resetSettings') || 'Reset All Settings'}
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
              <h3>🔑 {t('changePassword') || 'Change Password'}</h3>
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
                <label>{t('currentPassword') || 'Current Password'}</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  placeholder={t('enterCurrentPassword') || "Enter current password"}
                  disabled={saving}
                />
              </div>
              <div className="setting-group">
                <label>{t('newPassword') || 'New Password'}</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder={t('enterNewPassword') || "Enter new password (min 6 characters)"}
                  disabled={saving}
                />
              </div>
              <div className="setting-group">
                <label>{t('confirmPassword') || 'Confirm New Password'}</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder={t('confirmNewPassword') || "Confirm new password"}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => !saving && setShowPasswordModal(false)}
                disabled={saving}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button 
                className="btn-save" 
                onClick={handlePasswordChange}
                disabled={saving}
              >
                {saving ? (t('changing') || 'Changing...') : t('changePassword') || 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-show Two-Factor Authentication Verification Modal */}
      {autoShowTwoFactorModal && (
        <div className="modal-overlay auto-2fa-modal">
          <div className="modal-content two-factor-modal important-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🛡️ {t('securityVerificationRequired') || 'Security Verification Required'}</h3>
              <div className="modal-subtitle">
                <span className="priority-badge">⚠️ HIGH PRIORITY</span>
              </div>
            </div>
            
            <div className="modal-body">
              <div className="verification-required-message">
                <div className="security-icon">🔐</div>
                <div className="message-content">
                  <h4>{t('twoFactorVerificationNeeded') || 'Two-Factor Authentication Verification Needed'}</h4>
                  <p>{t('periodicVerificationDescription') || 'For your security, we require periodic verification of your 6-digit PIN. This helps protect your account from unauthorized access.'}</p>
                  
                  {twoFactorStatus.nextVerificationDate && (
                    <div className="verification-details">
                      <p><strong>Verification Due:</strong> {new Date(twoFactorStatus.nextVerificationDate).toLocaleDateString()}</p>
                      <p><strong>Last Verified:</strong> {twoFactorStatus.lastVerification ? new Date(twoFactorStatus.lastVerification).toLocaleDateString() : 'Never'}</p>
                    </div>
                  )}
                  
                  <div className="security-note">
                    <p>🛡️ <strong>Security Note:</strong> This verification is required every 15 days, similar to WhatsApp's security model.</p>
                  </div>
                </div>
              </div>
              
              <div className="setting-group">
                <label>{t('enter6DigitPin') || 'Enter 6-digit PIN'}:</label>
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
                <small>{t('enterYourPinToVerify') || 'Enter your PIN to complete verification'}</small>
              </div>
              
              <div className="modal-footer">
                <button 
                  className="btn-save" 
                  onClick={verifyPinForVerification}
                  disabled={twoFactorLoading || twoFactorData.pin.length !== 6}
                >
                  {twoFactorLoading ? (t('verifying') || 'Verifying...') : t('verifyAndContinue') || 'Verify & Continue'}
                </button>
                <small className="cannot-skip-note">This verification cannot be skipped for security reasons.</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regular Two-Factor Authentication Setup/Verification Modal */}
      {showTwoFactorModal && (
        <div className="modal-overlay" onClick={() => !twoFactorLoading && setShowTwoFactorModal(false)}>
          <div className="modal-content two-factor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {twoFactorData.step === 'pin-setup' && '🔐 ' + (t('setupPin2FA') || 'Setup 6-Digit PIN')}
                {twoFactorData.step === 'verify-pin' && '🔐 ' + (t('verifyPin2FA') || 'Verify 6-Digit PIN')}
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
              {/* PIN Setup Step */}
              {twoFactorData.step === 'pin-setup' && (
                <div className="two-factor-step">
                  <div className="step-description">
                    <p>{t('pinSetupDescription') || 'Create a 6-digit PIN for two-factor authentication. You\'ll need to enter this PIN periodically for security verification.'}</p>
                    <p className="whatsapp-style-note">🛡️ <strong>Security Note:</strong> Like WhatsApp, you'll need to verify your PIN every 15 days for added security.</p>
                  </div>
                  
                  <div className="setting-group">
                    <label>{t('enter6DigitPin') || 'Enter 6-digit PIN'}:</label>
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
                    <small>{t('pinMustBe6Digits') || 'Must be exactly 6 digits'}</small>
                  </div>

                  <div className="setting-group">
                    <label>{t('confirm6DigitPin') || 'Confirm 6-digit PIN'}:</label>
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
                      {t('cancel') || 'Cancel'}
                    </button>
                    <button 
                      className="btn-save" 
                      onClick={setupPin}
                      disabled={twoFactorLoading || twoFactorData.pin.length !== 6 || twoFactorData.confirmPin.length !== 6}
                    >
                      {twoFactorLoading ? (t('settingUp') || 'Setting Up...') : t('setupPin') || 'Setup PIN'}
                    </button>
                  </div>
                </div>
              )}

              {/* PIN Verification Step */}
              {twoFactorData.step === 'verify-pin' && (
                <div className="two-factor-step">
                  <div className="step-description">
                    <p>{t('periodicVerificationDescription') || 'For security, please verify your 6-digit PIN. This is required every 15 days.'}</p>
                    {twoFactorStatus.nextVerificationDate && (
                      <p className="verification-due">
                        Verification due since {new Date(twoFactorStatus.nextVerificationDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="setting-group">
                    <label>{t('enter6DigitPin') || 'Enter 6-digit PIN'}:</label>
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
                    <small>{t('enterYourPinToVerify') || 'Enter your PIN to complete verification'}</small>
                  </div>
                  
                  <div className="modal-footer">
                    <button 
                      className="btn-secondary" 
                      onClick={() => !twoFactorLoading && setShowTwoFactorModal(false)}
                      disabled={twoFactorLoading}
                    >
                      {t('cancel') || 'Cancel'}
                    </button>
                    <button 
                      className="btn-save" 
                      onClick={verifyPinForVerification}
                      disabled={twoFactorLoading || twoFactorData.pin.length !== 6}
                    >
                      {twoFactorLoading ? (t('verifying') || 'Verifying...') : t('verifyPin') || 'Verify PIN'}
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
              <h3>🚪 {t('signOut') || 'Sign Out'}</h3>
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
                  <h4>{t('confirmSignOut') || 'Are you sure you want to sign out?'}</h4>
                  <p>{t('signOutWarning') || 'You will need to sign in again to access your account.'}</p>
                  <ul>
                    <li>{t('unsavedChangesLost') || 'All unsaved changes will be lost'}</li>
                    <li>{t('redirectToLogin') || 'You\'ll be redirected to the login page'}</li>
                    <li>{t('sessionDataCleared') || 'Your session data will be cleared'}</li>
                    {twoFactorStatus.isEnabled && (
                      <li>🛡️ {t('twoFactorWillRemain') || 'Two-factor authentication will remain enabled'}</li>
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
                {t('cancel') || 'Cancel'}
              </button>
              <button 
                className="btn-danger" 
                onClick={handleSignout}
                disabled={saving}
              >
                {saving ? (t('signingOut') || 'Signing Out...') : t('yesSignOut') || 'Yes, Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;