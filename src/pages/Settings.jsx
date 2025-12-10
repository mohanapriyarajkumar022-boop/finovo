// src/pages/settings.jsx - COMPLETE FIXED VERSION (MongoDB Database Storage)
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import './Settings.css';

const Settings = () => {
  const { settings, updateSettings, resetSettings, loading, error, refetchSettings, checkAuthentication, isAuthenticated } = useSettings();
  const { t, language, updateLanguage } = useLanguage();
  const { theme, updateTheme, updateThemeSettings } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [saveStatus, setSaveStatus] = useState('');
  const [localSettings, setLocalSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [autoShowTwoFactorModal, setAutoShowTwoFactorModal] = useState(false);
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
  const [hasAutoShown2FA, setHasAutoShown2FA] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

  // ✅ Get current user email from localStorage (always up-to-date)
  const getCurrentUserEmail = () => {
    const emailFromStorage = localStorage.getItem('userEmail');
    const emailFromSettings = settings?.profile?.email;
    return emailFromStorage || emailFromSettings || '';
  };

  // ✅ Get current user name from localStorage
  const getCurrentUserName = () => {
    const nameFromStorage = localStorage.getItem('userName');
    const nameFromSettings = settings?.profile?.name;
    return nameFromStorage || nameFromSettings || '';
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

  // ✅ Get auth headers for API calls
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

  // ✅ Check 2FA status from backend
  const checkTwoFactorStatusFromBackend = async () => {
    try {
      const headers = getAuthHeaders();
      const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
      
      if (!token) {
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
        return {
          isEnabled: data.enabled || false,
          needsVerification: data.verificationRequired || false,
          nextVerificationDate: data.nextVerificationDate || null,
          lastVerification: data.lastVerification || null
        };
      } else {
        return {
          isEnabled: false,
          needsVerification: false,
          nextVerificationDate: null,
          lastVerification: null
        };
      }
    } catch (error) {
      return {
        isEnabled: false,
        needsVerification: false,
        nextVerificationDate: null,
        lastVerification: null
      };
    }
  };

  // ✅ Initialize local settings and check 2FA status
  useEffect(() => {
    const initializeSettings = async () => {
      if (settings) {
        console.log('🔧 Initializing settings from context:', settings.profile?.email);
        
        const initialSettings = JSON.parse(JSON.stringify(settings));
        setLocalSettings(initialSettings);
        
        const userEmail = getCurrentUserEmail();
        const userName = getCurrentUserName();
        
        setCurrentUserEmail(userEmail);
        setCurrentUserName(userName);
        
        console.log('🔧 Current user from localStorage - Email:', userEmail, 'Name:', userName);
        
        if (userEmail && initialSettings.profile?.email !== userEmail) {
          initialSettings.profile.email = userEmail;
        }
        
        if (userName && initialSettings.profile?.name !== userName) {
          initialSettings.profile.name = userName;
        }
        
        if (initialSettings.profile?.profilePhoto) {
          setImagePreview(initialSettings.profile.profilePhoto);
        }
        
        // Check 2FA status from backend
        setIsChecking2FA(true);
        try {
          const backend2FAStatus = await checkTwoFactorStatusFromBackend();
          
          setTwoFactorStatus(backend2FAStatus);
          setRequires2FAVerification(backend2FAStatus.needsVerification);
          
          if (initialSettings.privacy?.twoFactorAuth !== backend2FAStatus.isEnabled) {
            const updatedSettings = {
              ...initialSettings,
              privacy: {
                ...initialSettings.privacy,
                twoFactorAuth: backend2FAStatus.isEnabled
              }
            };
            setLocalSettings(updatedSettings);
            
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

  // ✅ Check 2FA status when privacy tab is active
  useEffect(() => {
    const check2FAStatus = async () => {
      if ((activeTab === 'privacy' || twoFactorLoading) && isAuthenticated) {
        try {
          const headers = getAuthHeaders();
          
          const verificationResponse = await fetch('http://localhost:5000/api/two-factor/verification-required', {
            method: 'GET',
            headers: headers
          });

          if (verificationResponse.ok) {
            const verificationData = await verificationResponse.json();
            setRequires2FAVerification(verificationData.required || false);
          }
          
          const statusResponse = await fetch('http://localhost:5000/api/two-factor/status', {
            method: 'GET',
            headers: headers
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            const newStatus = {
              isEnabled: statusData.enabled || false,
              needsVerification: statusData.verificationRequired || false,
              nextVerificationDate: statusData.nextVerificationDate || null,
              lastVerification: statusData.lastVerification || null
            };
            
            setTwoFactorStatus(newStatus);
            
            if (localSettings && localSettings.privacy?.twoFactorAuth !== newStatus.isEnabled) {
              updateLocalSetting('privacy', 'twoFactorAuth', newStatus.isEnabled);
            }
          }
        } catch (error) {
          console.log('Error checking 2FA status:', error.message);
        }
      }
    };

    check2FAStatus();
  }, [activeTab, twoFactorLoading, localSettings, isAuthenticated]);

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
      
      if (section === 'privacy' && key === 'twoFactorAuth') {
        setTwoFactorStatus(prevStatus => ({
          ...prevStatus,
          isEnabled: value
        }));
      }
      
      return newSettings;
    });
  };

  // ✅ Handle save settings - DATABASE ONLY
  const handleSave = async (section) => {
    if (!localSettings || !localSettings[section]) {
      setSaveStatus('❌ No settings to save');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to save settings to MongoDB database');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    setSaving(true);
    
    const settingsData = { ...localSettings[section] };
    
    if (section === 'profile') {
      const currentEmail = getCurrentUserEmail();
      if (currentEmail) {
        settingsData.email = currentEmail;
      }
    }
    
    console.log('💾 Saving to MongoDB Database - Section:', section, 'Data:', settingsData);
    
    try {
      const result = await updateSettings(section, settingsData);
      
      if (result.success) {
        setSaveStatus('✅ Settings saved to MongoDB database!');
        await refetchSettings();
      } else {
        setSaveStatus(`❌ Database Error: ${result.error || 'Failed to save to database'}`);
      }
    } catch (error) {
      setSaveStatus(`❌ Database Connection Error: ${error.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  // ✅ Send notification email
  const sendNotificationEmail = async (type) => {
    try {
      if (!isAuthenticated) {
        return;
      }

      const headers = getAuthHeaders();
      const userEmail = getCurrentUserEmail();
      const userName = getCurrentUserName();
      
      if (!userEmail) {
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
      }
    } catch (error) {
      console.log('Error sending notification email:', error.message);
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

  // ✅ Currency change handler
  const handleCurrencyChange = async (newCurrency) => {
    if (!localSettings || saving) return;
    
    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to change currency');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    setSaving(true);
    
    try {
      updateLocalSetting('language', 'currency', newCurrency);
      
      const updatedLanguageSettings = {
        ...localSettings.language,
        currency: newCurrency
      };
      
      const result = await updateSettings('language', updatedLanguageSettings);
      
      if (result.success) {
        setSaveStatus(`✅ Currency changed to ${newCurrency}!`);
        localStorage.setItem('userCurrency', newCurrency);
        
        window.dispatchEvent(new CustomEvent('currencyChanged', {
          detail: { currency: newCurrency }
        }));
        
        await refetchSettings();
      } else {
        setSaveStatus('❌ Failed to change currency');
      }
    } catch (error) {
      console.log('Currency change error:', error);
      setSaveStatus('❌ Error changing currency');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Timezone change handler
  const handleTimezoneChange = async (newTimezone) => {
    if (!localSettings || saving) return;
    
    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to change timezone');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    setSaving(true);
    
    try {
      updateLocalSetting('language', 'timezone', newTimezone);
      
      const updatedLanguageSettings = {
        ...localSettings.language,
        timezone: newTimezone
      };
      
      const result = await updateSettings('language', updatedLanguageSettings);
      
      if (result.success) {
        setSaveStatus(`✅ Timezone changed to ${newTimezone}!`);
        localStorage.setItem('userTimezone', newTimezone);
        
        window.dispatchEvent(new CustomEvent('timezoneChanged', {
          detail: { timezone: newTimezone }
        }));
        
        await refetchSettings();
      } else {
        setSaveStatus('❌ Failed to change timezone');
      }
    } catch (error) {
      console.log('Timezone change error:', error);
      setSaveStatus('❌ Error changing timezone');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Theme change handler
  const handleThemeChange = async (newTheme) => {
    if (!localSettings || saving) return;
    
    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to change theme');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    updateLocalSetting('theme', 'mode', newTheme);
    
    setSaving(true);
    
    try {
      updateTheme(newTheme);
      
      const updatedThemeSettings = {
        ...localSettings.theme,
        mode: newTheme
      };
      
      const result = await updateSettings('theme', updatedThemeSettings);
      
      if (result.success) {
        setSaveStatus(`✅ Theme changed to ${newTheme}!`);
        
        updateThemeSettings({
          mode: newTheme,
          primaryColor: updatedThemeSettings.primaryColor,
          fontSize: updatedThemeSettings.fontSize,
          fontFamily: updatedThemeSettings.fontFamily
        });
        
        await refetchSettings();
      } else {
        setSaveStatus('❌ Failed to change theme');
      }
    } catch (error) {
      console.log('Theme change error:', error);
      setSaveStatus('❌ Error changing theme');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Primary color change
  const handlePrimaryColorChange = async (color) => {
    if (!localSettings || saving) return;
    
    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to change color');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    updateLocalSetting('theme', 'primaryColor', color);
    
    updateThemeSettings({
      mode: theme,
      primaryColor: color,
      fontSize: localSettings.theme?.fontSize,
      fontFamily: localSettings.theme?.fontFamily
    });
    
    setSaving(true);
    try {
      const updatedThemeSettings = {
        ...localSettings.theme,
        primaryColor: color
      };
      
      const result = await updateSettings('theme', updatedThemeSettings);
      
      if (result.success) {
        setSaveStatus(`✅ Primary color changed!`);
        await refetchSettings();
      } else {
        setSaveStatus('❌ Failed to save color');
      }
    } catch (error) {
      console.log('Color change error:', error);
      setSaveStatus('❌ Error changing color');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // ✅ Font size change
  const handleFontSizeChange = async (size) => {
    if (!localSettings || saving) return;
    
    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to change font size');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    updateLocalSetting('theme', 'fontSize', size);
    
    updateThemeSettings({
      mode: theme,
      primaryColor: localSettings.theme?.primaryColor,
      fontSize: size,
      fontFamily: localSettings.theme?.fontFamily
    });
    
    setSaving(true);
    try {
      const updatedThemeSettings = {
        ...localSettings.theme,
        fontSize: size
      };
      
      const result = await updateSettings('theme', updatedThemeSettings);
      
      if (result.success) {
        setSaveStatus(`✅ Font size changed!`);
        await refetchSettings();
      } else {
        setSaveStatus('❌ Failed to save font size');
      }
    } catch (error) {
      console.log('Font size change error:', error);
      setSaveStatus('❌ Error changing font size');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // ✅ Font family change
  const handleFontFamilyChange = async (family) => {
    if (!localSettings || saving) return;
    
    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to change font family');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

    updateLocalSetting('theme', 'fontFamily', family);
    
    updateThemeSettings({
      mode: theme,
      primaryColor: localSettings.theme?.primaryColor,
      fontSize: localSettings.theme?.fontSize,
      fontFamily: family
    });
    
    setSaving(true);
    try {
      const updatedThemeSettings = {
        ...localSettings.theme,
        fontFamily: family
      };
      
      const result = await updateSettings('theme', updatedThemeSettings);
      
      if (result.success) {
        setSaveStatus(`✅ Font family changed!`);
        await refetchSettings();
      } else {
        setSaveStatus('❌ Failed to save font family');
      }
    } catch (error) {
      console.log('Font family change error:', error);
      setSaveStatus('❌ Error changing font family');
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
        setSaveStatus('❌ Image size should be less than 5MB');
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
      setSaveStatus('❌ Passwords do not match');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setSaveStatus('❌ Password must be at least 6 characters');
      setTimeout(() => setSaveStatus(''), 3000);
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
        setSaveStatus('✅ Password changed successfully!');
        
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
      setSaveStatus('❌ Error changing password');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Two-factor authentication toggle handler
  const handleTwoFactorAuth = async (enable) => {
    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to enable two-factor authentication');
      setTimeout(() => setSaveStatus(''), 5000);
      updateLocalSetting('privacy', 'twoFactorAuth', !enable);
      return;
    }

    if (!enable) {
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
        
        if (data.success) {
          setTwoFactorStatus({
            isEnabled: false,
            needsVerification: false,
            nextVerificationDate: null,
            lastVerification: null
          });
          setRequires2FAVerification(false);
          
          updateLocalSetting('privacy', 'twoFactorAuth', false);
          
          localStorage.removeItem('twoFactorEnabled');
          localStorage.removeItem('last2FACheck');
          
          setSaveStatus('✅ Two-factor authentication disabled!');
          
          if (localSettings.notifications?.email) {
            await sendNotificationEmail('twoFactorDisabled');
          }
          
          await refetchSettings();
        } else {
          setSaveStatus('❌ ' + (data.message || 'Failed to disable two-factor authentication'));
          updateLocalSetting('privacy', 'twoFactorAuth', true);
        }
      } catch (error) {
        console.log('2FA disable error:', error);
        setSaveStatus('❌ Error disabling two-factor authentication');
        updateLocalSetting('privacy', 'twoFactorAuth', true);
      } finally {
        setTwoFactorLoading(false);
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } else {
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
      setSaveStatus('❌ PIN must be exactly 6 digits');
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
      
      if (data.success) {
        const nextVerificationDate = data.nextVerificationDate ? new Date(data.nextVerificationDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        
        setTwoFactorStatus({
          isEnabled: true,
          needsVerification: false,
          nextVerificationDate: nextVerificationDate,
          lastVerification: new Date()
        });
        setRequires2FAVerification(false);
        
        updateLocalSetting('privacy', 'twoFactorAuth', true);
        
        localStorage.setItem('twoFactorEnabled', 'true');
        localStorage.setItem('last2FASetup', new Date().toISOString());
        localStorage.setItem('last2FACheck', new Date().toISOString());
        
        if (localSettings.notifications?.email) {
          await sendNotificationEmail('twoFactorEnabled');
        }
        
        setShowTwoFactorModal(false);
        setTwoFactorData({
          step: 'pin-setup',
          pin: '',
          confirmPin: ''
        });
        
        setSaveStatus('✅ Two-factor authentication enabled with 6-digit PIN!');
        
        await refetchSettings();
        
        setTimeout(() => {
          checkTwoFactorStatusFromBackend().then(status => {
            setTwoFactorStatus(status);
            updateLocalSetting('privacy', 'twoFactorAuth', status.isEnabled);
          });
        }, 500);
      } else {
        setSaveStatus('❌ ' + (data.message || 'Failed to setup PIN'));
        updateLocalSetting('privacy', 'twoFactorAuth', false);
      }
    } catch (error) {
      console.log('PIN setup error:', error);
      setSaveStatus('❌ Error setting up PIN');
      updateLocalSetting('privacy', 'twoFactorAuth', false);
    } finally {
      setTwoFactorLoading(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Handle verification
  const handleVerification = async () => {
    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to verify two-factor authentication');
      setTimeout(() => setSaveStatus(''), 5000);
      return;
    }

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
      setSaveStatus('❌ PIN must be exactly 6 digits');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    if (!isAuthenticated) {
      setSaveStatus('❌ Please log in to verify PIN');
      setTimeout(() => setSaveStatus(''), 5000);
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
      
      if (data.success) {
        const nextVerificationDate = data.nextVerificationDate ? new Date(data.nextVerificationDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        
        setTwoFactorStatus(prev => ({
          ...prev,
          needsVerification: false,
          nextVerificationDate: nextVerificationDate,
          lastVerification: new Date()
        }));
        setRequires2FAVerification(false);
        
        setShowTwoFactorModal(false);
        setAutoShowTwoFactorModal(false);
        
        setTwoFactorData({
          step: 'pin-setup',
          pin: '',
          confirmPin: ''
        });
        
        setSaveStatus('✅ Verification successful!');
        
        localStorage.setItem('last2FAVerification', new Date().toISOString());
        localStorage.setItem('last2FACheck', new Date().toISOString());
        
        await refetchSettings();
      } else {
        setSaveStatus('❌ ' + (data.message || 'Verification failed'));
      }
    } catch (error) {
      console.log('Verification error:', error);
      setSaveStatus('❌ Error during verification');
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
          console.log('Backend logout failed');
        }
      }
      
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
        '2FAAutoShown'
      ];
      
      itemsToRemove.forEach(item => {
        localStorage.removeItem(item);
        sessionStorage.removeItem(item);
      });
      
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      setSaving(false);
      setShowSignoutModal(false);
      
      setSaveStatus('✅ Successfully signed out!');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
    } catch (error) {
      console.log('Signout error:', error);
      setSaving(false);
      setSaveStatus('❌ Error during signout');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // ✅ Reset settings - DATABASE ONLY
  const handleReset = async () => {
    if (window.confirm('⚠️ Are you sure you want to reset all settings to default? This cannot be undone.')) {
      if (!isAuthenticated) {
        setSaveStatus('❌ Please log in to reset settings');
        setTimeout(() => setSaveStatus(''), 5000);
        return;
      }

      setSaving(true);
      const result = await resetSettings(getTenantId());
      setSaving(false);
      
      if (result.success) {
        setSaveStatus('✅ Settings reset successfully in MongoDB database!');
        
        if (localSettings.notifications?.email) {
          await sendNotificationEmail('settingsReset');
        }
        
        await refetchSettings();
        
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('❌ Error resetting settings in database');
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
      
      setSaveStatus('✅ Data exported successfully from MongoDB database!');
      
      if (localSettings.notifications?.email) {
        await sendNotificationEmail('dataExported');
      }
      
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.log('Export error:', error);
      setSaveStatus('❌ Error exporting data from database');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  if (loading || !localSettings || isChecking2FA) {
    return (
      <div className="settings-loading">
        <div className="loader-spinner"></div>
        <p>Loading your settings from MongoDB database...</p>
        <small>Please wait while we fetch your settings from the database</small>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-error">
        <div className="error-icon">⚠️</div>
        <h2>Failed to Load Settings</h2>
        <p>MongoDB Database Error: {error}</p>
        <p className="error-note">
          ⚠️ Settings are stored in MongoDB database. Please check your:
          <br />1. Internet connection
          <br />2. Backend server (localhost:5000)
          <br />3. MongoDB connection
          <br />4. Authentication status
        </p>
        <button onClick={() => refetchSettings()} className="btn-save">
          Retry Loading from Database
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

  const userEmail = getCurrentUserEmail();
  const userName = getCurrentUserName();

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div>
          <h1>⚙️ Settings</h1>
          <p className="settings-subtitle">Manage your account preferences and app behavior</p>
          <div className="database-indicator">
            <span className="db-badge">💾 MongoDB Database</span>
            <small>
              {isAuthenticated ? 
                '✅ All settings are saved to MongoDB database' : 
                '⚠️ Please log in to save settings to database'
              }
            </small>
            {!isAuthenticated && (
              <button 
                onClick={() => window.location.href = '/login'}
                className="btn-login-prompt"
              >
                🔑 Log In to Save to Database
              </button>
            )}
          </div>
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
              onClick={handlePeriodicVerification}
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
              <h2>👤 Profile Settings</h2>
              <p className="section-description">Update your profile picture and view your information (Saved to MongoDB)</p>
              
              <div className="profile-header-section">
                <div className="profile-image-container">
                  <div className="profile-image-wrapper">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="profile-image" />
                    ) : (
                      <div className="profile-image-placeholder">
                        <span className="profile-initials">
                          {userName.charAt(0).toUpperCase()}
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
                    <h3>{userName || 'User'}</h3>
                    <p className="profile-email">{userEmail}</p>
                    <small>Click on the camera icon to upload a new photo</small>
                  </div>
                </div>
              </div>
              
              <div className="setting-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={userName || ''}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    updateLocalSetting('profile', 'name', newVal);
                    setCurrentUserName(newVal);
                    localStorage.setItem('userName', newVal);
                  }}
                  placeholder="Enter your display name"
                  disabled={saving}
                />
              </div>
              
              <div className="setting-group">
                <label>Email Address (Read Only)</label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="readonly-input"
                  readOnly
                />
                <small>Email cannot be changed here. Contact support to update.</small>
              </div>
              
              <div className="setting-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={localSettings.profile?.phone || ''}
                  onChange={(e) => updateLocalSetting('profile', 'phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={saving}
                />
              </div>
              
              <div className="setting-group">
                <label>Bio</label>
                <textarea
                  value={localSettings.profile?.bio || ''}
                  onChange={(e) => updateLocalSetting('profile', 'bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows="4"
                  disabled={saving}
                />
              </div>
              
              <button 
                className="btn-save" 
                onClick={() => handleSave('profile')} 
                disabled={saving || !isAuthenticated}
                title={!isAuthenticated ? "Please log in to save to database" : ""}
              >
                {saving ? '💾 Saving to MongoDB...' : '💾 Save Profile to MongoDB Database'}
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save to database</small>}
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="settings-section">
              <h2>🏢 Account Type</h2>
              <p className="section-description">Choose your account type based on your needs (Saved to MongoDB)</p>
              
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
                title={!isAuthenticated ? "Please log in to save to database" : ""}
              >
                {saving ? '💾 Saving to MongoDB...' : '💾 Save Account Type to MongoDB Database'}
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save to database</small>}
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div className="settings-section">
              <h2>🎨 Theme Settings</h2>
              <p className="section-description">Customize your app appearance (Saved to MongoDB)</p>
              
              <div className="setting-group">
                <label>Theme Mode</label>
                <select
                  value={localSettings.theme?.mode || 'light'}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="light">☀️ Light Mode</option>
                  <option value="dark">🌙 Dark Mode</option>
                  <option value="auto">🔄 Auto (System)</option>
                </select>
                <small>Theme changes will be applied immediately across the entire app</small>
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
              </div>
              
              <div className="setting-group">
                <label>Font Size</label>
                <select
                  value={localSettings.theme?.fontSize || 'medium'}
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                  disabled={saving}
                >
                  <option value="small">Small (14px)</option>
                  <option value="medium">Medium (16px)</option>
                  <option value="large">Large (18px)</option>
                </select>
              </div>
              
              <div className="setting-group">
                <label>Font Family</label>
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
              
              <button 
                className="btn-save" 
                onClick={() => handleSave('theme')} 
                disabled={saving || !isAuthenticated}
                title={!isAuthenticated ? "Please log in to save to database" : ""}
              >
                {saving ? '💾 Saving to MongoDB...' : '💾 Save Theme to MongoDB Database'}
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save to database</small>}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>🔔 Notification Settings</h2>
              <p className="section-description">Control how you receive notifications (Saved to MongoDB)</p>
              
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
                title={!isAuthenticated ? "Please log in to save to database" : ""}
              >
                {saving ? '💾 Saving to MongoDB...' : '💾 Save Notifications to MongoDB Database'}
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save to database</small>}
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h2>🔒 Privacy & Security</h2>
              <p className="section-description">Manage your privacy and security preferences (Saved to MongoDB)</p>
              
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
              
              {/* Two-Factor Authentication Section */}
              <div className="two-factor-section">
                <div className="setting-group toggle-group">
                  <label>
                    <div>
                      <span className="toggle-label">Two-Factor Authentication</span>
                      <small>
                        {twoFactorStatus.isEnabled 
                          ? 'Extra security enabled with 6-digit PIN. Verification required every 15 days.'
                          : 'Add extra security to your account with a 6-digit PIN. When enabled, you\'ll need to enter your PIN periodically.'
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
                        disabled={saving || twoFactorLoading || !isAuthenticated}
                      >
                        {twoFactorLoading ? 'Disabling...' : 'Disable 2FA'}
                      </button>
                      {requires2FAVerification && (
                        <button 
                          className="btn-verify btn-sm"
                          onClick={handleVerification}
                          disabled={saving || twoFactorLoading || !isAuthenticated}
                        >
                          {twoFactorLoading ? 'Verifying...' : 'Verify Now'}
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

              <div className="password-change-section">
                <button 
                  className="btn-secondary" 
                  onClick={() => setShowPasswordModal(true)}
                  disabled={saving || !isAuthenticated}
                >
                  🔑 Change Password
                </button>
              </div>
              
              <button 
                className="btn-save" 
                onClick={() => handleSave('privacy')} 
                disabled={saving || !isAuthenticated}
                title={!isAuthenticated ? "Please log in to save to database" : ""}
              >
                {saving ? '💾 Saving to MongoDB...' : '💾 Save Privacy to MongoDB Database'}
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save to database</small>}
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h2>✨ Appearance Settings</h2>
              <p className="section-description">Customize how the app looks (Saved to MongoDB)</p>
              
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
                title={!isAuthenticated ? "Please log in to save to database" : ""}
              >
                {saving ? '💾 Saving to MongoDB...' : '💾 Save Appearance to MongoDB Database'}
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save to database</small>}
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div className="settings-section">
              <h2>🌍 Language & Region</h2>
              <p className="section-description">Set your language and regional preferences (Saved to MongoDB)</p>
              
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
                <small>Language changes will be applied immediately across the entire app</small>
              </div>

              <div className="setting-group">
                <label>Currency</label>
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
                <small>Currency changes will be applied immediately across the entire app</small>
              </div>
              
              <div className="setting-group">
                <label>Timezone</label>
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
                <small>Timezone changes will be applied immediately across the entire app</small>
              </div>
              
              <button 
                className="btn-save" 
                onClick={() => handleSave('language')} 
                disabled={saving || !isAuthenticated}
                title={!isAuthenticated ? "Please log in to save to database" : ""}
              >
                {saving ? '💾 Saving to MongoDB...' : '💾 Save Language to MongoDB Database'}
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save to database</small>}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="settings-section">
              <h2>⚡ Performance Settings</h2>
              <p className="section-description">Optimize app performance (Saved to MongoDB)</p>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">Enable Cache</span>
                    <small>Faster load times</small>
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
                    <span className="toggle-label">Auto Save</span>
                    <small>Automatically save changes</small>
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
                    <span className="toggle-label">Low Data Mode</span>
                    <small>Reduce data usage</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.performance?.lowDataMode || false}
                    onChange={(e) => updateLocalSetting('performance', 'lowDataMode', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <button 
                className="btn-save" 
                onClick={() => handleSave('performance')} 
                disabled={saving || !isAuthenticated}
                title={!isAuthenticated ? "Please log in to save to database" : ""}
              >
                {saving ? '💾 Saving to MongoDB...' : '💾 Save Performance to MongoDB Database'}
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save to database</small>}
            </div>
          )}

          {/* Accessibility Tab */}
          {activeTab === 'accessibility' && (
            <div className="settings-section">
              <h2>♿ Accessibility Settings</h2>
              <p className="section-description">Make the app easier to use (Saved to MongoDB)</p>
              
              <div className="setting-group toggle-group">
                <label>
                  <div>
                    <span className="toggle-label">High Contrast</span>
                    <small>Better visibility</small>
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
                    <small>Minimize animations</small>
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
                    <small>Optimize for screen readers</small>
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
                    <small>Enhanced keyboard support</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility?.keyboardNavigation || false}
                    onChange={(e) => updateLocalSetting('accessibility', 'keyboardNavigation', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              </div>
              
              <button 
                className="btn-save" 
                onClick={() => handleSave('accessibility')} 
                disabled={saving || !isAuthenticated}
                title={!isAuthenticated ? "Please log in to save to database" : ""}
              >
                {saving ? '💾 Saving to MongoDB...' : '💾 Save Accessibility to MongoDB Database'}
              </button>
              {!isAuthenticated && <small className="auth-warning">⚠️ Please log in to save to database</small>}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="settings-section">
              <h2>ℹ️ About Finovo</h2>
              <p className="section-description">App information and data management (All data in MongoDB)</p>
              
              <div className="about-content">
                <div className="about-item">
                  <strong>Tenant ID:</strong>
                  <span className="tenant-id-value" title={getTenantId()}>{getTenantId().substring(0, 10)}...</span>
                </div>
                
                <div className="about-item">
                  <strong>Version:</strong>
                  <span>3.2.0</span>
                </div>
                
                <div className="about-item">
                  <strong>Last Updated:</strong>
                  <span>November 2024</span>
                </div>
                
                <div className="about-item">
                  <strong>License:</strong>
                  <span>MIT License</span>
                </div>
                
                <div className="about-item">
                  <strong>Support:</strong>
                  <span>support@finovo.app</span>
                </div>
                
                <div className="about-item">
                  <strong>Current User:</strong>
                  <span className="user-email-info">{userEmail}</span>
                </div>
                
                <div className="about-item">
                  <strong>Storage:</strong>
                  <span className="storage-info">💾 MongoDB Database</span>
                </div>
                
                <div className="about-item">
                  <strong>Database Status:</strong>
                  <span className={`db-status ${isAuthenticated ? 'connected' : 'disconnected'}`}>
                    {isAuthenticated ? '✅ Connected' : '❌ Not Connected'}
                  </span>
                </div>
                
                <div className="about-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={handleExport} 
                    disabled={saving || !isAuthenticated}
                    title={!isAuthenticated ? "Please log in to export data" : ""}
                  >
                    📥 Export Data from MongoDB
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={handleReset} 
                    disabled={saving || !isAuthenticated}
                    title={!isAuthenticated ? "Please log in to reset settings" : ""}
                  >
                    🔄 Reset All Settings in MongoDB
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
                  placeholder="Enter current password"
                  disabled={saving}
                />
              </div>
              <div className="setting-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder="Enter new password (min 6 characters)"
                  disabled={saving}
                />
              </div>
              <div className="setting-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
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
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handlePasswordChange}
                disabled={saving}
              >
                {saving ? 'Changing...' : 'Change Password in Database'}
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
              <h3>🛡️ Security Verification Required</h3>
              <div className="modal-subtitle">
                <span className="priority-badge">⚠️ HIGH PRIORITY</span>
              </div>
            </div>
            
            <div className="modal-body">
              <div className="verification-required-message">
                <div className="security-icon">🔐</div>
                <div className="message-content">
                  <h4>Two-Factor Authentication Verification Needed</h4>
                  <p>For your security, we require periodic verification of your 6-digit PIN. This helps protect your account from unauthorized access.</p>
                  
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
                <small>Enter your PIN to complete verification</small>
              </div>
              
              <div className="modal-footer">
                <button 
                  className="btn-save" 
                  onClick={verifyPinForVerification}
                  disabled={twoFactorLoading || twoFactorData.pin.length !== 6}
                >
                  {twoFactorLoading ? 'Verifying...' : 'Verify & Continue'}
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
                {twoFactorData.step === 'pin-setup' && '🔐 Setup 6-Digit PIN'}
                {twoFactorData.step === 'verify-pin' && '🔐 Verify 6-Digit PIN'}
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
                    <p>Create a 6-digit PIN for two-factor authentication. You'll need to enter this PIN periodically for security verification.</p>
                    <p className="whatsapp-style-note">🛡️ <strong>Security Note:</strong> Like WhatsApp, you'll need to verify your PIN every 15 days for added security.</p>
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
                    <small>Must be exactly 6 digits</small>
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

              {/* PIN Verification Step */}
              {twoFactorData.step === 'verify-pin' && (
                <div className="two-factor-step">
                  <div className="step-description">
                    <p>For security, please verify your 6-digit PIN. This is required every 15 days.</p>
                    {twoFactorStatus.nextVerificationDate && (
                      <p className="verification-due">
                        Verification due since {new Date(twoFactorStatus.nextVerificationDate).toLocaleDateString()}
                      </p>
                    )}
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
                    <small>Enter your PIN to complete verification</small>
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
                      onClick={verifyPinForVerification}
                      disabled={twoFactorLoading || twoFactorData.pin.length !== 6}
                    >
                      {twoFactorLoading ? 'Verifying...' : 'Verify PIN'}
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
              <h3>🚪 Sign Out</h3>
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
                  <h4>Are you sure you want to sign out?</h4>
                  <p>You will need to sign in again to access your account.</p>
                  <ul>
                    <li>All unsaved changes will be lost</li>
                    <li>You'll be redirected to the login page</li>
                    <li>Your session data will be cleared</li>
                    {twoFactorStatus.isEnabled && (
                      <li>🛡️ Two-factor authentication will remain enabled in database</li>
                    )}
                    <li>💾 Your settings are safely stored in MongoDB database</li>
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
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={handleSignout}
                disabled={saving}
              >
                {saving ? 'Signing Out...' : 'Yes, Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;