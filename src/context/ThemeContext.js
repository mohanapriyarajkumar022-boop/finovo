// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#7645e8');
  const [fontSize, setFontSize] = useState('medium');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate hover color
  const calculateHoverColor = useCallback((color) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const hoverR = Math.max(0, r - 25);
    const hoverG = Math.max(0, g - 25);
    const hoverB = Math.max(0, b - 25);
    
    return `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`;
  }, []);

  // Professional light theme
  const applyLightTheme = useCallback(() => {
    document.documentElement.style.setProperty('--bg-primary', '#ffffff');
    document.documentElement.style.setProperty('--bg-secondary', '#f8f9fa');
    document.documentElement.style.setProperty('--bg-tertiary', '#f1f5f9');
    document.documentElement.style.setProperty('--bg-card', '#ffffff');
    document.documentElement.style.setProperty('--bg-card-hover', '#f8fafc');
    document.documentElement.style.setProperty('--bg-input', '#ffffff');
    document.documentElement.style.setProperty('--bg-hover', '#f3f4f6');
    document.documentElement.style.setProperty('--bg-modal', '#ffffff');
    document.documentElement.style.setProperty('--bg-dropdown', '#ffffff');
    document.documentElement.style.setProperty('--bg-tooltip', '#1f2937');
    
    document.documentElement.style.setProperty('--text-primary', '#1f2937');
    document.documentElement.style.setProperty('--text-secondary', '#6b7280');
    document.documentElement.style.setProperty('--text-muted', '#9ca3af');
    document.documentElement.style.setProperty('--text-inverse', '#ffffff');
    document.documentElement.style.setProperty('--text-placeholder', '#6b7280');
    
    document.documentElement.style.setProperty('--border-primary', '#e5e7eb');
    document.documentElement.style.setProperty('--border-secondary', '#d1d5db');
    document.documentElement.style.setProperty('--border-accent', '#cbd5e1');
    document.documentElement.style.setProperty('--border-color', '#e5e7eb');
    
    document.documentElement.style.setProperty('--shadow-sm', '0 1px 2px 0 rgba(0, 0, 0, 0.05)');
    document.documentElement.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)');
    document.documentElement.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)');
    document.documentElement.style.setProperty('--shadow-xl', '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)');
    document.documentElement.style.setProperty('--shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)');
    
    document.documentElement.style.setProperty('--gradient-from', '#ffffff');
    document.documentElement.style.setProperty('--gradient-to', '#f8fafc');
    
    document.documentElement.style.setProperty('--success-color', '#10b981');
    document.documentElement.style.setProperty('--warning-color', '#f59e0b');
    document.documentElement.style.setProperty('--error-color', '#ef4444');
    document.documentElement.style.setProperty('--danger-color', '#ef4444');
    document.documentElement.style.setProperty('--info-color', '#3b82f6');
  }, []);

  // Professional dark theme
  const applyDarkTheme = useCallback(() => {
    document.documentElement.style.setProperty('--bg-primary', '#0f1419');
    document.documentElement.style.setProperty('--bg-secondary', '#1a1f26');
    document.documentElement.style.setProperty('--bg-tertiary', '#252d38');
    document.documentElement.style.setProperty('--bg-card', '#1a1f26');
    document.documentElement.style.setProperty('--bg-card-hover', '#252d38');
    document.documentElement.style.setProperty('--bg-input', '#252d38');
    document.documentElement.style.setProperty('--bg-hover', '#2a3441');
    document.documentElement.style.setProperty('--bg-modal', '#1a1f26');
    document.documentElement.style.setProperty('--bg-dropdown', '#252d38');
    document.documentElement.style.setProperty('--bg-tooltip', '#2a3441');
    
    document.documentElement.style.setProperty('--text-primary', '#e8eaed');
    document.documentElement.style.setProperty('--text-secondary', '#9ba3af');
    document.documentElement.style.setProperty('--text-muted', '#6b7280');
    document.documentElement.style.setProperty('--text-inverse', '#0f1419');
    document.documentElement.style.setProperty('--text-placeholder', '#6b7280');
    
    document.documentElement.style.setProperty('--border-primary', '#2d3748');
    document.documentElement.style.setProperty('--border-secondary', '#374151');
    document.documentElement.style.setProperty('--border-accent', '#4b5563');
    document.documentElement.style.setProperty('--border-color', '#2d3748');
    
    document.documentElement.style.setProperty('--shadow-sm', '0 1px 3px 0 rgba(0, 0, 0, 0.5)');
    document.documentElement.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -1px rgba(0, 0, 0, 0.5)');
    document.documentElement.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.7), 0 4px 6px -2px rgba(0, 0, 0, 0.6)');
    document.documentElement.style.setProperty('--shadow-xl', '0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.7)');
    document.documentElement.style.setProperty('--shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.4)');
    
    document.documentElement.style.setProperty('--gradient-from', '#1a1f26');
    document.documentElement.style.setProperty('--gradient-to', '#0f1419');
    
    document.documentElement.style.setProperty('--success-color', '#34d399');
    document.documentElement.style.setProperty('--warning-color', '#fbbf24');
    document.documentElement.style.setProperty('--error-color', '#f87171');
    document.documentElement.style.setProperty('--danger-color', '#f87171');
    document.documentElement.style.setProperty('--info-color', '#60a5fa');
  }, []);

  // Apply theme globally
  const applyTheme = useCallback((themeMode, color, size, family) => {
    console.log('🎨 Applying theme:', { themeMode, color, size, family });
    
    // Clear all theme classes
    document.documentElement.classList.remove('light-mode', 'dark-mode', 'auto-mode');
    
    // Determine effective theme
    let effectiveTheme = themeMode;
    if (themeMode === 'auto') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = systemPrefersDark ? 'dark' : 'light';
      document.documentElement.classList.add('auto-mode');
    }
    
    // Add theme class
    document.documentElement.classList.add(`${effectiveTheme}-mode`);
    document.documentElement.setAttribute('data-theme', effectiveTheme);

    // Apply theme-specific CSS variables
    if (effectiveTheme === 'dark') {
      applyDarkTheme();
    } else {
      applyLightTheme();
    }

    // Apply primary color
    const primaryHover = calculateHoverColor(color);
    document.documentElement.style.setProperty('--primary-color', color);
    document.documentElement.style.setProperty('--primary-hover', primaryHover);
    document.documentElement.style.setProperty('--primary-50', `${color}20`);
    document.documentElement.style.setProperty('--primary-100', `${color}30`);
    document.documentElement.style.setProperty('--primary-200', `${color}40`);
    
    // Enhanced primary color variants for dark mode
    if (effectiveTheme === 'dark') {
      document.documentElement.style.setProperty('--primary-color-dark', calculateHoverColor(color));
      document.documentElement.style.setProperty('--primary-color-light', `${color}80`);
    }
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    document.documentElement.style.setProperty('--base-font-size', fontSizeMap[size] || '16px');
    
    // Apply font family
    document.documentElement.style.setProperty('--font-family', `${family}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`);

    // Enhanced smooth transitions
    document.documentElement.style.setProperty('--transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
    document.documentElement.style.setProperty('--transition-fast', 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)');
    document.documentElement.style.setProperty('--transition-slow', 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)');

    console.log('✅ Theme applied successfully:', { 
      mode: themeMode, 
      effective: effectiveTheme, 
      color, 
      size, 
      family
    });
  }, [calculateHoverColor, applyLightTheme, applyDarkTheme]);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    const savedPrimaryColor = localStorage.getItem('primary-color') || '#7645e8';
    const savedFontSize = localStorage.getItem('font-size') || 'medium';
    const savedFontFamily = localStorage.getItem('font-family') || 'Inter';

    console.log('🚀 Initializing theme:', {
      theme: savedTheme,
      color: savedPrimaryColor,
      size: savedFontSize,
      family: savedFontFamily
    });

    setTheme(savedTheme);
    setPrimaryColor(savedPrimaryColor);
    setFontSize(savedFontSize);
    setFontFamily(savedFontFamily);
    
    // Apply theme immediately
    applyTheme(savedTheme, savedPrimaryColor, savedFontSize, savedFontFamily);
    setIsInitialized(true);
  }, [applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      console.log('🔄 System theme changed:', e.matches ? 'dark' : 'light');
      applyTheme('auto', primaryColor, fontSize, fontFamily);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, primaryColor, fontSize, fontFamily, applyTheme]);

  // Update theme
  const updateTheme = useCallback((newTheme) => {
    console.log('🔄 Updating theme to:', newTheme);
    setTheme(newTheme);
    applyTheme(newTheme, primaryColor, fontSize, fontFamily);
    localStorage.setItem('app-theme', newTheme);
  }, [primaryColor, fontSize, fontFamily, applyTheme]);

  // Update primary color
  const updatePrimaryColor = useCallback((color) => {
    console.log('🎨 Updating primary color to:', color);
    setPrimaryColor(color);
    applyTheme(theme, color, fontSize, fontFamily);
    localStorage.setItem('primary-color', color);
  }, [theme, fontSize, fontFamily, applyTheme]);

  // Update font size
  const updateFontSize = useCallback((size) => {
    console.log('📏 Updating font size to:', size);
    setFontSize(size);
    applyTheme(theme, primaryColor, size, fontFamily);
    localStorage.setItem('font-size', size);
  }, [theme, primaryColor, fontFamily, applyTheme]);

  // Update font family
  const updateFontFamily = useCallback((family) => {
    console.log('🔤 Updating font family to:', family);
    setFontFamily(family);
    applyTheme(theme, primaryColor, fontSize, family);
    localStorage.setItem('font-family', family);
  }, [theme, primaryColor, fontSize, applyTheme]);

  // Update all theme settings at once
  const updateThemeSettings = useCallback((settings) => {
    console.log('🎯 Updating all theme settings:', settings);
    
    const newTheme = settings.mode || theme;
    const newColor = settings.primaryColor || primaryColor;
    const newSize = settings.fontSize || fontSize;
    const newFamily = settings.fontFamily || fontFamily;

    setTheme(newTheme);
    setPrimaryColor(newColor);
    setFontSize(newSize);
    setFontFamily(newFamily);
    
    applyTheme(newTheme, newColor, newSize, newFamily);
    
    // Save to localStorage
    localStorage.setItem('app-theme', newTheme);
    localStorage.setItem('primary-color', newColor);
    localStorage.setItem('font-size', newSize);
    localStorage.setItem('font-family', newFamily);
  }, [theme, primaryColor, fontSize, fontFamily, applyTheme]);

  const value = {
    theme,
    primaryColor,
    fontSize,
    fontFamily,
    isInitialized,
    updateTheme,
    updatePrimaryColor,
    updateFontSize,
    updateFontFamily,
    updateThemeSettings
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};